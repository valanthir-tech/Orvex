"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Box, Loader2 } from "lucide-react"

export default function LoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        const formData = new FormData(event.currentTarget)
        const email = formData.get("email") as string
        const password = formData.get("password") as string

        // For now, we bypass real ERPNext authentication in the UI
        // In a real implementation, we would call an API route to proxy the login
        // to ERPNext and set a session cookie.

        // Mock authentication for development
        if (email && password) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Check against demo credentials (admin/admin) or allow any for dev
            if (password.length > 0) {
                // Set a mock cookie or local storage if needed
                document.cookie = "erpnext_session=mock-session; path=/";
                router.push("/")
                router.refresh()
            } else {
                setError("Invalid credentials")
                setIsLoading(false)
            }
        } else {
            setError("Please fill in all fields")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Box className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold font-heading">Valanthir POS</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Login to your ERPNext integrated POS
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                        Use your ERPNext credentials
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email / Username</Label>
                            <Input
                                id="email"
                                name="email"
                                type="text"
                                placeholder="Administrator"
                                defaultValue="Administrator"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                defaultValue="admin"
                            />
                        </div>
                        {error && (
                            <div className="text-sm text-destructive font-medium">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Login
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center flex-col gap-2">
                    <p className="text-xs text-muted-foreground text-center">
                        Default credentials: Administrator / admin
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" className="underline underline-offset-4 hover:text-primary">
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
