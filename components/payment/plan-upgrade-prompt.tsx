"use client"

import { Rocket, Lock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function PlanUpgradePrompt({ 
    featureName, 
    minPlan = "Growth" 
}: { 
    featureName: string;
    minPlan?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-card rounded-2xl border border-dashed border-border/50 max-w-2xl mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight mb-2">
                Unlock {featureName}
            </h2>
            
            <p className="text-muted-foreground mb-8 max-w-md">
                This feature is not available on your current plan. Upgrade to the <strong>{minPlan} Plan</strong> or higher to access {featureName.toLowerCase()} and supercharge your business.
            </p>
            
            <Link href="/settings/subscription">
                <Button size="lg" className="rounded-xl px-8 h-12">
                    <Rocket className="w-4 h-4 mr-2" />
                    View Upgrade Options
                </Button>
            </Link>
        </div>
    )
}
