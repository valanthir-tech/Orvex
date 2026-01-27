import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function POSLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-muted/20 flex flex-col">
            {/* Minimal Header */}
            <header className="h-14 border-b bg-background px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="font-semibold text-lg">Point of Sale</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Online</span>
                </div>
            </header>

            {/* Fullscreen Content */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    )
}
