"use server"

import { createSupabaseServerClient } from "@/lib/tenant"
import { getTenantClient } from "@/lib/tenant"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderRecord {
    id: string
    name: string
    customer: string
    grand_total: number
    outstanding_amount: number
    posting_date: string
    posting_time: string
    status: string
    source: "pos" | "web"
    payment_status: string
    delivery_status: string
    custom_pos_uuid?: string
}

// ─── Get Admin Context ────────────────────────────────────────────────────────

async function getContext() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, role")
        .eq("id", user.id)
        .single()

    if (!profile?.tenant_id) throw new Error("No tenant found")
    return { supabase, tenantId: profile.tenant_id, role: profile.role, userId: user.id }
}

// ─── Get All Orders (CoreEngine Sales Invoices + Storefront Orders) ──────────────

export async function getOrders(): Promise<OrderRecord[]> {
    try {
        const { supabase, tenantId } = await getContext()

        // 1. Fetch CoreEngine Sales Invoices (POS orders)
        let CoreEngineOrders: OrderRecord[] = []
        try {
            const client = await getTenantClient()
            const invoices = await client.getList<{
                name: string
                customer: string
                grand_total: number
                outstanding_amount: number
                posting_date: string
                posting_time: string
                status: string
                is_pos: number
                custom_pos_uuid?: string
            }>("Sales Invoice", {
                filters: [["docstatus", "=", 1]],
                fields: ["name", "customer", "grand_total", "outstanding_amount", "posting_date", "posting_time", "status", "is_pos"],
                orderBy: "creation desc",
                limit: 100,
            })

            CoreEngineOrders = invoices.map(inv => ({
                id: inv.name,
                name: inv.name,
                customer: inv.customer,
                grand_total: inv.grand_total,
                outstanding_amount: inv.outstanding_amount || 0,
                posting_date: inv.posting_date,
                posting_time: inv.posting_time || "00:00:00",
                status: inv.status,
                source: inv.is_pos ? "pos" as const : "web" as const,
                payment_status: (inv.outstanding_amount || 0) > 0 ? "Pending" : "Paid",
                delivery_status: inv.status === "Draft" ? "Processing" : "Completed",
                custom_pos_uuid: inv.custom_pos_uuid,
            }))
        } catch (e) {
            console.error("Failed to fetch CoreEngine invoices:", e)
        }

        // 2. Fetch Storefront Orders (web orders from custom frontend)
        let webOrders: OrderRecord[] = []
        try {
            const { data: storefrontOrders } = await supabase
                .from("storefront_orders")
                .select("id, order_number, customer_name, grand_total, status, payment_status, created_at")
                .eq("tenant_id", tenantId)
                .order("created_at", { ascending: false })
                .limit(100)

            if (storefrontOrders) {
                webOrders = storefrontOrders.map(o => ({
                    id: o.id,
                    name: o.order_number || o.id,
                    customer: o.customer_name || "Online Customer",
                    grand_total: Number(o.grand_total),
                    outstanding_amount: o.payment_status === "paid" ? 0 : Number(o.grand_total),
                    posting_date: new Date(o.created_at).toISOString().split("T")[0],
                    posting_time: new Date(o.created_at).toISOString().split("T")[1]?.slice(0, 8) || "00:00:00",
                    status: o.status,
                    source: "web" as const,
                    payment_status: o.payment_status === "paid" ? "Paid" : "Pending",
                    delivery_status: o.status === "pending" ? "Processing" : o.status === "shipped" ? "Dispatched" : o.status === "delivered" ? "Completed" : o.status,
                }))
            }
        } catch (e) {
            // storefront_orders table may not exist yet — that's ok
            console.error("Failed to fetch storefront orders:", e)
        }

        // 3. Merge and sort by date (newest first)
        const allOrders = [...CoreEngineOrders, ...webOrders]
        allOrders.sort((a, b) => {
            const dateA = new Date(`${a.posting_date}T${a.posting_time}`)
            const dateB = new Date(`${b.posting_date}T${b.posting_time}`)
            return dateB.getTime() - dateA.getTime()
        })

        return allOrders
    } catch (error) {
        console.error("getOrders error:", error)
        return []
    }
}

// ─── Update Order Status ──────────────────────────────────────────────────────

export async function updateOrderStatus(orderId: string, status: string): Promise<{ error?: string }> {
    try {
        const { supabase, tenantId, role } = await getContext()

        if (role !== "admin" && role !== "superadmin") {
            return { error: "Only admins can update order status" }
        }

        const { error } = await supabase
            .from("storefront_orders")
            .update({ status, updated_at: new Date().toISOString() })
            .eq("id", orderId)
            .eq("tenant_id", tenantId)

        if (error) throw error
        return {}
    } catch (e) {
        console.error("updateOrderStatus error:", e)
        return { error: "Failed to update order status" }
    }
}
