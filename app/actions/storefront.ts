"use server"

import { revalidatePath } from "next/cache"
import { getTenantContext } from "@/lib/tenant"
import { createSupabaseServerClient } from "@/lib/tenant"
import { createClient } from "@supabase/supabase-js"

export interface StorefrontConfigPayload {
    store_name?: string
    support_email?: string
    tax_rate_fallback?: number
    shipping_rate_fallback?: number
    is_checkout_disabled?: boolean
    is_maintenance_mode?: boolean
    theme_blocks?: any[]
}

// ------------------------------------------
// Storefront Request & Payment Actions
// ------------------------------------------

export async function requestStorefront() {
    const ctx = await getTenantContext()
    
    // We use the service role client because standard users might be blocked by RLS from updating the tenant row
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Set status to payment_pending
    const { error } = await supabase
        .from('tenants')
        .update({ storefront_status: 'payment_pending' })
        .eq('id', ctx.tenantId)
        
    if (error) {
        console.error("Error requesting storefront:", error)
        throw new Error("Failed to request storefront. Please try again.")
    }
    
    revalidatePath('/storefront')
    return { success: true }
}

export async function uploadPaymentProof(formData: FormData) {
    const ctx = await getTenantContext()
    const supabase = await createSupabaseServerClient()
    
    const method = formData.get("method") as string
    const reference = formData.get("reference") as string
    const amountStr = formData.get("amount") as string
    const file = formData.get("file") as File
    
    if (!method || !amountStr || !file) {
        throw new Error("Missing required fields")
    }
    
    const amount = parseFloat(amountStr)
    
    // 1. Upload screenshot to storage
    const ext = file.name.split('.').pop()
    const fileName = `${ctx.tenantId}-${Date.now()}.${ext}`
    
    // Assuming a 'payment_proofs' bucket exists. If not, maybe just 'receipts'
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(fileName, file)
        
    if (uploadError) {
        console.error("Storage error:", uploadError)
        // Non-blocking for now if bucket doesn't exist, we fallback to a placeholder or fail
        // Actually we must fail
        throw new Error("Failed to upload screenshot. Make sure 'receipts' bucket exists.")
    }
    
    const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName)
        
    // 2. Insert into payment logs
    const { error: logError } = await supabase
        .from('storefront_payment_logs')
        .insert({
            tenant_id: ctx.tenantId,
            amount,
            payment_method: method,
            payment_reference: reference,
            screenshot_url: publicUrl,
            status: 'pending'
        })
        
    if (logError) {
        throw new Error("Failed to log payment.")
    }
    
    // 3. Update tenant status (use service role key to bypass RLS restrictions)
    const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    await adminSupabase
        .from('tenants')
        .update({ 
            storefront_status: 'payment_submitted',
            payment_screenshot_url: publicUrl,
            payment_method: method,
            payment_reference: reference,
            payment_amount: amount
        })
        .eq('id', ctx.tenantId)
        
    revalidatePath('/storefront')
    return { success: true }
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
