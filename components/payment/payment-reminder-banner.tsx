"use client"

import Link from "next/link"
import { AlertTriangle, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface PaymentReminderBannerProps {
    status: "past_due" | "blocked" | "pending_payment"
    daysRemaining: number | null
    gracePeriodEnd: string | null
}

export function PaymentReminderBanner({ status, daysRemaining, gracePeriodEnd }: PaymentReminderBannerProps) {
    const [dismissed, setDismissed] = useState(false)

    if (dismissed && status !== "blocked") return null

    const isBlocked = status === "blocked"
    const graceEnd = gracePeriodEnd ? new Date(gracePeriodEnd) : null
    const daysUntilBlock = graceEnd
        ? Math.max(0, Math.ceil((graceEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null

    return (
        <div
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                isBlocked
                    ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
                    : "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
            }`}
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                    {isBlocked ? (
                        <p>
                            <strong>Account suspended.</strong> Your subscription has expired. Submit payment to restore access.
                        </p>
                    ) : status === "past_due" ? (
                        <p>
                            <strong>Subscription overdue.</strong>{" "}
                            {daysUntilBlock !== null && daysUntilBlock > 0
                                ? `Your account will be suspended in ${daysUntilBlock} day${daysUntilBlock !== 1 ? "s" : ""}.`
                                : "Please renew immediately to avoid suspension."}
                        </p>
                    ) : (
                        <p>
                            <strong>Payment required.</strong> Submit your subscription payment to activate full access.
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <Button
                    asChild
                    size="sm"
                    variant={isBlocked ? "destructive" : "default"}
                    className="h-7 text-xs"
                >
                    <Link href="/payment">
                        <RefreshCw className="mr-1.5 h-3 w-3" />
                        Renew Now
                    </Link>
                </Button>
                {!isBlocked && (
                    <button
                        onClick={() => setDismissed(true)}
                        className="ml-1 rounded-full p-0.5 hover:bg-amber-200 dark:hover:bg-amber-900"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    )
}
