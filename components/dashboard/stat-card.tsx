import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
    title: string
    value: string | number
    description?: string
    icon: LucideIcon
    trend?: {
        value: string
        isPositive: boolean
        label?: string
    }
    variant?: "default" | "destructive" | "success" | "warning"
    className?: string
}

const variantStyles = {
    default: {
        iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
        iconColor: "text-white",
        gradient: "from-blue-500/10 via-blue-500/5",
        ring: "ring-blue-500/20",
        glow: "shadow-blue-500/20",
    },
    destructive: {
        iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
        iconColor: "text-white",
        gradient: "from-red-500/10 via-red-500/5",
        ring: "ring-red-500/20",
        glow: "shadow-red-500/20",
    },
    success: {
        iconBg: "bg-gradient-to-br from-teal-500 to-teal-600",
        iconColor: "text-white",
        gradient: "from-teal-500/10 via-teal-500/5",
        ring: "ring-teal-500/20",
        glow: "shadow-teal-500/20",
    },
    warning: {
        iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
        iconColor: "text-white",
        gradient: "from-amber-500/10 via-amber-500/5",
        ring: "ring-amber-500/20",
        glow: "shadow-amber-500/20",
    },
}

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = "default",
    className,
}: StatCardProps) {
    const styles = variantStyles[variant]

    return (
        <div
            className={cn(
                "group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300",
                "hover:shadow-lg hover:-translate-y-0.5",
                styles.glow,
                className
            )}
        >
            {/* Background gradient on hover */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100",
                    styles.gradient
                )}
            />

            {/* Decorative corner accent */}
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-muted/50 to-transparent opacity-50" />

            {/* Content */}
            <div className="relative">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p
                            className={cn(
                                "text-3xl font-bold tracking-tight",
                                variant === "destructive" && "text-destructive"
                            )}
                        >
                            {value}
                        </p>
                    </div>

                    {/* Icon with gradient background */}
                    <div
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110",
                            styles.iconBg
                        )}
                    >
                        <Icon className={cn("h-6 w-6", styles.iconColor)} />
                    </div>
                </div>

                {/* Trend or Description */}
                <div className="mt-4">
                    {trend && (
                        <div className="flex items-center gap-2">
                            <span
                                className={cn(
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                    trend.isPositive
                                        ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                                )}
                            >
                                {trend.isPositive ? "↑" : "↓"} {trend.value}
                            </span>
                            {trend.label && (
                                <span className="text-xs text-muted-foreground">{trend.label}</span>
                            )}
                        </div>
                    )}

                    {description && !trend && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
            </div>
        </div>
    )
}
