import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock } from "lucide-react"

export const metadata = {
    title: "Pending Activation – Valanthir POS",
}

export default function PendingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="border-0 shadow-lg rounded-2xl text-center">
                    <CardHeader className="pb-2">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl">Account Pending Activation</CardTitle>
                        <CardDescription className="text-base mt-1">
                            Your business registration is under review.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                            Our team is reviewing your application. You&apos;ll receive an email
                            once your business account is ready. This typically takes less than
                            24 hours.
                        </p>
                        <Button asChild variant="outline" className="w-full h-11">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
