import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

export async function getCurrentUser() {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }
    return user
}

export async function getProfile() {
    const user = await getCurrentUser()
    if (!user) return null

    const profile = await prisma.profile.findUnique({
        where: { email: user.email! },
        include: { organization: true }
    })

    return profile
}

export async function requireUser() {
    const user = await getCurrentUser()
    if (!user) {
        redirect("/login")
    }
    return user
}

export async function requireProfile() {
    const user = await requireUser()
    const profile = await prisma.profile.findUnique({
        where: { email: user.email! },
    })

    if (!profile) {
        // Handle case where auth user exists but profile doesn't (sync issue or new user)
        // For now, redirect to login or an onboarding page
        redirect("/login")
    }
    return profile
}
