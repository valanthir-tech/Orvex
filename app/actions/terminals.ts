"use server"

import { createSupabaseServerClient } from "@/lib/tenant"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export interface PosDevice {
    id: string
    tenant_id: string
    device_name: string
    is_active: boolean
    user_agent: string | null
    last_sync_at: string | null
    created_at: string
}

export async function listTerminals() {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
            return { success: false, error: "Unauthorized" }
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("tenant_id")
            .eq("id", user.id)
            .single()

        if (!profile) return { success: false, error: "No profile found" }

        const { data: devices, error } = await supabase
            .from('pos_devices')
            .select('*')
            .eq('tenant_id', profile.tenant_id)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, devices: devices as PosDevice[] }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function registerTerminal(deviceName: string, userAgent: string) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: "Unauthorized" }

        const { data: profile } = await supabase
            .from("profiles")
            .select("tenant_id, role")
            .eq("id", user.id)
            .single()

        if (!profile) return { success: false, error: "Profile missing" }
        if (profile.role !== 'admin' && profile.role !== 'superadmin') {
            return { success: false, error: "Only admins can register POS terminals" }
        }

        // Generate a random secure token
        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = await bcrypt.hash(rawToken, 10)

        const { data: device, error: deviceError } = await supabase
            .from('pos_devices')
            .insert({
                tenant_id: profile.tenant_id,
                device_name: deviceName,
                user_agent: userAgent,
                token_hash: tokenHash,
                registered_by: user.id
            })
            .select('id')
            .single()

        if (deviceError) throw deviceError

        // Also fetch staff profiles with valid PINs to sync instantly
        const { data: staffProfiles, error: staffError } = await supabase
            .from('profiles')
            .select('id, tenant_id, email, first_name, last_name, role, pin_code')
            .eq('tenant_id', profile.tenant_id)
            .not('pin_code', 'is', null)

        if (staffError) throw staffError

        revalidatePath('/', 'layout')

        return { 
            success: true, 
            token: rawToken, // Must be saved locally in IndexedDB configStore
            deviceId: device.id,
            staffProfiles: staffProfiles // Must be bulkPut into db.staffProfiles
        }

    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function revokeTerminal(deviceId: string) {
    try {
        const supabase = await createSupabaseServerClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: "Unauthorized" }

        const { data: profile } = await supabase
            .from("profiles")
            .select("tenant_id, role")
            .eq("id", user.id)
            .single()

        if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
            return { success: false, error: "Unauthorized" }
        }

        const { error } = await supabase
            .from('pos_devices')
            .update({ is_active: false })
            .eq('id', deviceId)
            .eq('tenant_id', profile.tenant_id)

        if (error) throw error
        revalidatePath('/', 'layout')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
