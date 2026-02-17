import Link from "next/link"
import { ArrowLeft, Wifi, Clock, Store, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function POSLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-muted/30 flex flex-col">
            {/* Premium Header */}
            <header className="h-14 border-b bg-background/95 backdrop-blur-sm px-4 flex items-center justify-between shrink-0 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 hover:bg-muted" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Store className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <h1 className="font-bold text-sm leading-none">Point of Sale</h1>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {new Date().toLocaleDateString('en-NP', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Keyboard shortcuts hint */}
                    <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                        <Keyboard className="h-3 w-3" />
                        <span>Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">/</kbd> to search</span>
                    </div>
                    {/* Status */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <Wifi className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Online</span>
                    </div>
                </div>
            </header>

            {/* Fullscreen Content */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    )
}
