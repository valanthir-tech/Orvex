"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { getTenantClient } from "@/lib/tenant"

const setupSchema = z.object({
    organizationName: z.string().min(2, "Organization Name is required"),
    fullName: z.string().min(2, "Full Name is required"),
})

export async function completeSetup(formData: FormData) {
    const rawData = {
        organizationName: formData.get("organizationName"),
        fullName: formData.get("fullName"),
    }

    const validatedFields = setupSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return { error: "Validation failed." }
    }

    // Company setup is done in CoreEngine's setup wizard
    redirect("/")
}

// Check if setup is complete (company exists in CoreEngine)
export async function isSetupComplete(): Promise<boolean> {
    try {
        const client = await getTenantClient()
        const companies = await client.getList<{ name: string }>('Company', {
            fields: ['name'],
            limit: 1,
        })
        return companies.length > 0
    } catch {
        return false
    }
}

// Get the default company from CoreEngine
export async function getDefaultCompany(): Promise<string | null> {
    try {
        const client = await getTenantClient()
        const companies = await client.getList<{ name: string }>('Company', {
            fields: ['name'],
            limit: 1,
        })
        return companies[0]?.name || null
    } catch {
        return null
    }
}
