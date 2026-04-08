"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { Box, Loader2 } from "lucide-react"

const resetPasswordSchema = z.object({
    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),
    confirmPassword: z
        .string()
        .min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(values: ResetPasswordFormValues) {
        setIsLoading(true)
        const supabase = createSupabaseBrowserClient()

        const { error } = await supabase.auth.updateUser({
            password: values.password,
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
                    <h1 className="text-2xl font-bold font-heading">Orvex POS</h1>
                </div>
                <Card className="border-0 shadow-lg rounded-2xl">
                    <CardHeader className="text-center">
                        <CardTitle>Password Updated</CardTitle>
                        <CardDescription>
                            Your password has been successfully reset.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button
                            className="w-full h-11"
                            onClick={() => {
                                router.push("/")
                                router.refresh()
                            }}
                        >
                            Continue to Dashboard
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
                <h1 className="text-2xl font-bold font-heading">Orvex POS</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    Set your new password
                </p>
            </div>
            <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>
                        Enter your new password below
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                autoComplete="new-password"
                                                disabled={isLoading}
                                                className="h-11"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                autoComplete="new-password"
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
                                Update Password
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <p className="text-center text-sm text-muted-foreground">
                <Link
                    href="/login"
                    className="underline underline-offset-4 hover:text-primary"
                >
                    Back to Login
                </Link>
            </p>
        </div>
    )
}
