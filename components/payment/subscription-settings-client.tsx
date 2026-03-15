"use client"

import { useState } from "react"
import { CreditCard, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { badgeStyles } from "@/lib/theme"
import { PaymentForm } from "./payment-form"
import type { TenantSubscription, PaymentSubmission, SubscriptionPlan, PaymentQrCode } from "@/app/actions/subscriptions"

interface Props {
    subscription: TenantSubscription | null
    submissions: PaymentSubmission[]
    plans: SubscriptionPlan[]
    qrCodes: PaymentQrCode[]
}

function formatDate(d: string | null) {
    if (!d) return "—"
    return new Date(d).toLocaleDateString("en-NP", { dateStyle: "medium" })
}

function formatNPR(amount: number) {
    return `Rs. ${amount.toLocaleString("en-NP")}`
}

function statusBadgeClass(status: string): string {
    const map: Record<string, string> = {
        active: badgeStyles.success,
        approved: badgeStyles.success,
        pending: badgeStyles.warning,
        pending_payment: badgeStyles.warning,
        past_due: badgeStyles.warning,
        blocked: badgeStyles.danger,
        rejected: badgeStyles.danger,
        cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    }
    return map[status] ?? "bg-slate-100 text-slate-600"
}

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge className={`text-xs ${statusBadgeClass(status)}`}>
            {status.replace(/_/g, " ")}
        </Badge>
    )
}

export function SubscriptionSettingsClient({ subscription, submissions, plans, qrCodes }: Props) {
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const plan = subscription?.plan

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold font-heading tracking-tight">Subscription</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                    Manage your subscription plan and billing.
                </p>
            </div>

            {/* Current Plan Card */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-base flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                                {plan?.name ?? "No active plan"}
                            </CardTitle>
                            <CardDescription className="mt-1">
                                {plan ? `${formatNPR(plan.price_npr)} / month` : "Subscribe to unlock all features"}
                            </CardDescription>
                        </div>
                        {subscription?.status && <StatusBadge status={subscription.status} />}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {subscription?.status === "active" && (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Current Period</p>
                                <p className="text-sm font-medium">
                                    {formatDate(subscription.current_period_start)} — {formatDate(subscription.current_period_end)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Next Billing</p>
                                <p className="text-sm font-medium">{formatDate(subscription.next_billing_date)}</p>
                            </div>
                            {plan && (
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Stores / Staff</p>
                                    <p className="text-sm font-medium">
                                        {plan.max_stores >= 999 ? "Unlimited" : plan.max_stores} /{" "}
                                        {plan.max_staff >= 999 ? "Unlimited" : plan.max_staff}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <Separator />

                    <div className="flex gap-3">
                        <Button onClick={() => setShowPaymentModal(true)} size="sm">
                            <CreditCard className="mr-2 h-4 w-4" />
                            {subscription?.status === "active" ? "Change / Renew Plan" : "Submit Payment"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        Payment History
                    </CardTitle>
                    <CardDescription>All payment submissions and their verification status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Proof</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                        No payment submissions yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                submissions.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell className="text-sm">{formatDate(sub.submitted_at)}</TableCell>
                                        <TableCell className="text-sm">{(sub as any).plan?.name ?? "—"}</TableCell>
                                        <TableCell className="text-sm">{formatNPR(sub.amount_npr)}</TableCell>
                                        <TableCell className="text-sm capitalize">{sub.payment_method.replace("_", " ")}</TableCell>
                                        <TableCell className="text-sm font-mono text-xs">{sub.transaction_reference ?? "—"}</TableCell>
                                        <TableCell><StatusBadge status={sub.status} /></TableCell>
                                        <TableCell>
                                            {sub.payment_proof_url ? (
                                                <button
                                                    onClick={() => setPreviewUrl(sub.payment_proof_url)}
                                                    className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                                                >
                                                    View
                                                </button>
                                            ) : "—"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Payment Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-[1000px] max-h-[95vh] overflow-y-auto w-[95vw] p-4 sm:p-6">
                    <DialogHeader>
                        <DialogTitle>Submit Payment</DialogTitle>
                    </DialogHeader>
                    <PaymentForm
                        plans={plans}
                        qrCodes={qrCodes}
                        tenantId=""
                    />
                </DialogContent>
            </Dialog>

            {/* Proof Preview Modal */}
            <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Payment Proof</DialogTitle>
                    </DialogHeader>
                    {previewUrl && (
                        <img
                            src={previewUrl}
                            alt="Payment proof"
                            className="w-full rounded-lg border object-contain max-h-[60vh]"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
