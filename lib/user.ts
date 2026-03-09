import { createSupabaseServerClient } from './tenant'

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

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile as UserProfile | null
}
