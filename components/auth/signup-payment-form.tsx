"use client"

import { useState, useRef } from "react"
import { Check, Upload, Loader2, ArrowRight } from "lucide-react"
import { SubscriptionPlan, PaymentQrCode } from "@/app/actions/subscriptions"
import Image from "next/image"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function SignupPaymentForm({ 
    plans, 
    qrCodes, 
    signupId,
    onSuccess
}: { 
    plans: SubscriptionPlan[], 
    qrCodes: PaymentQrCode[], 
    signupId: string,
    onSuccess: () => void
}) {
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
            formData.append("signupId", signupId);
            formData.append("planId", activePlan.id);
            formData.append("paymentMethod", paymentMethod);
            formData.append("paymentReference", transactionRef || "");
            if (proofFile) {
                formData.append("proofFile", proofFile);
            }
            
            const res = await fetch("/api/tenants/payment", {
                method: "POST",
                body: formData,
            })

            const result = await res.json()
            if (!result.success) {
                setError(result.error || "Failed to submit payment details.")
                setIsSubmitting(false)
                return
            }

            onSuccess()
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred")
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="font-sans space-y-8">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium tracking-wide">
                    {error}
                </div>
            )}
            
            {/* Plans Selection */}
            <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#171717] mb-6">Choose your tier</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Payment Method & Instructions */}
            {activePlan && (
                <div className="pt-8 border-t border-[#171717]/10">
                    <h2 className="text-xl font-semibold tracking-tight text-[#171717] mb-6">Make Payment</h2>
                    
                    {availableMethods.length > 1 && (
                        <div className="flex gap-4 mb-8">
                            {availableMethods.map(method => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setPaymentMethod(method)}
                                    className={cn(
                                        "px-6 py-3 rounded-full text-sm font-semibold tracking-wide uppercase transition-all",
                                        paymentMethod === method
                                            ? "bg-[#171717] text-[#fcfbf9]"
                                            : "bg-[#171717]/5 text-[#171717]/60 hover:bg-[#171717]/10 hover:text-[#171717]"
                                    )}
                                >
                                    {method.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="bg-[#fcfbf9] rounded-2xl p-6 md:p-8 border border-[#171717]/10">
                        {activeQr ? (
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-[#171717]/5">
                                    <Image 
                                        src={activeQr.qr_code_url}
                                        alt={`${paymentMethod} QR Code`}
                                        width={200}
                                        height={200}
                                        className="rounded-xl w-full max-w-[200px] h-auto object-cover"
                                    />
                                    <p className="text-center text-xs font-medium tracking-wide uppercase text-[#171717]/40 mt-4">Scan to Pay</p>
                                </div>
                                <div className="space-y-4 flex-1">
                                    <h3 className="font-semibold tracking-tight text-lg mb-2 capitalize">{paymentMethod.replace("_", " ")} Details</h3>
                                    {Object.entries(activeQr.payment_details).map(([key, val]) => (
                                        <div key={key} className="flex flex-col">
                                            <span className="text-xs uppercase tracking-wider font-semibold text-[#171717]/40">{key.replace(/_/g, ' ')}</span>
                                            <span className="font-medium tracking-wide">{val as string}</span>
                                        </div>
                                    ))}
                                    <div className="pt-4 mt-6 border-t border-[#171717]/10">
                                        <p className="text-sm tracking-wide text-[#171717]/60 mb-2">Total Amount to Pay</p>
                                        <p className="text-3xl font-bold tracking-tighter text-[#3255f1]">
                                            NPR {activePlan.price_npr.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm tracking-wide text-[#171717]/60">No payment details available for this method.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Proof Upload */}
            <div className="pt-8 border-t border-[#171717]/10 space-y-6">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight text-[#171717] mb-2">Verify Payment</h2>
                    <p className="text-sm tracking-wide text-[#171717]/60">Provide the transaction reference number or upload a screenshot to verify your payment.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Reference Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold tracking-wide uppercase text-[#171717]/60">
                            Transaction reference / Remarks
                        </label>
                        <Input 
                            value={transactionRef}
                            onChange={(e) => setTransactionRef(e.target.value)}
                            placeholder="e.g. TXN-123456789"
                            className="bg-white"
                        />
                    </div>

                    {/* Screenshot Upload */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold tracking-wide uppercase text-[#171717]/60">
                            Payment Screenshot (Optional)
                        </label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        
                        {proofPreview ? (
                            <div className="relative group rounded-xl overflow-hidden border border-[#171717]/10 shadow-sm inline-block">
                                <Image 
                                    src={proofPreview} 
                                    alt="Proof preview" 
                                    fill
                                    className="w-full h-32 object-cover" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setProofFile(null);
                                            setProofPreview(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                        className="px-4 py-2 bg-white rounded-full text-xs font-bold uppercase tracking-widest text-[#171717] hover:scale-105 transition-transform"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-32 rounded-xl border-2 border-dashed border-[#171717]/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#3255f1] hover:bg-[#3255f1]/5 transition-colors bg-white"
                            >
                                <div className="w-10 h-10 rounded-full bg-[#171717]/5 flex items-center justify-center text-[#171717]/40">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium tracking-wide text-[#171717]/60 text-center inline-block px-4">
                                    Click to upload receipt <br/><span className="text-xs opacity-70">JPG, PNG (Max 2MB)</span>
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Button 
                type="submit" 
                disabled={isSubmitting || !activePlan}
                className="w-full h-14 bg-[#3255f1] hover:bg-[#3255f1]/90 text-white rounded-xl font-bold tracking-wide text-lg shadow-lg shadow-[#3255f1]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                    <>Submit Payment <ArrowRight className="w-5 h-5" /></>
                )}
            </Button>
        </form>
    )
}
