"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ShieldCheck, MailWarning } from "lucide-react"

export function PaymentVerificationPending({ amount, method, refCode }: { amount: number, method: string, refCode: string }) {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center flex flex-col items-center">
      <div className="bg-yellow-500/10 w-24 h-24 rounded-full flex items-center justify-center mb-6">
        <Clock className="h-12 w-12 text-yellow-500 animate-pulse" />
      </div>
      
      <h2 className="text-3xl font-bold tracking-tight mb-2">Payment Under Verification</h2>
      <p className="text-muted-foreground text-lg mb-8 max-w-lg">
        We have received your payment submission. Our finance team is reviewing the transaction right now.
      </p>

      <Card className="w-full text-left bg-card/50">
        <CardHeader>
          <CardTitle>Submission Details</CardTitle>
          <CardDescription>Your setup will begin immediately after successful verification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 border-b pb-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Amount Submitted</p>
              <p className="text-lg font-semibold">₹{(amount / 1000).toLocaleString()}K</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Method</p>
              <p className="text-lg font-semibold capitalize">{method.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reference / Remarks</p>
              <p className="text-lg font-mono">{refCode}</p>
            </div>
          </div>
          
          <div className="bg-secondary p-4 rounded-lg flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Verification Timeline</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Standard verifications take 1-4 business hours. If we need more information, we will contact you via email. Once verified, your website build will automatically begin!
              </p>
            </div>
          </div>
          <div className="bg-secondary/50 p-4 rounded-lg flex items-start gap-3">
            <MailWarning className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium mb-1">Need help?</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                 Contact support@orvex.app if your payment remains unverified for over 24 hours.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
