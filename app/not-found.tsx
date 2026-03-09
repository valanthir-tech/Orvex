import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion, Home } from "lucide-react"

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="max-w-md text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-4xl font-bold font-heading">404</h2>
                    <p className="text-lg text-muted-foreground">
                        Page not found
                    </p>
                    <p className="text-sm text-muted-foreground">
                        The page you are looking for doesn&apos;t exist or has been moved.
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link href="/">
                        <Home className="h-4 w-4" />
                        Back to Dashboard
                    </Link>
                </Button>
            </div>
        </div>
    )
}
