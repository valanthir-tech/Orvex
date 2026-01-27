import { cn } from "@/lib/utils"

interface RankingItem {
    id: string | number
    name: string
    subtitle?: string
    value: string
}

interface RankingListProps {
    items: RankingItem[]
    className?: string
}

const rankColors = [
    "bg-gradient-to-br from-amber-400 to-yellow-500 text-white shadow-amber-500/30", // 1st - Gold
    "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800 shadow-gray-400/30", // 2nd - Silver
    "bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-orange-500/30", // 3rd - Bronze
    "bg-muted text-muted-foreground", // 4th+
    "bg-muted text-muted-foreground", // 5th
]

export function RankingList({ items, className }: RankingListProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className={cn(
                        "group flex items-center gap-4 rounded-xl p-3 transition-all duration-200",
                        "hover:bg-muted/50"
                    )}
                >
                    {/* Rank badge */}
                    <div
                        className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-md transition-transform duration-200 group-hover:scale-110",
                            rankColors[index] || rankColors[3]
                        )}
                    >
                        {index + 1}
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{item.name}</p>
                        {item.subtitle && (
                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                        )}
                    </div>

                    {/* Value */}
                    <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}
