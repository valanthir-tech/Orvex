"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Hammer, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

export function WebsiteBuildingStatus({ currentPlan }: { currentPlan: string }) {
  const [progress, setProgress] = useState(0)
  
  // Progress animation mockup for UX
  useEffect(() => {
    const timer = setTimeout(() => setProgress(35), 500)
    return () => clearTimeout(timer)
  }, [])
  
  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-8">
        <div className="mx-auto bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mb-6 relative">
          <Hammer className="h-10 w-10 text-primary animate-bounce" />
          <Loader2 className="absolute top-2 right-2 h-5 w-5 animate-spin text-muted-foreground" />
        </div>
        
        <h2 className="text-3xl font-bold tracking-tight mb-2">We're Building Your Store!</h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-lg mx-auto">
          Our engineering team is actively constructing your {currentPlan.toUpperCase()} e-commerce website.
        </p>
      </div>

      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle>Build Progress</CardTitle>
          <CardDescription>Estimated Live Time: 2-4 Business Days</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          
          <div className="space-y-2">
             <div className="flex justify-between items-end">
               <span className="text-sm font-medium">Assembling Foundation</span>
               <span className="text-xs font-mono text-muted-foreground">35%</span>
             </div>
             <Progress value={progress} className="h-2.5" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center text-muted-foreground opacity-50">
              <CheckCircle2 className="h-5 w-5 mr-3 text-green-500" />
              <span>1. Payment Verified & Scope Approved</span>
            </div>
            <div className="flex items-center text-foreground font-medium bg-secondary p-2 -mx-2 rounded-md">
              <Loader2 className="h-5 w-5 mr-3 text-primary animate-spin" />
              <span>2. Generating High-Performance Subdomain & ERP Connection</span>
            </div>
            <div className="flex items-center text-muted-foreground opacity-50">
              <Sparkles className="h-5 w-5 mr-3" />
              <span>3. Designing & Uploading Tailwind Theme Components</span>
            </div>
            <div className="flex items-center text-muted-foreground opacity-50">
              <CheckCircle2 className="h-5 w-5 mr-3" />
              <span>4. Final QA, Mobile Testing & Data Sync</span>
            </div>
          </div>
          
          <div className="text-sm text-center text-muted-foreground bg-muted/50 p-4 rounded border">
            We will automatically email you the URL and unlock the Storefront Dashboard when everything is 100% complete!
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
