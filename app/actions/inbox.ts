"use server"

import { revalidatePath } from "next/cache"
import { getTenantContext, createSupabaseServerClient } from "@/lib/tenant"

export interface Inquiry {
    id: string
    tenant_id: string
    customer_name: string
    customer_email: string
    subject: string
    body: string
    context_product_id: string | null
    status: 'new' | 'in-progress' | 'resolved'
    created_at: string
}

export async function getInquiries(): Promise<Inquiry[]> {
    const ctx = await getTenantContext()
    const supabase = await createSupabaseServerClient()

    const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .eq('tenant_id', ctx.tenantId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching inquiries:', error)
        return []
    }
    
    return data || []
}

export async function updateInquiryStatus(id: string, status: 'new' | 'in-progress' | 'resolved') {
    const ctx = await getTenantContext()
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase
        .from('inquiries')
        .update({ 
            status, 
            updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .eq('tenant_id', ctx.tenantId)

    if (error) {
        console.error('Error updating inquiry status:', error)
        throw new Error(error.message)
    }
        
    revalidatePath('/inbox')
    return true
}

export async function sendInquiryReply(id: string, customerEmail: string, replyBody: string) {
    const ctx = await getTenantContext()
    const supabase = await createSupabaseServerClient()

    // 1. Here we would integrate Resend to actually send the email to the customer
    console.log(`[Storefront Inbox] Sending email to ${customerEmail} via Resend...`, replyBody)
    
    // 2. Mark the inquiry as in-progress or resolved
    await updateInquiryStatus(id, 'resolved')

    revalidatePath('/inbox')
    return true
}
