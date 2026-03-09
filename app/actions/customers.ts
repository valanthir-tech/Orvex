"use server"

import { createSupabaseServerClient } from "@/lib/tenant"
import { revalidatePath } from "next/cache"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Customer {
    id: string
    tenant_id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    pan_number: string | null
    credit_limit: number
    outstanding_balance: number
    total_purchases: number
    total_payments: number
    is_active: boolean
    notes: string | null
    created_at: string
    updated_at: string
}

export interface CustomerTransaction {
    id: string
    tenant_id: string
    customer_id: string
    type: "sale" | "payment" | "credit_note" | "adjustment"
    amount: number
    description: string | null
    reference_type: string | null
    reference_id: string | null
    created_by: string | null
    created_at: string
}

// ─── Get Current User's Tenant ID ─────────────────────────────────────────────

async function getCurrentTenantId() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, role")
        .eq("id", user.id)
        .single()

    if (!profile?.tenant_id) throw new Error("No tenant found")
    return { tenantId: profile.tenant_id, role: profile.role, userId: user.id }
}

// ─── Get All Customers ────────────────────────────────────────────────────────

export async function getCustomers(search?: string): Promise<Customer[]> {
    try {
        const { tenantId } = await getCurrentTenantId()
        const supabase = await createSupabaseServerClient()

        let query = supabase
            .from("customers")
            .select("*")
            .eq("tenant_id", tenantId)
            .order("name", { ascending: true })

        if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
        }

        const { data, error } = await query
        if (error) throw error
        return data || []
    } catch (error) {
        console.error("Failed to get customers:", error)
        return []
    }
}

// ─── Get Single Customer ──────────────────────────────────────────────────────

export async function getCustomer(id: string): Promise<Customer | null> {
    try {
        const { tenantId } = await getCurrentTenantId()
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("customers")
            .select("*")
            .eq("id", id)
            .eq("tenant_id", tenantId)
            .single()

        if (error) throw error
        return data
    } catch (error) {
        console.error("Failed to get customer:", error)
        return null
    }
}

// ─── Create Customer ──────────────────────────────────────────────────────────

export async function createCustomer(input: {
    name: string
    phone?: string
    email?: string
    address?: string
    pan_number?: string
    credit_limit?: number
    notes?: string
}) {
    try {
        const { tenantId } = await getCurrentTenantId()
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("customers")
            .insert({
                tenant_id: tenantId,
                name: input.name,
                phone: input.phone || null,
                email: input.email || null,
                address: input.address || null,
                pan_number: input.pan_number || null,
                credit_limit: input.credit_limit || 0,
                notes: input.notes || null,
            })
            .select()
            .single()

        if (error) throw error
        revalidatePath("/customers")
        return { success: true, data }
    } catch (error) {
        console.error("Failed to create customer:", error)
        return { error: "Failed to create customer" }
    }
}

// ─── Update Customer ──────────────────────────────────────────────────────────

export async function updateCustomer(id: string, updates: {
    name?: string
    phone?: string
    email?: string
    address?: string
    pan_number?: string
    credit_limit?: number
    notes?: string
    is_active?: boolean
}) {
    try {
        const { tenantId } = await getCurrentTenantId()
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("customers")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("id", id)
            .eq("tenant_id", tenantId)
            .select()
            .single()

        if (error) throw error
        revalidatePath("/customers")
        return { success: true, data }
    } catch (error) {
        console.error("Failed to update customer:", error)
        return { error: "Failed to update customer" }
    }
}

// ─── Delete Customer ──────────────────────────────────────────────────────────

export async function deleteCustomer(id: string) {
    try {
        const { tenantId, role } = await getCurrentTenantId()

        if (role !== "admin" && role !== "superadmin") {
            return { error: "Only admins can delete customers" }
        }

        const supabase = await createSupabaseServerClient()

        const { error } = await supabase
            .from("customers")
            .delete()
            .eq("id", id)
            .eq("tenant_id", tenantId)

        if (error) throw error
        revalidatePath("/customers")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete customer:", error)
        return { error: "Failed to delete customer" }
    }
}

// ─── Get Customer Transactions (Khata Ledger) ───────────────────────────────

export async function getCustomerTransactions(
    customerId: string,
    limit = 50
): Promise<CustomerTransaction[]> {
    try {
        const { tenantId } = await getCurrentTenantId()
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("customer_transactions")
            .select("*")
            .eq("customer_id", customerId)
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    } catch (error) {
        console.error("Failed to get transactions:", error)
        return []
    }
}

// ─── Record Payment (Khata) ─────────────────────────────────────────────────

export async function recordPayment(input: {
    customer_id: string
    amount: number
    description?: string
}) {
    try {
        const { tenantId, userId } = await getCurrentTenantId()
        const supabase = await createSupabaseServerClient()

        if (input.amount <= 0) {
            return { error: "Amount must be positive" }
        }

        const { data, error } = await supabase
            .from("customer_transactions")
            .insert({
                tenant_id: tenantId,
                customer_id: input.customer_id,
                type: "payment",
                amount: input.amount,
                description: input.description || "Payment received",
                created_by: userId,
            })
            .select()
            .single()

        if (error) throw error
        revalidatePath("/customers")
        return { success: true, data }
    } catch (error) {
        console.error("Failed to record payment:", error)
        return { error: "Failed to record payment" }
    }
}

// ─── Record Credit Sale ──────────────────────────────────────────────────────

export async function recordCreditSale(input: {
    customer_id: string
    amount: number
    order_uuid: string
    description?: string
}) {
    try {
        const { tenantId, userId } = await getCurrentTenantId()
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("customer_transactions")
            .insert({
                tenant_id: tenantId,
                customer_id: input.customer_id,
                type: "sale",
                amount: input.amount,
                description: input.description || "Credit sale",
                reference_type: "pos_order",
                reference_id: input.order_uuid,
                created_by: userId,
            })
            .select()
            .single()

        if (error) throw error
        revalidatePath("/customers")
        return { success: true, data }
    } catch (error) {
        console.error("Failed to record credit sale:", error)
        return { error: "Failed to record credit sale" }
    }
}
