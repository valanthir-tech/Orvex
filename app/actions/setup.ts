"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

// This file handled initial setup with Prisma/Supabase
// With ERPNext, setup is done through ERPNext's own setup wizard
// This file now just provides stub functions for compatibility

const setupSchema = z.object({
    organizationName: z.string().min(2, "Organization Name is required"),
    fullName: z.string().min(2, "Full Name is required"),
})

export async function completeSetup(formData: FormData) {
    // With ERPNext as backend, organization/company setup is done in ERPNext
    // This function is now a no-op that redirects to the main page
    // The user should have already set up their company in ERPNext's setup wizard

    const rawData = {
        organizationName: formData.get("organizationName"),
        fullName: formData.get("fullName"),
    }

    const validatedFields = setupSchema.safeParse(rawData)

    if (!validatedFields.success) {
        return { error: "Validation failed." }
    }

    // In the ERPNext-backed system, we don't need to create anything here
    // The company was already created during ERPNext setup
    // User/profile management is handled by ERPNext's User doctype

    redirect("/")
}

// Check if setup is complete (company exists in ERPNext)
export async function isSetupComplete(): Promise<boolean> {
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || 'http://localhost:8080'

    try {
        const response = await fetch(
            `${ERPNEXT_URL}/api/resource/Company?limit_page_length=1`,
            {
                headers: { 'Content-Type': 'application/json' },
            }
        )

        if (!response.ok) return false

        const data = await response.json()
        return data.data && data.data.length > 0
    } catch {
        return false
    }
}

// Get the default company from ERPNext
export async function getDefaultCompany(): Promise<string | null> {
    const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || 'http://localhost:8080'

    try {
        const response = await fetch(
            `${ERPNEXT_URL}/api/resource/Company?limit_page_length=1&fields=["name"]`,
            {
                headers: { 'Content-Type': 'application/json' },
            }
        )

        if (!response.ok) return null

        const data = await response.json()
        if (data.data && data.data.length > 0) {
            return data.data[0].name
        }
        return null
    } catch {
        return null
    }
}
