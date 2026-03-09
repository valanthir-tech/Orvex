import { timingSafeEqual } from "node:crypto"
import type { NextRequest } from "next/server"

function safeCompare(expected: string, received: string): boolean {
    const expectedBuffer = Buffer.from(expected)
    const receivedBuffer = Buffer.from(received)

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer)
}

export function isInternalAdminRequest(request: NextRequest): boolean {
    const configuredSecret = process.env.INTERNAL_ADMIN_API_SECRET?.trim()

    if (!configuredSecret) {
        return false
    }

    const secretHeader = request.headers.get("x-internal-admin-secret")?.trim()
    if (secretHeader && safeCompare(configuredSecret, secretHeader)) {
        return true
    }

    const authorization = request.headers.get("authorization")
    if (!authorization?.startsWith("Bearer ")) {
        return false
    }

    return safeCompare(configuredSecret, authorization.slice("Bearer ".length).trim())
}
