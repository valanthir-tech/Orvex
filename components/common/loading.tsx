import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg"
    className?: string
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
    return (
        <Loader2
            className={cn(
                "animate-spin text-muted-foreground",
                sizeClasses[size],
                className
            )}
        />
    )
}

interface LoadingPageProps {
    message?: string
}

export function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    )
}

interface LoadingCardProps {
    className?: string
}

export function LoadingCard({ className }: LoadingCardProps) {
    return (
        <div className={cn("animate-pulse rounded-xl border bg-card p-6", className)}>
            <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-9 w-9 rounded-lg bg-muted" />
            </div>
            <div className="mt-4 space-y-2">
                <div className="h-8 w-32 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted" />
            </div>
        </div>
    )
}
