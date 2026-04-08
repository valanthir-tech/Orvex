"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Clock, RefreshCcw } from "lucide-react"

export default function PendingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-md">
                <Card className="border-0 shadow-xl rounded-2xl text-center">
                    <CardHeader className="pb-2 pt-8">
                        <div className="flex justify-center mb-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 animate-pulse">
                                <Clock className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Payment Validating</CardTitle>
                        <CardDescription className="text-base mt-2 px-4">
                            We are verifying your manual payment. This usually takes a few minutes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8 pt-4">
                        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 mx-4">
                            Your dedicated ERP cloud instance is being prepared and will be instantly available upon approval.
                        </div>
                        <div className="flex flex-col gap-3 px-4">
                            {/* By forcing a hard reload, they hit the middleware again. If active, it routes them to /dashboard instantly! */}
                            <Button className="w-full h-12 text-md font-medium" onClick={() => window.location.reload()}>
                                <RefreshCcw className="mr-2 h-4 w-4" /> Check Status
                            </Button>
                            <Button asChild variant="outline" className="w-full h-12 text-md">
                                <Link href="/login">Return to Login</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
