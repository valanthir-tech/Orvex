"use server"

import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/tenant"
import { revalidatePath } from "next/cache"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SubscriptionPlan {
    id: string
    name: string
    price_npr: number
    billing_period: string
    features: {
        pos?: boolean
        inventory?: boolean
        offline_pos: boolean
        payment_integration: boolean
        receipt_printing: boolean
        khata: boolean
        website: string
        whatsapp_ordering: boolean
        reports: "Basic" | "Advanced" | "basic" | "advanced"
        multi_warehouse: boolean
        api_access: boolean
        white_label: boolean
        dedicated_manager: boolean
        support_type: string
    }
    max_stores: number
    max_staff: number
    max_products: number
    is_active: boolean
    sort_order: number
}

export interface TenantSubscription {
    id: string
    tenant_id: string
    plan_id: string
    status: "pending_payment" | "active" | "past_due" | "blocked" | "cancelled"
    current_period_start: string | null
    current_period_end: string | null
    grace_period_end: string | null
    next_billing_date: string | null
    plan?: SubscriptionPlan
}

export interface PaymentSubmission {
    id: string
    tenant_id: string
    subscription_id: string | null
    plan_id: string
    amount_npr: number
    payment_method: "bank_transfer" | "esewa"
    payment_proof_url: string | null
    transaction_reference: string | null
    status: "pending" | "approved" | "rejected"
    admin_notes: string | null
    submitted_at: string
    plan?: SubscriptionPlan
}

export interface PaymentQrCode {
    id: string
    payment_method: "bank_transfer" | "esewa"
    qr_code_url: string
    payment_details: Record<string, string>
    is_active: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

async function getAuthenticatedTenantId(): Promise<{ userId: string; tenantId: string }> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const adminClient = getAdminClient()
    const { data: profile } = await adminClient
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single()

    if (!profile?.tenant_id) throw new Error("No tenant associated with this account")
    return { userId: user.id, tenantId: profile.tenant_id }
}

// ─── Public: Get Subscription Plans ──────────────────────────────────────────

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const adminClient = getAdminClient()
    const { data, error } = await adminClient
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as SubscriptionPlan[]
}

// ─── Get QR Codes for Payment ─────────────────────────────────────────────────

export async function getPaymentQrCodes(): Promise<PaymentQrCode[]> {
    const adminClient = getAdminClient()
    const { data, error } = await adminClient
        .from("payment_qr_codes")
        .select("*")
        .eq("is_active", true)

    if (error) throw new Error(error.message)
    return (data ?? []) as PaymentQrCode[]
}

// ─── Get Tenant Subscription ──────────────────────────────────────────────────

export async function getTenantSubscription(): Promise<TenantSubscription | null> {
    const { tenantId } = await getAuthenticatedTenantId()
    const adminClient = getAdminClient()

    const { data, error } = await adminClient
        .from("tenant_subscriptions")
        .select("*, plan:subscription_plans(*)")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error) throw new Error(error.message)
    return data as TenantSubscription | null
}

export async function getTenantFeatures() {
    try {
        const sub = await getTenantSubscription()
        
        // Default to Starter limits if no subscription exists
        const defaultFeatures = {
            pos: true,
            inventory: true,
            reports: "basic" as const,
            khata: true,
            storefront: true, // Allow trial/free users to see storefront features
            multi_warehouse: false,
            api_access: false
        }

        if (sub && ['active', 'past_due', 'trialing'].includes(sub.status) && sub.plan) {
            return {
                ...defaultFeatures,
                ...(sub.plan.features || {}),
                storefront: Boolean(sub.plan.features?.website)
            }
        }
        
        return defaultFeatures
    } catch {
        // If unauthenticated or no tenant, return safe defaults
        return {
            pos: false,
            inventory: false,
            reports: "basic" as const,
            khata: false,
            storefront: true, // Allow UI to render for fallback states
            multi_warehouse: false,
            api_access: false
        }
    }
}

// ─── Check Subscription Status ────────────────────────────────────────────────

export async function checkSubscriptionStatus(tenantId: string): Promise<{
    isActive: boolean
    status: string
    daysRemaining: number | null
    isPastDue: boolean
    isBlocked: boolean
}> {
    const adminClient = getAdminClient()

    const { data: tenant } = await adminClient
        .from("tenants")
        .select("subscription_status, is_blocked")
        .eq("id", tenantId)
        .single()

    if (!tenant) return { isActive: false, status: "unknown", daysRemaining: null, isPastDue: false, isBlocked: false }

    const subscription = await adminClient
        .from("tenant_subscriptions")
        .select("status, current_period_end, grace_period_end")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    const sub = subscription.data
    let daysRemaining: number | null = null

    if (sub?.current_period_end) {
        const msRemaining = new Date(sub.current_period_end).getTime() - Date.now()
        daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
    }

    return {
        isActive: tenant.subscription_status === "active",
        status: tenant.subscription_status,
        daysRemaining,
        isPastDue: tenant.subscription_status === "past_due",
        isBlocked: tenant.is_blocked === true,
    }
}

// ─── Submit Payment ───────────────────────────────────────────────────────────

export async function submitPayment(data: {
    planId: string
    amountNpr: number
    paymentMethod: "bank_transfer" | "esewa"
    proofFile: File
    transactionReference: string
}): Promise<{ submissionId: string }> {
    const { userId, tenantId } = await getAuthenticatedTenantId()
    const adminClient = getAdminClient()

    // Fetch tenant name for readable filename
    const { data: tenant } = await adminClient
        .from("tenants")
        .select("company_name")
        .eq("id", tenantId)
        .single()

    // Validate plan exists
    const { data: plan } = await adminClient
        .from("subscription_plans")
        .select("id, price_npr")
        .eq("id", data.planId)
        .eq("is_active", true)
        .single()

    if (!plan) throw new Error("Invalid subscription plan")

    // Validate proof file: max 5 MB, images and PDF only
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
    if (!ALLOWED_TYPES.includes(data.proofFile.type)) {
        throw new Error("Invalid file type. Please upload a JPEG, PNG, WebP, GIF, or PDF.")
    }
    if (data.proofFile.size > MAX_SIZE_BYTES) {
        throw new Error("File is too large. Maximum allowed size is 5 MB.")
    }

    // Upload payment proof to Supabase Storage
    const fileExt = data.proofFile.name.split(".").pop()
    const datePart = new Date().toISOString().slice(0, 10)
    const storeSlug = (tenant?.company_name ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 25)
    const planSlug  = data.planId.toLowerCase().replace(/[^a-z0-9]/g, "-")
    const txnSlug   = data.transactionReference.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 20)
    const fileName  = `${tenantId}/${datePart}_${storeSlug}_${planSlug}_${txnSlug}.${fileExt}`

    const { error: uploadError } = await adminClient.storage
        .from("payment-proofs")
        .upload(fileName, data.proofFile, {
            contentType: data.proofFile.type,
            upsert: false,
        })

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    // Get public URL (signed URL since bucket is private)
    const { data: urlData } = adminClient.storage
        .from("payment-proofs")
        .getPublicUrl(fileName)

    // Fetch old pending proof URL so we can delete it after upload
    const { data: oldSubmission } = await adminClient
        .from("payment_submissions")
        .select("payment_proof_url")
        .eq("tenant_id", tenantId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

    // Delete old proof file from storage if it exists
    if (oldSubmission?.payment_proof_url) {
        try {
            // Extract the storage path: everything after "/payment-proofs/"
            const marker = "/payment-proofs/"
            const markerIdx = oldSubmission.payment_proof_url.indexOf(marker)
            if (markerIdx !== -1) {
                const oldPath = oldSubmission.payment_proof_url.slice(markerIdx + marker.length)
                await adminClient.storage.from("payment-proofs").remove([oldPath])
            }
        } catch {
            // Non-fatal: old file cleanup failure should not block new upload
        }
    }

    // Get or create tenant subscription record (pending)
    const { data: existingSub } = await adminClient
        .from("tenant_subscriptions")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "pending_payment")
        .maybeSingle()

    let subscriptionId = existingSub?.id ?? null

    if (!subscriptionId) {
        const { data: newSub, error: subError } = await adminClient
            .from("tenant_subscriptions")
            .insert({
                tenant_id: tenantId,
                plan_id: data.planId,
                status: "pending_payment",
            })
            .select("id")
            .single()

        if (subError) throw new Error(subError.message)
        subscriptionId = newSub.id
    } else {
        // Update the plan on existing pending subscription
        await adminClient
            .from("tenant_subscriptions")
            .update({ plan_id: data.planId })
            .eq("id", subscriptionId)
    }

    // Create payment submission record
    const { data: submission, error: subError } = await adminClient
        .from("payment_submissions")
        .insert({
            tenant_id: tenantId,
            subscription_id: subscriptionId,
            plan_id: data.planId,
            amount_npr: plan.price_npr,
            payment_method: data.paymentMethod,
            payment_proof_url: urlData.publicUrl,
            transaction_reference: data.transactionReference.trim() || null,
            status: "pending",
        })
        .select("id")
        .single()

    if (subError) throw new Error(subError.message)

    // Update tenant status to waiting_approval
    await adminClient
        .from("tenants")
        .update({ subscription_status: "waiting_approval" })
        .eq("id", tenantId)

    revalidatePath('/', 'layout')
    revalidatePath('/', 'layout')

    return { submissionId: submission.id }
}

// ─── Get Payment Submissions (for tenant) ────────────────────────────────────

export async function getPaymentSubmissions(): Promise<PaymentSubmission[]> {
    const { tenantId } = await getAuthenticatedTenantId()
    const adminClient = getAdminClient()

    const { data, error } = await adminClient
        .from("payment_submissions")
        .select("*, plan:subscription_plans(name, price_npr)")
        .eq("tenant_id", tenantId)
        .order("submitted_at", { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as PaymentSubmission[]
}
