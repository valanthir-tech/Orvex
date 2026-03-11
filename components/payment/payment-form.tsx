"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Check, Upload, Loader2, CreditCard, Smartphone, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { submitPayment, type SubscriptionPlan, type PaymentQrCode } from "@/app/actions/subscriptions"

interface PaymentFormProps {
    plans: SubscriptionPlan[]
    qrCodes: PaymentQrCode[]
    tenantId: string
}

function formatNPR(amount: number) {
    return `Rs. ${amount.toLocaleString("en-NP")}`
}

function FeatureItem({ label, value }: { label: string; value: boolean | string }) {
    if (value === false) return null
    return (
        <div className="flex items-center gap-2 text-sm">
            <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
            <span className="text-muted-foreground">{label}</span>
        </div>
    )
}

export function PaymentForm({ plans, qrCodes, tenantId }: PaymentFormProps) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id ?? "")
    const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "esewa">("bank_transfer")
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [proofPreview, setProofPreview] = useState<string | null>(null)
    const [transactionRef, setTransactionRef] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const selectedPlan = plans.find(p => p.id === selectedPlanId)
    const qrCode = qrCodes.find(q => q.payment_method === paymentMethod && q.is_active)

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            setError("File size must be under 5MB")
            return
        }
        setProofFile(file)
        setError(null)
        const reader = new FileReader()
        reader.onloadend = () => setProofPreview(reader.result as string)
        reader.readAsDataURL(file)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedPlan) { setError("Please select a plan"); return }
        if (!proofFile) { setError("Please upload payment proof"); return }
        if (!transactionRef.trim()) { setError("Please enter the transaction reference"); return }

        setIsSubmitting(true)
        setError(null)

        try {
            await submitPayment({
                planId: selectedPlanId,
                amountNpr: selectedPlan.price_npr,
                paymentMethod,
                proofFile,
                transactionReference: transactionRef,
            })
            setSuccess(true)
            // Refresh after 3 seconds to show pending state
            setTimeout(() => router.refresh(), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit payment")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (success) {
        return (
            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                            <Check className="h-7 w-7 text-green-600" />
                        </div>
                    </div>
                    <CardTitle className="text-green-800 dark:text-green-200">Payment Submitted!</CardTitle>
                    <CardDescription className="text-green-700 dark:text-green-300">
                        Your payment proof has been received. Our team will verify it within 24 hours and activate your account. You will receive a confirmation email.
                    </CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Plan Selection */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">1. Choose Your Plan</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                    {plans.map(plan => (
                        <button
                            key={plan.id}
                            type="button"
                            onClick={() => setSelectedPlanId(plan.id)}
                            className={`text-left rounded-xl border-2 p-4 transition-all ${
                                selectedPlanId === plan.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-background hover:border-primary/40"
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                    <div className="font-semibold text-sm">{plan.name}</div>
                                    <div className="text-lg font-bold mt-0.5">{formatNPR(plan.price_npr)}</div>
                                    <div className="text-xs text-muted-foreground">per month</div>
                                </div>
                                {selectedPlanId === plan.id && (
                                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary shrink-0 mt-0.5">
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                            <Separator className="my-2" />
                            <div className="space-y-1">
                                <FeatureItem label="POS" value={plan.features.pos} />
                                <FeatureItem label="Inventory" value={plan.features.inventory} />
                                <FeatureItem
                                    label={plan.features.reports === "advanced" ? "Advanced Reports" : "Basic Reports"}
                                    value={!!plan.features.reports}
                                />
                                {plan.features.khata && <FeatureItem label="Khata / Credit" value />}
                                {plan.features.multi_warehouse && <FeatureItem label="Multi-warehouse" value />}
                                {plan.features.api_access && <FeatureItem label="API Access" value />}
                                <div className="text-xs text-muted-foreground pt-1">
                                    {plan.max_stores >= 999 ? "Unlimited" : plan.max_stores} store{plan.max_stores !== 1 ? "s" : ""} ·{" "}
                                    {plan.max_staff >= 999 ? "Unlimited" : plan.max_staff} staff
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">2. Payment Method</h2>
                <div className="grid grid-cols-2 gap-3">
                    {(["bank_transfer", "esewa"] as const).map(method => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                                paymentMethod === method
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-background hover:border-primary/40"
                            }`}
                        >
                            {method === "bank_transfer"
                                ? <Building2 className="h-5 w-5 text-muted-foreground" />
                                : <Smartphone className="h-5 w-5 text-muted-foreground" />}
                            <div className="text-left">
                                <div className="text-sm font-medium">
                                    {method === "bank_transfer" ? "Bank Transfer" : "eSewa"}
                                </div>
                            </div>
                            {paymentMethod === method && (
                                <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* QR Code & Payment Details */}
            {selectedPlan && (
                <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            {paymentMethod === "bank_transfer" ? "Bank Transfer Details" : "eSewa Payment"}
                        </CardTitle>
                        <CardDescription>
                            Send exactly <strong>{formatNPR(selectedPlan.price_npr)}</strong> using the details below, then upload your screenshot.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-6 items-start">
                            {qrCode?.qr_code_url ? (
                                <div className="shrink-0">
                                    <Image
                                        src={qrCode.qr_code_url}
                                        alt={`${paymentMethod} QR code`}
                                        width={140}
                                        height={140}
                                        className="rounded-lg border bg-white"
                                    />
                                </div>
                            ) : (
                                <div className="shrink-0 h-[140px] w-[140px] rounded-lg border bg-muted flex items-center justify-center">
                                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                            <div className="space-y-2 text-sm min-w-0">
                                {qrCode && Object.entries(qrCode.payment_details).map(([key, val]) => (
                                    <div key={key}>
                                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}: </span>
                                        <span className="font-medium break-all">{val}</span>
                                    </div>
                                ))}
                                {selectedPlan && (
                                    <Badge variant="outline" className="mt-1">
                                        Amount: {formatNPR(selectedPlan.price_npr)}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Upload Proof */}
            <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">3. Upload Payment Screenshot</h2>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors hover:border-primary/60 ${
                        proofFile ? "border-primary/60 bg-primary/5" : "border-border"
                    }`}
                >
                    {proofPreview ? (
                        <div className="space-y-2">
                            <img
                                src={proofPreview}
                                alt="Payment proof preview"
                                className="mx-auto max-h-40 rounded-lg object-contain"
                            />
                            <p className="text-xs text-muted-foreground">{proofFile?.name}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Click to upload screenshot (JPEG, PNG, PDF — max 5MB)
                            </p>
                        </div>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>

            {/* Transaction Reference */}
            <div className="space-y-2">
                <Label htmlFor="transaction-ref">Transaction Reference / Receipt Number</Label>
                <Input
                    id="transaction-ref"
                    placeholder="e.g. TXN-1234567890 or esewa receipt ID"
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                    className="h-11"
                />
                <p className="text-xs text-muted-foreground">
                    Found in your bank statement, mobile banking notification, or eSewa receipt.
                </p>
            </div>

            {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-sm font-medium">
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting Payment...
                    </>
                ) : (
                    `Submit Payment – ${selectedPlan ? formatNPR(selectedPlan.price_npr) : ""}`
                )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
                Payments are manually verified by our team within 24 hours.
            </p>
        </form>
    )
}
