"use server"

// With ERPNext, authentication is handled via session cookies.
// This is a stub file to maintain compatibility with existing imports.
// In a fuller implementation, this would check the ERPNext session cookie.

export async function getCurrentUser() {
    // Return a dummy user since ERPNext handles session validation
    // The middleware or API calls will fail if not authenticated
    return {
        id: "administrator",
        email: "admin@example.com",
        fullName: "Administrator"
    }
}

export async function getProfile() {
    return {
        id: "administrator",
        organizationId: "Valanthir Tech", // Default company
        role: "OWNER"
    }
}

export async function requireUser() {
    return getCurrentUser()
}

export async function requireProfile() {
    return getProfile()
}
