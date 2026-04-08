"use client"

import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import { Check, Clock, AlertCircle, CreditCard, ChevronRight } from "lucide-react"
import { type TenantSubscription, type PaymentSubmission, type SubscriptionPlan, type PaymentQrCode } from "@/app/actions/subscriptions"
import { PaymentForm } from "./payment-form"
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface Props {
    subscription: TenantSubscription | null
    submissions: PaymentSubmission[]
    plans: SubscriptionPlan[]
    qrCodes: PaymentQrCode[]
    tenantId: string
}

export function SubscriptionSettingsClient({ subscription, submissions, plans, qrCodes, tenantId }: Props) {
    const [showPaymentForm, setShowPaymentForm] = useState(false)

    const isPastDue = subscription?.status === "past_due"
    const pendingSubmission = submissions.find(s => s.status === "pending")
    const activePlan = subscription?.plan

    if (!tenantId) return null

    if (showPaymentForm) {
        return (
            <div className="font-sans space-y-8 text-[#171717]">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Upgrade or Renew</h1>
                    <p className="text-[#171717]/60 tracking-wide mt-2">Select a plan and complete your payment to continue using Orvex.</p>
                </div>
                <div className="bg-[#fcfbf9] border border-[#171717]/10 p-2 md:p-8 rounded-3xl">
                    <button 
                        onClick={() => setShowPaymentForm(false)}
                        className="mb-8 text-sm font-medium tracking-wide text-[#171717]/60 hover:text-[#171717] flex items-center gap-2 transition-colors ml-4 md:ml-0"
                    >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Subscription Details
                    </button>
                    <PaymentForm plans={plans} qrCodes={qrCodes} tenantId={tenantId} />
                </div>
            </div>
        )
    }

    return (
        <div className="font-sans space-y-12 text-[#171717]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Subscription</h1>
                    <p className="text-[#171717]/60 tracking-wide mt-2">Manage your current plan and payment status.</p>
                </div>
                {!pendingSubmission && (
                    <button
                        onClick={() => setShowPaymentForm(true)}
                        className="bg-[#171717] hover:bg-[#3255f1] text-[#fcfbf9] px-6 py-3 rounded-xl font-medium tracking-wide transition-all shadow-lg shadow-black/10"
                    >
                        {activePlan ? "Change Plan" : "Subscribe Now"}
                    </button>
                )}
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-[#171717]/10 rounded-3xl p-8 relative overflow-hidden">
                    <h2 className="text-sm tracking-widest font-semibold uppercase text-[#171717]/40 mb-6">Current Plan</h2>
                    
                    {activePlan ? (
                        <>
                            <div className="flex items-baseline gap-2 mb-2">
                                <h3 className="text-3xl font-bold tracking-tight">{activePlan.name}</h3>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium tracking-wide",
                                    subscription?.status === "active" ? "bg-green-100 text-green-700" :
                                    isPastDue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                )}>
                                    {subscription?.status === "active" ? "Active" : 
                                     isPastDue ? "Past Due" : "Pending"}
                                </span>
                            </div>
                            <p className="text-[#171717]/60 tracking-wide mb-8">NPR {activePlan.price_npr.toLocaleString()}/{activePlan.billing_period}</p>
                            
                            {subscription?.current_period_end && (
                                <div className="bg-[#fcfbf9] p-4 rounded-xl border border-[#171717]/5 flex items-center justify-between">
                                    <span className="text-sm font-medium tracking-wide text-[#171717]/60">Next Billing Date</span>
                                    <span className="font-semibold tracking-wide font-mono">
                                        {format(new Date(subscription.current_period_end), "MMM dd, yyyy")}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-lg font-medium text-[#171717]/80">No Active Plan</p>
                            <p className="text-sm text-[#171717]/40 mt-2">You are currently on a trial or pending activation.</p>
                        </div>
                    )}
                </div>

                {pendingSubmission && (
                    <div className="bg-[#3255f1]/5 border border-[#3255f1]/20 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-[#3255f1]/10 rounded-full flex items-center justify-center mb-6">
                            <Clock className="w-8 h-8 text-[#3255f1]" />
                        </div>
                        <h3 className="text-xl font-semibold tracking-tight text-[#171717] mb-2">Payment Processing</h3>
                        <p className="text-[#171717]/60 tracking-wide max-w-xs">
                            Your payment submitted {formatDistanceToNow(new Date(pendingSubmission.submitted_at))} ago is currently being verified.
                        </p>
                    </div>
                )}
            </div>

            {/* Past Submissions */}
            {submissions.length > 0 && (
                <div className="bg-white border border-[#171717]/10 rounded-3xl p-8">
                    <h2 className="text-xl font-semibold tracking-tight text-[#171717] mb-6">Payment History</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#171717]/10">
                                    <th className="pb-4 font-medium tracking-wide text-[#171717]/40 text-sm">Date</th>
                                    <th className="pb-4 font-medium tracking-wide text-[#171717]/40 text-sm">Amount</th>
                                    <th className="pb-4 font-medium tracking-wide text-[#171717]/40 text-sm">Method</th>
                                    <th className="pb-4 font-medium tracking-wide text-[#171717]/40 text-sm">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map((sub) => (
                                    <tr key={sub.id} className="border-b border-[#171717]/5 last:border-0 hover:bg-[#fcfbf9]/50 transition-colors">
                                        <td className="py-4 text-sm font-medium tracking-wide">
                                            {format(new Date(sub.submitted_at), "MMM dd, yyyy")}
                                        </td>
                                        <td className="py-4 font-mono text-sm tracking-wide">
                                            NPR {sub.amount_npr.toLocaleString()}
                                        </td>
                                        <td className="py-4 text-sm tracking-wide capitalize">
                                            {sub.payment_method.replace(/_/g, " ")}
                                        </td>
                                        <td className="py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-xs font-medium tracking-wide",
                                                sub.status === "approved" ? "bg-green-100 text-green-700" :
                                                sub.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                                            )}>
                                                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}
