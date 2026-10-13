"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { db } from "@/lib/db"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Box, Loader2, Sparkles, ArrowRight } from "lucide-react"
import Image from "next/image"

const loginSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email"),
    password: z
        .string()
        .min(6, "Password must be at least 6 characters"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        async function checkTerminal() {
            try {
                const token = await db.configStore.get("device_token")
                if (token) {
                    router.replace("/pos")
                }
            } catch (err) {
                console.error("Dexie offline config error", err)
            }
        }
        checkTerminal()
    }, [router])

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    function handleDemoLogin() {
        setIsLoading(true)
        document.cookie = "onedexo_demo_session=true; path=/; max-age=604800; SameSite=Lax"
        window.location.href = "/dashboard"
    }

    function handleFillDemoCredentials() {
        form.setValue("email", "demo@onedexo.com")
        form.setValue("password", "demo1234")
    }

    async function onSubmit(values: LoginFormValues) {
        setIsLoading(true)

        // Handle demo credentials directly
        if (
            values.email.trim().toLowerCase() === "demo@onedexo.com" &&
            values.password === "demo1234"
        ) {
            document.cookie = "onedexo_demo_session=true; path=/; max-age=604800; SameSite=Lax"
            window.location.href = "/dashboard"
            return
        }

        const supabase = createSupabaseBrowserClient()

        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        })

        if (error) {
            form.setError("root", { message: error.message })
            setIsLoading(false)
            return
        }

        // Skip client-side role check and let middleware handle it for faster redirect
        window.location.href = "/"
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-20 items-center justify-center mb-2">
                    <Image src="/onedexo-horizontal.png" alt="Onedexo" width={280} height={80} className="h-12 w-auto object-contain" priority />
                </div>
                <p className="text-balance text-sm text-muted-foreground mt-1">
                    Login to your Inventory & POS system
                </p>
            </div>

            {/* Test Demo Credentials Showcase Box */}
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-sm text-left">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Demo Test Access
                        </span>
                    </div>
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleDemoLogin}
                        disabled={isLoading}
                        className="h-8 px-3 text-xs font-medium shadow-sm hover:shadow"
                    >
                        {isLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                        Quick Demo Sign In
                    </Button>
                </div>

                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Test the complete dashboard, POS, and inventory features instantly:
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs bg-background/80 rounded-xl p-3 border border-border/50 font-mono">
                    <div>
                        <span className="text-muted-foreground block text-[10px] font-sans font-medium uppercase tracking-wider mb-0.5">Email</span>
                        <span className="font-semibold text-foreground select-all text-xs sm:text-sm">demo@onedexo.com</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground block text-[10px] font-sans font-medium uppercase tracking-wider mb-0.5">Password</span>
                        <span className="font-semibold text-foreground select-all text-xs sm:text-sm">demo1234</span>
                    </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="text-[11px]">Role: <strong className="text-foreground">Store Admin</strong></span>
                    <button
                        type="button"
                        onClick={handleFillDemoCredentials}
                        className="text-primary hover:underline font-medium text-xs cursor-pointer flex items-center gap-1"
                    >
                        Fill into form <ArrowRight className="h-3 w-3" />
                    </button>
                </div>
            </div>

            <Card className="border-0 shadow-lg rounded-2xl">
                <CardHeader>
                    <CardTitle>Welcome back</CardTitle>
                    <CardDescription>
                        Enter your credentials to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="grid gap-4"
                        >
                            {searchParams.get("reason") === "superadmin" && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    Superadmin accounts cannot access the POS app. Please use the <strong>Admin Portal</strong>.
                                </div>
                            )}
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
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Password</FormLabel>
                                            <Link
                                                href="/forgot-password"
                                                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-primary"
                                            >
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                autoComplete="current-password"
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
                                Sign In
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>

            <p className="text-[10px] text-muted-foreground/60 text-center max-w-sm mx-auto leading-relaxed">
                Onedexo is a modern inventory management and order recording system.
                Order slips generated are for internal record-keeping only and do not
                constitute tax invoices. By signing in you agree to our{" "}
                <Link href="/legal/terms" className="underline hover:text-muted-foreground">
                    Terms
                </Link>{" "}
                and{" "}
                <Link href="/legal/privacy" className="underline hover:text-muted-foreground">
                    Privacy Policy
                </Link>.
            </p>
        </div >
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="flex w-full h-full items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <LoginForm />
        </Suspense>
    )
}
