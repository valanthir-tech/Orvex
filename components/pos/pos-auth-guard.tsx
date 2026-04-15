"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { db } from "@/lib/db"
import { Loader2 } from "lucide-react"

export function POSAuthGuard({ children }: { children: React.ReactNode }) {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Exclude the login page from the check
        if (pathname === '/pos/login') {
            setIsAuthorized(true)
            return
        }

        async function verifyLocalSession() {
            try {
                const sessionUser = await db.configStore.get("active_session_user_id")
                
                if (!sessionUser) {
                    setIsAuthorized(false)
                    router.replace("/pos/login")
                } else {
                    setIsAuthorized(true)
                }
            } catch (err) {
                console.error("Dexie Auth Guard Error:", err)
                setIsAuthorized(false)
                router.replace("/pos/login")
            }
        }

        verifyLocalSession()
    }, [pathname, router])

    if (isAuthorized === null) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (isAuthorized === false && pathname !== '/pos/login') {
        return null // Will redirect
    }

    return <>{children}</>
}
