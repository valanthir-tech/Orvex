import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUpRight, LucideIcon } from "lucide-react"
import Link from "next/link"

interface PageHeaderProps {
    title: string
    description?: string
    children?: React.ReactNode
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {title}
                </h1>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </div>
            {children && <div className="flex items-center gap-2">{children}</div>}
        </div>
    )
}

interface SectionCardProps {
    title: string
    description?: string
    action?: {
        label: string
        href: string
    }
    children: React.ReactNode
    className?: string
}

export function SectionCard({
    title,
    description,
    action,
    children,
    className,
}: SectionCardProps) {
    return (
        <Card className={cn("overflow-hidden rounded-2xl", className)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/30">
                <div className="space-y-0.5">
                    <CardTitle className="text-base font-semibold">{title}</CardTitle>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
                {action && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-xs text-muted-foreground hover:text-primary"
                        asChild
                    >
                        <Link href={action.href}>
                            {action.label}
                            <ArrowUpRight className="h-3 w-3" />
                        </Link>
                    </Button>
                )}
            </CardHeader>
            <CardContent className="pt-4">{children}</CardContent>
        </Card>
    )
}

interface QuickAction {
    label: string
    icon: LucideIcon
    href: string
    variant?: "default" | "outline" | "secondary" | "ghost"
}

interface QuickActionsProps {
    actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
    return (
        <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
                <Button
                    key={action.label}
                    variant={action.variant || "outline"}
                    size="sm"
                    className={cn(
                        "gap-2 rounded-xl transition-all duration-200",
                        action.variant === "default" && "shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    )}
                    asChild
                >
                    <Link href={action.href}>
                        <action.icon className="h-4 w-4" />
                        {action.label}
                    </Link>
                </Button>
            ))}
        </div>
    )
}

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: {
        label: string
        href: string
    }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
            {action && (
                <Button className="mt-4 rounded-xl" asChild>
                    <Link href={action.href}>{action.label}</Link>
                </Button>
            )}
        </div>
    )
}
