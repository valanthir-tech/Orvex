"use server"

import { createSupabaseServerClient } from "@/lib/tenant"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ─── Service Client (bypasses RLS) ────────────────────────────────────────────

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    return createClient(url, serviceKey)
}

// ─── Get Current User Context ─────────────────────────────────────────────────

async function requireAdminContext() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const { data: profile } = await supabase
        .from('profiles')
        .select('id, tenant_id, role')
        .eq('id', user.id)
        .single()

    if (!profile || !profile.tenant_id) {
        throw new Error("No tenant context")
    }

    if (profile.role !== 'admin' && profile.role !== 'superadmin') {
        throw new Error("Only admins can manage staff")
    }

    return { userId: user.id, tenantId: profile.tenant_id, role: profile.role }
}

// ─── Invite Staff ─────────────────────────────────────────────────────────────

const inviteSchema = z.object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    role: z.enum(['manager', 'cashier'], { message: "Role must be 'manager' or 'cashier'" }),
})

export async function inviteStaff(input: z.infer<typeof inviteSchema>) {
    const validation = inviteSchema.safeParse(input)
    if (!validation.success) {
        return { success: false, error: validation.error.issues[0].message }
    }

    const { email, firstName, lastName, role } = validation.data

    try {
        const ctx = await requireAdminContext()
        const serviceClient = getServiceClient()

        // Check if email already exists as a profile in this tenant
        const { data: existingProfile } = await serviceClient
            .from('profiles')
            .select('id')
            .eq('tenant_id', ctx.tenantId)
            .eq('email', email.toLowerCase())
            .single()

        if (existingProfile) {
            return { success: false, error: "A staff member with this email already exists in your organization" }
        }

        // Also check if user already exists in auth.users via service role
        // If they do, we need to handle differently (they might be in another tenant)
        const { data: existingUsers } = await serviceClient.auth.admin.listUsers()
        const existingUser = existingUsers?.users?.find(u => u.email === email.toLowerCase())

        if (existingUser) {
            // Check if they already have a profile in any tenant
            const { data: anyProfile } = await serviceClient
                .from('profiles')
                .select('id, tenant_id')
                .eq('id', existingUser.id)
                .single()

            if (anyProfile) {
                return { success: false, error: "This email is already associated with another account" }
            }
        }

        // Invite user via Supabase Auth (sends magic link email)
        const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(
            email.toLowerCase(),
            {
                data: {
                    first_name: firstName,
                    last_name: lastName || '',
                    role: role,
                    invited_by: ctx.userId,
                    tenant_id: ctx.tenantId,
                },
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
            }
        )

        if (inviteError) {
            console.error('[Staff] Invite error:', inviteError)
            return { success: false, error: inviteError.message }
        }

        // The handle_new_user trigger will create the profile when the user accepts.
        // But since we're using inviteUserByEmail (which creates the user immediately),
        // the trigger fires now. We need to ensure the profile gets the right tenant_id.
        // The trigger looks up tenant by owner_email first, then falls back to metadata.
        // Since this is a staff member (not owner), we manually create/update the profile.

        if (inviteData.user) {
            const { error: profileError } = await serviceClient
                .from('profiles')
                .upsert({
                    id: inviteData.user.id,
                    tenant_id: ctx.tenantId,
                    email: email.toLowerCase(),
                    first_name: firstName,
                    last_name: lastName || '',
                    role: role,
                }, { onConflict: 'id' })

            if (profileError) {
                console.error('[Staff] Profile creation error:', profileError)
                // Don't fail — the user was invited, profile can be fixed
            }
        }

        revalidatePath('/settings')
        return { success: true }

    } catch (err: any) {
        console.error('[Staff] Invite error:', err)
        return { success: false, error: err.message || "Failed to invite staff member" }
    }
}

// ─── List Staff ───────────────────────────────────────────────────────────────

export interface StaffMember {
    id: string
    email: string
    first_name: string
    last_name: string
    role: string
    created_at: string
    last_sign_in_at: string | null
}

export async function listStaff(): Promise<{ success: boolean; staff?: StaffMember[]; error?: string }> {
    try {
        const ctx = await requireAdminContext()
        const supabase = await createSupabaseServerClient()

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, email, first_name, last_name, role, created_at')
            .eq('tenant_id', ctx.tenantId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('[Staff] List error:', error)
            return { success: false, error: "Failed to load staff members" }
        }

        // Get last sign-in from auth.users via service client
        const serviceClient = getServiceClient()
        const staffWithAuth: StaffMember[] = await Promise.all(
            (profiles || []).map(async (p) => {
                const { data: authData } = await serviceClient.auth.admin.getUserById(p.id)
                return {
                    ...p,
                    last_sign_in_at: authData?.user?.last_sign_in_at || null,
                }
            })
        )

        return { success: true, staff: staffWithAuth }

    } catch (err: any) {
        console.error('[Staff] List error:', err)
        return { success: false, error: err.message || "Failed to load staff" }
    }
}

// ─── Update Staff Role ────────────────────────────────────────────────────────

export async function updateStaffRole(staffId: string, newRole: 'manager' | 'cashier') {
    try {
        const ctx = await requireAdminContext()
        const supabase = await createSupabaseServerClient()

        // Can't change own role
        if (staffId === ctx.userId) {
            return { success: false, error: "You cannot change your own role" }
        }

        // Verify staff belongs to same tenant
        const { data: staffProfile } = await supabase
            .from('profiles')
            .select('id, tenant_id, role')
            .eq('id', staffId)
            .eq('tenant_id', ctx.tenantId)
            .single()

        if (!staffProfile) {
            return { success: false, error: "Staff member not found" }
        }

        if (staffProfile.role === 'admin') {
            return { success: false, error: "Cannot change the role of the account owner" }
        }

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', staffId)
            .eq('tenant_id', ctx.tenantId)

        if (error) {
            return { success: false, error: "Failed to update role" }
        }

        revalidatePath('/settings')
        return { success: true }

    } catch (err: any) {
        return { success: false, error: err.message || "Failed to update role" }
    }
}

// ─── Remove Staff ─────────────────────────────────────────────────────────────

export async function removeStaff(staffId: string) {
    try {
        const ctx = await requireAdminContext()
        const supabase = await createSupabaseServerClient()

        // Can't remove yourself
        if (staffId === ctx.userId) {
            return { success: false, error: "You cannot remove yourself" }
        }

        // Verify staff belongs to same tenant and isn't the admin
        const { data: staffProfile } = await supabase
            .from('profiles')
            .select('id, tenant_id, role')
            .eq('id', staffId)
            .eq('tenant_id', ctx.tenantId)
            .single()

        if (!staffProfile) {
            return { success: false, error: "Staff member not found" }
        }

        if (staffProfile.role === 'admin') {
            return { success: false, error: "Cannot remove the account owner" }
        }

        // Remove profile (this effectively removes their access to this tenant)
        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', staffId)
            .eq('tenant_id', ctx.tenantId)

        if (profileError) {
            return { success: false, error: "Failed to remove staff member" }
        }

        // Optionally: Delete the auth user entirely via service role
        // Only if they don't have profiles in other tenants
        const serviceClient = getServiceClient()
        const { data: otherProfiles } = await serviceClient
            .from('profiles')
            .select('id')
            .eq('id', staffId)

        if (!otherProfiles || otherProfiles.length === 0) {
            // No other profiles — safe to delete auth user
            await serviceClient.auth.admin.deleteUser(staffId)
        }

        revalidatePath('/settings')
        return { success: true }

    } catch (err: any) {
        return { success: false, error: err.message || "Failed to remove staff member" }
    }
}
