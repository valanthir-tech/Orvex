"use server"

import { createSupabaseServerClient } from "@/lib/tenant"
import { generateApiKey } from "@/lib/api-auth"
import { revalidatePath } from "next/cache"

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAdminContext() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, role")
        .eq("id", user.id)
        .single()

    if (!profile?.tenant_id) throw new Error("No tenant found")
    if (!["admin", "superadmin"].includes(profile.role)) {
        throw new Error("Only admins can manage API keys")
    }

    return { supabase, tenantId: profile.tenant_id, userId: user.id, role: profile.role }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiKeyRecord {
    id: string
    key_name: string
    key_prefix: string
    is_active: boolean
    allowed_origins: string[]
    rate_limit_per_minute: number
    last_used_at: string | null
    created_at: string
    revoked_at: string | null
}

// ─── List API Keys ───────────────────────────────────────────────────────────

export async function listApiKeys(): Promise<{ keys: ApiKeyRecord[]; role?: string; error?: string }> {
    try {
        const { supabase, tenantId, role } = await getAdminContext()

        const { data, error } = await supabase
            .from("tenant_api_keys")
            .select("id, key_name, key_prefix, is_active, allowed_origins, rate_limit_per_minute, last_used_at, created_at, revoked_at")
            .eq("tenant_id", tenantId)
            .order("created_at", { ascending: false })

        if (error) throw error
        return { keys: data || [], role }
    } catch (err) {
        console.error("listApiKeys error:", err)
        return { keys: [], error: "Failed to load API keys" }
    }
}

// ─── Create API Key ──────────────────────────────────────────────────────────

export async function createApiKey(keyName: string, forceOverride: boolean = false): Promise<{ key?: string; prefix?: string; error?: string }> {
    try {
        if (!keyName || keyName.trim().length === 0) {
            return { error: "Key name is required" }
        }

        const { supabase, tenantId, userId, role } = await getAdminContext()

        if (role !== "superadmin") {
            return { error: "Only superadmins can generate new API keys for security reasons." }
        }

        // Limit to 5 active keys
        const { count, data: activeKeys } = await supabase
            .from("tenant_api_keys")
            .select("id, created_at")
            .eq("tenant_id", tenantId)
            .is("revoked_at", null)

        // Check 6 months rule for active keys
        if (!forceOverride && activeKeys && activeKeys.length > 0) {
            const latestKeyDate = new Date(Math.max(...activeKeys.map(k => new Date(k.created_at).getTime())))
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

            if (latestKeyDate > sixMonthsAgo) {
                return { error: "An API key was created recently. Standard policy prevents changing keys within 6 months to ensure stability." }
            }
        }

        if ((count || 0) >= 5) {
            return { error: "Maximum 5 active API keys allowed. Revoke an existing key first." }
        }

        const { key, prefix } = generateApiKey()

        const { error } = await supabase
            .from("tenant_api_keys")
            .insert({
                tenant_id: tenantId,
                key_name: keyName.trim(),
                api_key: key,
                key_prefix: prefix,
                is_active: true,
                created_by: userId,
            })

        if (error) throw error

        revalidatePath("/settings")
        return { key, prefix }
    } catch (err) {
        console.error("createApiKey error:", err)
        return { error: "Failed to create API key" }
    }
}

// ─── Revoke API Key ──────────────────────────────────────────────────────────

export async function revokeApiKey(keyId: string, forceOverride: boolean = false): Promise<{ error?: string }> {
    try {
        const { supabase, tenantId, role } = await getAdminContext()

        if (role !== "superadmin") {
            return { error: "Only superadmins can revoke API keys." }
        }

        // Get key to check creation date
        const { data: keyData } = await supabase
            .from("tenant_api_keys")
            .select("created_at")
            .eq("id", keyId)
            .eq("tenant_id", tenantId)
            .single()

        if (keyData && !forceOverride) {
            const keyDate = new Date(keyData.created_at)
            const sixMonthsAgo = new Date()
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

            if (keyDate > sixMonthsAgo) {
                return { error: "This key was created less than 6 months ago. Standard policy prevents revoking." }
            }
        }

        const { error } = await supabase
            .from("tenant_api_keys")
            .update({
                revoked_at: new Date().toISOString(),
                is_active: false,
            })
            .eq("id", keyId)
            .eq("tenant_id", tenantId)

        if (error) throw error

        revalidatePath("/settings")
        return {}
    } catch (err) {
        console.error("revokeApiKey error:", err)
        return { error: "Failed to revoke API key" }
    }
}
