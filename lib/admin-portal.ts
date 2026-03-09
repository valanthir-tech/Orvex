function normalizeBaseUrl(baseUrl: string): string {
    return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`
}

export function getAdminPortalUrl(pathname: string = "/"): string | null {
    const baseUrl = process.env.NEXT_PUBLIC_ADMIN_PORTAL_URL?.trim()

    if (!baseUrl) {
        return null
    }

    try {
        return new URL(pathname.replace(/^\//, ""), normalizeBaseUrl(baseUrl)).toString()
    } catch {
        return null
    }
}
