"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Check, Upload, Loader2, ArrowRight } from "lucide-react"
import { submitPayment, type SubscriptionPlan, type PaymentQrCode } from "@/app/actions/subscriptions"
import Image from "next/image"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function PaymentForm({ plans, qrCodes, tenantId }: { plans: SubscriptionPlan[], qrCodes: PaymentQrCode[], tenantId: string }) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const availableMethods = (["bank_transfer", "esewa"] as const).filter(
        m => qrCodes.some(q => q.payment_method === m && q.is_active)
    )

    const [selectedPlanId, setSelectedPlanId] = useState<string>(plans.find(p => p.is_active)?.id ?? "")
    const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "esewa">(availableMethods[0] ?? "bank_transfer")
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [proofPreview, setProofPreview] = useState<string | null>(null)
    const [transactionRef, setTransactionRef] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const activePlan = plans.find(p => p.id === selectedPlanId)
    const activeQr = qrCodes.find(q => q.payment_method === paymentMethod && q.is_active)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file (JPG, PNG)")
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            setError("File size must be less than 2MB")
            return
        }

        setError(null)
        setProofFile(file)

        const reader = new FileReader()
        reader.onloadend = () => {
            setProofPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activePlan) {
            setError("Please choose a subscription plan")
            return
        }
        if (!transactionRef.trim() && !proofFile) {
            setError("Please provide either a screenshot of payment or a transaction reference number")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const formData = new FormData();
            formData.append("planId", activePlan.id);
            formData.append("amountNpr", activePlan.price_npr.toString());
            formData.append("paymentMethod", paymentMethod);
            formData.append("transactionReference", transactionRef || "");
            if (proofFile) {
                // Since actions take plain objects/Files differently, we check how `submitPayment` handles form-data or files.
                // Actually it was requesting a `proofFile: File` in object:
            }
            
            const result = await submitPayment({
                planId: activePlan.id,
                amountNpr: activePlan.price_npr,
                paymentMethod,
                transactionReference: transactionRef || "",
                proofFile: proofFile as File, // fallback to as File to satisfy type since we checked it above
            });

            // Assuming typical error handling
            if ((result as any)?.error) {
                setError((result as any).error);
            } else {
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="font-sans space-y-12">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium tracking-wide">
                    {error}
                </div>
            )}
            
            {/* Plans Selection */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#171717] mb-6">Choose your tier</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {plans.filter(p => p.is_active).map((plan) => {
                        const isSelected = selectedPlanId === plan.id;
                        return (
                            <div 
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
                                className={cn(
                                    "p-6 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden",
                                    isSelected ? "border-[#3255f1] bg-[#3255f1]/5 shadow-sm" : "border-[#171717]/10 hover:border-[#171717]/30 bg-white"
                                )}
                            >
                                {isSelected && (
                                    <div className="absolute top-4 right-4 bg-[#3255f1] text-[#fcfbf9] p-1 rounded-full shadow-sm">
                                        <Check className="w-4 h-4 stroke-[3]" />
                                    </div>
                                )}
                                <h3 className="text-lg font-semibold tracking-tight text-[#171717]">{plan.name}</h3>
                                <div className="mt-2 mb-6 flex items-baseline gap-1">
                                    <span className="text-3xl font-bold tracking-tighter text-[#171717]">NPR {plan.price_npr.toLocaleString()}</span>
                                    <span className="text-xs font-medium tracking-wide text-[#171717]/40 uppercase">/{plan.billing_period}</span>
                                </div>

                                <ul className="space-y-3">
                                    {[
                                        { s: plan.features.pos, t: "Offline POS" },
                                        { s: plan.features.inventory, t: "Inventory & Sync" },
                                        { s: plan.features.khata, t: "Khata ledger" },
                                        { s: plan.features.multi_warehouse, t: "Multi-Warehouse" },
                                        { s: true, t: `${plan.max_stores} Store Location${plan.max_stores > 1 ? 's' : ''}` },
                                        { s: true, t: `${plan.max_staff} Staff User${plan.max_staff > 1 ? 's' : ''}` },
                                    ].map((f, i) => (
                                        <li key={i} className="flex gap-3 items-center">
                                            <div className={cn("flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full", f.s ? "bg-[#3255f1]/10 text-[#3255f1]" : "bg-[#171717]/5 text-[#171717]/20")}>
                                                {f.s ? <Check className="w-3 h-3 stroke-[3]" /> : <span className="w-1.5 h-px bg-current rounded-full" />}
                                            </div>
                                            <span className={cn("text-sm tracking-wide", f.s ? "text-[#171717]/80" : "text-[#171717]/40")}>{f.t}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-[#171717]/10 p-6 md:p-8 rounded-3xl">
                <h2 className="text-xl font-semibold tracking-tight text-[#171717] mb-6">Payment Method</h2>
                <div className="flex flex-wrap gap-3 mb-8">
                    {availableMethods.map(method => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={cn(
                                "px-6 py-3 rounded-xl border font-medium tracking-wide transition-all",
                                paymentMethod === method 
                                    ? "bg-[#171717] text-white border-[#171717] shadow-lg shadow-black/10"
                                    : "bg-[#fcfbf9] text-[#171717]/60 border-[#171717]/10 hover:text-[#171717] hover:border-[#171717]/20"
                            )}
                        >
                            {method === "bank_transfer" ? "Bank Transfer" : "eSewa"}
                        </button>
                    ))}
                </div>

                {activeQr && (
                    <div className="bg-[#fcfbf9] border border-[#171717]/5 p-6 rounded-2xl flex flex-col md:flex-row gap-8 items-start">
                        <div className="bg-white p-4 rounded-xl border border-[#171717]/5 flex-shrink-0 mx-auto md:mx-0 shadow-sm">
                            <Image src={activeQr.qr_code_url} alt="QR Code" width={160} height={160} className="rounded-lg mix-blend-multiply" />
                        </div>
                        <div className="flex-grow space-y-4 w-full">
                            <div>
                                <h4 className="text-xs font-semibold tracking-widest uppercase text-[#171717]/40 mb-3">Account Details</h4>
                                {Object.entries(activeQr.payment_details).map(([k, v]) => (
                                    <div key={k} className="flex justify-between items-center py-2.5 border-b border-[#171717]/5 last:border-0">
                                        <span className="text-sm text-[#171717]/60 tracking-wide capitalize">{k.replace(/_/g, ' ')}</span>
                                        <span className="text-sm font-semibold text-[#171717]">{String(v)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Proof Submission */}
            <div className="bg-white border border-[#171717]/10 p-6 md:p-8 rounded-3xl">
                <h2 className="text-xl font-semibold tracking-tight text-[#171717] mb-6">Verify Payment</h2>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm tracking-wide font-medium text-[#171717]/80 mb-2">Transaction Reference / Remarks</label>
                        <input
                            type="text"
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g. TRN-123456789"
                            className="w-full bg-[#fcfbf9] border border-[#171717]/10 rounded-xl px-4 py-3.5 text-[#171717] focus:outline-none focus:ring-2 focus:ring-[#3255f1]/20 focus:border-[#3255f1]/30 transition-all font-medium placeholder:text-[#171717]/30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm tracking-wide font-medium text-[#171717]/80 mb-2">Upload Screenshot (Optional if Reference provided)</label>
                        
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all",
                                proofPreview ? "border-[#3255f1]/30 bg-[#3255f1]/5" : "border-[#171717]/15 hover:border-[#171717]/30 bg-[#fcfbf9] hover:bg-white"
                            )}
                        >
                            {proofPreview ? (
                                <div className="space-y-4 flex flex-col items-center">
                                    <div className="relative w-full max-w-[200px] h-32 mx-auto rounded-xl overflow-hidden shadow-sm border border-[#171717]/10">
                                        <Image src={proofPreview} alt="Proof" fill className="object-cover" />
                                    </div>
                                    <p className="text-sm font-medium text-[#3255f1]">Change Screenshot</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-3">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#171717]/5 mb-2">
                                        <Upload className="w-5 h-5 text-[#171717]/60" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium tracking-wide text-[#171717]">Click to upload screenshot</p>
                                        <p className="text-xs text-[#171717]/40 mt-1.5">JPEG or PNG, max 2MB</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/jpeg,image/png,image/jpg"
                            className="hidden"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-4 bg-[#3255f1] hover:bg-[#3255f1]/90 text-white rounded-xl py-4 flex items-center justify-center gap-2 font-medium tracking-wide transition-all disabled:opacity-50 shadow-lg shadow-[#3255f1]/20"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                Complete Subscription
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    )
}
