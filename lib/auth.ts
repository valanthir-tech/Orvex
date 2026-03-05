"use server"

import { createSupabaseServerClient } from "./tenant" // Reuse helper from tenant.ts
import { redirect } from "next/navigation"

export async function getCurrentUser() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

export async function getProfile() {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile
}

export async function requireUser() {
    const user = await getCurrentUser()
    if (!user) redirect("/login")
    return user
}

export async function requireProfile() {
    const profile = await getProfile()
    if (!profile) redirect("/setup") // Or maybe /admin/setup if superadmin?
    return profile
}
