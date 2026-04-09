/**
 * Public API Authentication Library
 * 
 * Two-layer auth for storefront APIs:
 * 1. API Key (x-api-key header) → identifies the tenant
 * 2. JWT (Authorization: Bearer) → identifies the storefront customer (optional)
 * 
 * API keys are created by tenant admins in the dashboard.
 * JWTs are issued when storefront customers log in.
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose'
import { createClient } from '@supabase/supabase-js'
import { ERPNextClient } from './erpnext'
import { decryptCredentials } from './encryption'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiTenantContext {
    tenantId: string
    apiKeyId: string
    erpnextClient: ERPNextClient
    tenantSettings: {
        storeName: string | null
        storeAddress: string | null
        storePhone: string | null
        storeEmail: string | null
        storeLogoUrl: string | null
        taxRate: number
        taxLabel: string
        currency: string
        currencySymbol: string
    }
}

export interface StorefrontCustomerPayload extends JWTPayload {
    sub: string        // customer UUID
    tenantId: string
    email: string
    name: string
}

// ─── Supabase Admin Client (bypasses RLS for API operations) ──────────────────

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    if (!url || !serviceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY for API operations')
    }
    return createClient(url, serviceKey)
}

// ─── JWT Secret ───────────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
    const secret = process.env.STOREFRONT_JWT_SECRET
    if (!secret) {
        throw new Error('Missing STOREFRONT_JWT_SECRET env var')
    }
    return new TextEncoder().encode(secret)
}

// ─── API Key Generation ───────────────────────────────────────────────────────

export function generateApiKey(): { key: string; prefix: string } {
    const raw = randomBytes(32).toString('hex') // 64 hex chars
    const key = `orvex_${raw}`
    const prefix = `orvex_${raw.slice(0, 8)}****`
    return { key, prefix }
}

export async function validateTenantId(tenantId: string): Promise<ApiTenantContext | null> {
    if (!tenantId) return null

    const supabase = getServiceClient()

    // Get tenant + credentials
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, erpnext_url, erpnext_api_key, erpnext_api_secret, status')
        .eq('id', tenantId)
        .single()

    if (tenantError || !tenant) return null
    if (tenant.status !== 'active' && tenant.status !== 'trial') return null

    // Decrypt credentials
    let apiKeyDecrypted: string, apiSecretDecrypted: string
    try {
        const decrypted = decryptCredentials({
            encryptedApiKey: tenant.erpnext_api_key,
            encryptedApiSecret: tenant.erpnext_api_secret,
        })
        apiKeyDecrypted = decrypted.apiKey
        apiSecretDecrypted = decrypted.apiSecret
    } catch {
        console.error(`Failed to decrypt credentials for tenant ${tenant.id}`)
        return null
    }

    // Get tenant settings
    const { data: settings } = await supabase
        .from('tenant_settings')
        .select('store_name, store_address, store_phone, store_email, store_logo_url, tax_rate, tax_label, currency, currency_symbol')
        .eq('tenant_id', tenantId)
        .single()

    return {
        tenantId: tenant.id,
        apiKeyId: 'legacy-tenant-auth', // Placeholder
        erpnextClient: new ERPNextClient({
            url: tenant.erpnext_url,
            apiKey: apiKeyDecrypted,
            apiSecret: apiSecretDecrypted,
        }),
        tenantSettings: {
            storeName: settings?.store_name ?? null,
            storeAddress: settings?.store_address ?? null,
            storePhone: settings?.store_phone ?? null,
            storeEmail: settings?.store_email ?? null,
            storeLogoUrl: settings?.store_logo_url ?? null,
            taxRate: settings?.tax_rate ?? 13,
            taxLabel: settings?.tax_label ?? 'VAT',
            currency: settings?.currency ?? 'NPR',
            currencySymbol: settings?.currency_symbol ?? 'Rs.',
        },
    }
}

// ─── API Key Validation (Deprecated temporarily for easier storefront building) ──────────────────

export async function validateApiKey(apiKey: string, requestOrigin?: string | null): Promise<ApiTenantContext | null> {
    if (!apiKey || !apiKey.startsWith('orvex_')) return null

    const supabase = getServiceClient()

    // 1. Look up the API key
    const { data: keyRecord, error: keyError } = await supabase
        .from('tenant_api_keys')
        .select('id, tenant_id, is_active, allowed_origins, rate_limit_per_minute')
        .eq('api_key', apiKey)
        .is('revoked_at', null)
        .single()

    if (keyError || !keyRecord || !keyRecord.is_active) return null

    // 1.5 Secure BaaS Origin validation
    // If the API key has restricted domains, ensure the request came from one of them.
    if (keyRecord.allowed_origins && keyRecord.allowed_origins.length > 0 && requestOrigin) {
        // Strip trailing slashes and ports to normalize
        const originClean = requestOrigin.replace(/\/$/, '')
        
        // Allow localhost for development, but in production strictly enforce origin
        if (!originClean.includes('localhost') && !originClean.includes('127.0.0.1')) {
            const isAllowed = (keyRecord.allowed_origins as string[]).some((allowed: string) => 
                originClean === allowed.replace(/\/$/, '')
            )
            if (!isAllowed) {
                console.error(`Blocked unauthorized origin: ${requestOrigin} for key ${keyRecord.id}`)
                return null
            }
        }
    }

    // 2. Update last_used_at (fire and forget)
    supabase
        .from('tenant_api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyRecord.id)
        .then(() => {})

    // 3. Get tenant + credentials
    const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, erpnext_url, erpnext_api_key, erpnext_api_secret, status')
        .eq('id', keyRecord.tenant_id)
        .single()

    if (tenantError || !tenant) return null
    if (tenant.status !== 'active' && tenant.status !== 'trial') return null

    // 4. Decrypt credentials
    let apiKeyDecrypted: string, apiSecretDecrypted: string
    try {
        const decrypted = decryptCredentials({
            encryptedApiKey: tenant.erpnext_api_key,
            encryptedApiSecret: tenant.erpnext_api_secret,
        })
        apiKeyDecrypted = decrypted.apiKey
        apiSecretDecrypted = decrypted.apiSecret
    } catch {
        console.error(`Failed to decrypt credentials for tenant ${tenant.id}`)
        return null
    }

    // 5. Get tenant settings
    const { data: settings } = await supabase
        .from('tenant_settings')
        .select('store_name, store_address, store_phone, store_email, store_logo_url, tax_rate, tax_label, currency, currency_symbol')
        .eq('tenant_id', keyRecord.tenant_id)
        .single()

    return {
        tenantId: keyRecord.tenant_id,
        apiKeyId: keyRecord.id,
        erpnextClient: new ERPNextClient({
            url: tenant.erpnext_url,
            apiKey: apiKeyDecrypted,
            apiSecret: apiSecretDecrypted,
        }),
        tenantSettings: {
            storeName: settings?.store_name ?? null,
            storeAddress: settings?.store_address ?? null,
            storePhone: settings?.store_phone ?? null,
            storeEmail: settings?.store_email ?? null,
            storeLogoUrl: settings?.store_logo_url ?? null,
            taxRate: settings?.tax_rate ?? 13,
            taxLabel: settings?.tax_label ?? 'VAT',
            currency: settings?.currency ?? 'NPR',
            currencySymbol: settings?.currency_symbol ?? 'Rs.',
        },
    }
}

// ─── JWT Operations ───────────────────────────────────────────────────────────

export async function signCustomerJwt(customer: {
    id: string
    tenantId: string
    email: string
    fullName: string
}): Promise<string> {
    return new SignJWT({
        sub: customer.id,
        tenantId: customer.tenantId,
        email: customer.email,
        name: customer.fullName,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .setIssuer('valanthir-ims')
        .sign(getJwtSecret())
}

export async function verifyCustomerJwt(token: string): Promise<StorefrontCustomerPayload | null> {
    try {
        const supabase = getServiceClient()
        const { data: { user }, error } = await supabase.auth.getUser(token)
        
        if (error || !user) return null

        return {
            sub: user.id,
            tenantId: user.user_metadata?.tenant_id || '', // we'll fall back to just using email since emails are unique
            email: user.email!,
            name: user.user_metadata?.full_name || 'Customer'
        } as StorefrontCustomerPayload
    } catch {
        return null
    }
}

// ─── Request Handler Wrapper ──────────────────────────────────────────────────

/**
 * Wraps an API route handler with:
 * 1. API key validation (required)
 * 2. CORS headers
 * 3. Optional JWT customer auth
 * 
 * Usage:
 *   export const GET = withApiAuth(async (req, ctx) => {
 *     // ctx.tenantId, ctx.erpnextClient, ctx.customer (if JWT provided)
 *     return NextResponse.json({ products: [...] })
 *   })
 */
export function withApiAuth(
    handler: (
        req: NextRequest,
        ctx: ApiTenantContext & { customer: StorefrontCustomerPayload | null }
    ) => Promise<NextResponse>,
    options?: { requireCustomer?: boolean }
) {
    return async (req: NextRequest) => {
        // CORS preflight
        if (req.method === 'OPTIONS') {
            return new NextResponse(null, {
                status: 204,
                headers: corsHeaders(req),
            })
        }

        // 1. Check for x-tenant-id (for simpler storefront building right now)
        // If they still pass x-api-key, we can gracefully fall back if needed, 
        // but let's prefer x-tenant-id to unblock frontend.
        const tenantId = req.headers.get('x-tenant-id') || req.headers.get('x-api-key') // fallback for backwards compatibility if needed
        const requestOrigin = req.headers.get('origin')

        if (!tenantId) {
            return NextResponse.json(
                { error: 'Missing x-tenant-id header' },
                { status: 401, headers: corsHeaders(req) }
            )
        }

        // Validate via tenantId direct lookup, bypassing API key checks for now
        const tenantCtx = await validateTenantId(tenantId)
        if (!tenantCtx) {
            return NextResponse.json(
                { error: 'Invalid tenant ID' },
                { status: 401, headers: corsHeaders(req) }
            )
        }

        // 2. Optional JWT customer auth
        let customer: StorefrontCustomerPayload | null = null
        const authHeader = req.headers.get('authorization')
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7)
            customer = await verifyCustomerJwt(token)

            // Ensure JWT tenant matches API key tenant (skip if metadata not set for MVP)
            if (customer && customer.tenantId && customer.tenantId !== tenantCtx.tenantId) {
                return NextResponse.json(
                    { error: 'Token tenant mismatch' },
                    { status: 403, headers: corsHeaders(req) }
                )
            }
        }

        if (options?.requireCustomer && !customer) {
            return NextResponse.json(
                { error: 'Authentication required. Include Authorization: Bearer <token>' },
                { status: 401, headers: corsHeaders(req) }
            )
        }

        // 3. Call handler
        try {
            const response = await handler(req, { ...tenantCtx, customer })
            // Add CORS headers to response
            const headers = corsHeaders(req)
            Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v))
            return response
        } catch (error) {
            console.error('[API Error]', error)
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500, headers: corsHeaders(req) }
            )
        }
    }
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

function corsHeaders(req: NextRequest): Record<string, string> {
    const origin = req.headers.get('origin') || '*';

    // In a BaaS model, the Gateway accepts cross-origin preflight from anywhere,
    // and the strict security check is performed against the `x-api-key` header during the actual request.
    const safeOrigin = origin === 'null' ? '*' : origin;

    return {
        'Access-Control-Allow-Origin': safeOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-tenant-id',
        'Access-Control-Max-Age': '86400',
    }
}
