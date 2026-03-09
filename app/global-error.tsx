"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error("Global error:", error)
    }, [error])

    return (
        <html>
            <body>
                <div className="flex min-h-screen items-center justify-center bg-background p-4">
                    <div className="max-w-md text-center space-y-6">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                            <AlertTriangle className="h-8 w-8 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold font-heading">Something went wrong</h2>
                            <p className="text-sm text-muted-foreground">
                                An unexpected error occurred. Please try again or contact support if the problem persists.
                            </p>
                        </div>
                        <Button onClick={reset} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    )
}
