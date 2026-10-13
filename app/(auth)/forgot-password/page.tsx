"use client"

import { useState } from "react"
import Link from "next/link"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Box, Loader2, ArrowLeft } from "lucide-react"

const forgotPasswordSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email"),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(values: ForgotPasswordFormValues) {
        setIsLoading(true)
        const supabase = createSupabaseBrowserClient()

        const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        })

        if (error) {
            form.setError("root", { message: error.message })
            setIsLoading(false)
            return
        }

        setIsSuccess(true)
        setIsLoading(false)
    }

    if (isSuccess) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <Box className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold font-heading">Onedexo POS</h1>
                </div>
                <Card className="border-0 shadow-lg rounded-2xl">
                    <CardHeader className="text-center">
                        <CardTitle>Check Your Email</CardTitle>
                        <CardDescription>
                            We&apos;ve sent a password reset link to your email address.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-6">
                            Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
                        </p>
                        <Button asChild variant="outline" className="w-full h-11">
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Login
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Box className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold font-heading">Onedexo POS</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Reset your password
                </p>
            </div>
            <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader>
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a reset link
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="grid gap-4"
                        >
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="name@example.com"
                                                type="email"
                                                autoComplete="email"
                                                disabled={isLoading}
                                                className="h-11"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {form.formState.errors.root && (
                                <p className="text-sm font-medium text-destructive mt-1">
                                    {form.formState.errors.root.message}
                                </p>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-11 mt-2"
                                disabled={isLoading}
                            >
                                {isLoading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Send Reset Link
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Remember your password?{" "}
                        <Link
                            href="/login"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
