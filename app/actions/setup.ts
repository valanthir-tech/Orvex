"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

const setupSchema = z.object({
    organizationName: z.string().min(2, "Organization Name is required"),
    fullName: z.string().min(2, "Full Name is required"),
})

export async function completeSetup(formData: FormData) {
    const user = await getCurrentUser()

    if (!user) {
        redirect("/login")
    }

    // Double check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
        where: { email: user.email! }
    })

    if (existingProfile) {
        redirect("/")
    }

    const rawData = {
        organizationName: formData.get("organizationName"),
        fullName: formData.get("fullName"),
    }

    const validatedFields = setupSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return { error: "Validation failed." }
    }

    const { organizationName, fullName } = validatedFields.data

    try {
        // Transaction: Create Org + Create Profile
        await prisma.$transaction(async (tx) => {
            const org = await tx.organization.create({
                data: {
                    name: organizationName,
                    currency: "NPR", // Default for Nepal
                }
            })

            await tx.profile.create({
                data: {
                    id: user.id,
                    email: user.email!, // Email from Supabase Auth
                    fullName: fullName,
                    role: "OWNER",
                    organizationId: org.id
                }
            })
        })
    } catch (error) {
        console.error(error)
        return { error: "Failed to create organization." }
    }

    redirect("/")
}
