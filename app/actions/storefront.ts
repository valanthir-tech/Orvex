"use server"

import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant"
import { createSupabaseServerClient } from "@/lib/tenant"

export interface StorefrontConfigPayload {
    store_name?: string
    support_email?: string
    tax_rate_fallback?: number
    shipping_rate_fallback?: number
    is_checkout_disabled?: boolean
    is_maintenance_mode?: boolean
    theme_blocks?: any[]
}

export async function getStorefrontConfig() {
    const ctx = await getTenantContext()
    const supabase = await createSupabaseServerClient()

    // 1. Fetch Company defaults from CoreEngine as the strict Base
    const company = await ctx.client.getDoc<any>('Company', ctx.companyName)
    const defaultCurrency = company?.default_currency || "USD"
    const companyName = company?.company_name || ctx.companyName
    
    // 2. Fetch specific storefront overrides from Supabase
    let { data: config, error } = await supabase
        .from('tenant_storefront_config')
        .select('*')
        .eq('tenant_id', ctx.tenantId)
        .single()
        
    // If not found, prep a default object
    if (!config && error?.code === 'PGRST116') {
        config = {
            store_name: companyName,
            support_email: "",
            tax_rate_fallback: 0,
            shipping_rate_fallback: 0,
            is_checkout_disabled: false,
            is_maintenance_mode: false,
            theme_blocks: [],
        }
    } else if (error) {
         console.error('Error fetching storefront config:', error)
    }

    return {
        config: config || null,
        defaultCurrency,
        baseStoreName: companyName,
        tenantId: ctx.tenantId, // Attached for the new BaaS Developer Headless flow
    }
}

export async function updateStorefrontConfig(payload: StorefrontConfigPayload) {
    const ctx = await getTenantContext()
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
        .from('tenant_storefront_config')
        .upsert({
            tenant_id: ctx.tenantId,
            ...payload,
            updated_at: new Date().toISOString()
        }, { onConflict: 'tenant_id' })
        .select()
        .single()

    if (error) {
        console.error('Error updating storefront config:', error)
        throw new Error(error.message)
    }

    revalidatePath('/storefront')
    return data
}
