"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { requestStorefront } from "@/app/actions/storefront"
import { toast } from "sonner"
import { CheckCircle2, Store, ShoppingBag, Globe, Zap, Cpu } from "lucide-react"

export function StorefrontRequest({ currentPlan }: { currentPlan: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Pricing matrix based on plan
  let fee = 5000 // Starter
  let features = ["Basic Ecommerce Theme", "Up to 50 Products", "Mobile Responsive", "Standard Hosting"]
  
  if (currentPlan === "growth") {
    fee = 15000
    features = ["Premium AI-Generated Design", "Unlimited Products", "Custom Branding & Colors", "Advanced Animations", "Priority Support"]
  } else if (currentPlan === "pro") {
    fee = 30000
    features = ["Fully Custom Next.js Coded Headless Site", "Unlimited Features", "Dedicated Developer", "Premium Domain Configuration", "Sub-second Loading Speed"]
  }

  const handleRequest = async () => {
    setIsLoading(true)
    try {
      await requestStorefront()
      toast.success("Storefront requested! Please proceed to payment.")
      router.refresh()
    } catch (e: any) {
      toast.error(e.message || "Failed to request storefront.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-10">
        <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Store className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Launch Your E-Commerce Store</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          We build gorgeous, high-converting storefronts mathematically integrated directly with your POS system.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="text-2xl font-semibold mb-4">Your {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan Features</h3>
          <ul className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
            <li className="flex items-center text-muted-foreground">
                <Globe className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
                <span>Free Subdomain Included (yourstore.orvex.page)</span>
            </li>
            <li className="flex items-center text-muted-foreground">
                <Zap className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" />
                <span>Instant POS Sync & Live Inventory</span>
            </li>
          </ul>
        </div>

        <Card className="shadow-lg border-primary/20 bg-card">
          <CardHeader className="text-center pb-2">
            <CardTitle>One-Time Setup Fee</CardTitle>
            <CardDescription>Pay once, keep it forever.</CardDescription>
          </CardHeader>
          <CardContent className="text-center pt-4 pb-6">
            <div className="text-5xl font-extrabold tracking-tighter text-primary">Rs.{(fee / 1000).toLocaleString()}K</div>
            <p className="text-sm text-muted-foreground mt-2">NPR - Monthly Maintenance Fees Apply</p>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              className="w-full size-lg text-lg py-6" 
              onClick={handleRequest} 
              disabled={isLoading}
            >
              {isLoading ? "Preparing Order..." : "Request Storefront Build"}
            </Button>
            <p className="text-xs text-center text-muted-foreground px-4">
              Upon clicking, you will be directed to upload payment verification. Build time is roughly 2-4 business days.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
