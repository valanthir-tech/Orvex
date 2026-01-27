import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface ActivityItem {
    id: string | number
    type: "sale" | "stock" | "alert" | "info"
    title: string
    description?: string
    amount?: string
    time: string
    icon: LucideIcon
}

interface ActivityListProps {
    items: ActivityItem[]
    className?: string
}

const typeStyles = {
    sale: {
        iconBg: "bg-gradient-to-br from-teal-500 to-teal-600",
        iconColor: "text-white",
        amountColor: "text-teal-600 dark:text-teal-400",
        dotColor: "bg-teal-500",
    },
    stock: {
        iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
        iconColor: "text-white",
        amountColor: "text-blue-600 dark:text-blue-400",
        dotColor: "bg-blue-500",
    },
    alert: {
        iconBg: "bg-gradient-to-br from-red-500 to-rose-600",
        iconColor: "text-white",
        amountColor: "text-red-600 dark:text-red-400",
        dotColor: "bg-red-500",
    },
    info: {
        iconBg: "bg-gradient-to-br from-gray-400 to-gray-500",
        iconColor: "text-white",
        amountColor: "text-muted-foreground",
        dotColor: "bg-gray-400",
    },
}

export function ActivityList({ items, className }: ActivityListProps) {
    return (
        <div className={cn("relative", className)}>
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-border via-border to-transparent" />

            <div className="space-y-1">
                {items.map((item, index) => {
                    const styles = typeStyles[item.type]
                    const Icon = item.icon

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "group relative flex items-center gap-4 rounded-xl p-3 transition-all duration-200",
                                "hover:bg-muted/50"
                            )}
                            style={{
                                animationDelay: `${index * 50}ms`,
                            }}
                        >
                            {/* Icon */}
                            <div
                                className={cn(
                                    "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md transition-transform duration-200 group-hover:scale-110",
                                    styles.iconBg
                                )}
                            >
                                <Icon className={cn("h-5 w-5", styles.iconColor)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-medium">{item.title}</p>
                                    {item.amount && (
                                        <span className={cn("shrink-0 text-sm font-semibold", styles.amountColor)}>
                                            {item.amount}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{item.time}</p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
