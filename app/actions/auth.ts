"use server"

import { createClient } from "@supabase/supabase-js"

export async function checkUserRole(userId: string): Promise<string | null> {
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: profile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()

    return profile?.role ?? null
}
