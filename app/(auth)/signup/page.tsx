"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Box } from "lucide-react"

export default function SignupPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Box className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold font-heading">Valanthir POS</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Integrated with ERPNext
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Sign Up</CardTitle>
                    <CardDescription>
                        User management is handled in ERPNext
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            To create new users, please log in as an verifyAdministrator and create users directly in your ERPNext dashboard.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/login">
                                Back to Login
                            </Link>
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                            Login
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
