"use server"

import { createSupabaseServerClient } from "@/lib/tenant"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantSettings {
    id: string
    tenant_id: string
    store_name: string | null
    store_address: string | null
    store_phone: string | null
    store_email: string | null
    store_logo_url: string | null
    tax_rate: number
    tax_label: string
    pan_number: string | null
    receipt_header: string
    receipt_footer: string
    receipt_show_store_name: boolean
    receipt_show_address: boolean
    receipt_show_phone: boolean
    receipt_show_pan: boolean
    receipt_show_cashier: boolean
    receipt_show_disclaimer: boolean
    receipt_disclaimer: string
    currency: string
    currency_symbol: string
    low_stock_threshold: number
    enable_notifications: boolean
    enable_low_stock_alerts: boolean
    enable_daily_summary: boolean
    enable_offline_mode: boolean
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

    if (!profile) throw new Error("No profile found")

    // Auto-provision a tenant for users without one
    if (!profile.tenant_id) {
        const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const name = [user.user_metadata?.first_name, user.user_metadata?.last_name].filter(Boolean).join(' ')
        const { data: tenant } = await adminClient
            .from("tenants")
            .insert({
                company_name: name ? `${name}'s Store` : 'My Store',
                owner_email: user.email,
                status: 'active',
            })
            .select("id")
            .single()

        if (!tenant) throw new Error("Failed to create tenant")

        await adminClient
            .from("profiles")
            .update({ tenant_id: tenant.id })
            .eq("id", user.id)

        return { tenantId: tenant.id, role: profile.role, userId: user.id }
    }

    return { tenantId: profile.tenant_id, role: profile.role, userId: user.id }
}

// ─── Get Settings ─────────────────────────────────────────────────────────────

export async function getSettings(): Promise<TenantSettings | null> {
    try {
        const { tenantId } = await getCurrentTenantId()
        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("tenant_settings")
            .select("*")
            .eq("tenant_id", tenantId)
            .single()

        if (error) {
            // If no settings exist yet, create defaults
            if (error.code === "PGRST116") {
                const { data: tenant } = await supabase
                    .from("tenants")
                    .select("company_name")
                    .eq("id", tenantId)
                    .single()

                const { data: newSettings, error: createError } = await supabase
                    .from("tenant_settings")
                    .insert({ tenant_id: tenantId, store_name: tenant?.company_name || "My Store" })
                    .select()
                    .single()

                if (createError) throw createError
                return newSettings
            }
            throw error
        }

        return data
    } catch (error) {
        console.error("Failed to get settings:", error)
        return null
    }
}

// ─── Update Settings ──────────────────────────────────────────────────────────

export async function updateSettings(updates: Partial<Omit<TenantSettings, "id" | "tenant_id">>) {
    try {
        const { tenantId, role } = await getCurrentTenantId()

        if (role !== "admin" && role !== "superadmin") {
            return { error: "Only admins can update settings" }
        }

        const supabase = await createSupabaseServerClient()

        const { data, error } = await supabase
            .from("tenant_settings")
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq("tenant_id", tenantId)
            .select()
            .single()

        if (error) throw error

        revalidatePath("/settings")
        return { success: true, data }
    } catch (error) {
        console.error("Failed to update settings:", error)
        return { error: "Failed to save settings" }
    }
}
