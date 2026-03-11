import { createSupabaseServerClient } from './tenant'
import { createClient } from '@supabase/supabase-js'

export type UserRole = 'superadmin' | 'admin' | 'manager' | 'cashier'

export interface UserProfile {
    id: string
    tenant_id: string | null
    email: string
    first_name: string | null
    last_name: string | null
    role: UserRole
}

export async function getUserProfile(): Promise<UserProfile | null> {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Use service-role client to bypass RLS for reliable profile reads
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profile) return profile as UserProfile

    // Self-heal: if the DB trigger didn't fire, create the profile now
    // Use insert (not upsert) so we never overwrite an existing row's role
    const meta = user.user_metadata || {}
    const { data: created, error: insertError } = await adminClient
        .from('profiles')
        .insert({
            id: user.id,
            email: user.email!,
            first_name: meta.first_name || null,
            last_name: meta.last_name || null,
            role: meta.role || 'cashier',
            tenant_id: null,
        })
        .select()
        .single()

    // If insert failed (duplicate), fetch existing profile
    if (insertError) {
        const { data: existing } = await adminClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
        return existing as UserProfile | null
    }

    return created as UserProfile | null
}
