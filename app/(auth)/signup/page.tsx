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
import { Box, Building2, CheckCircle, Loader2 } from "lucide-react"

// ── Schemas ──────────────────────────────────────────────────────────────────
const accountSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    email: z.string().min(1, "Email is required").email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
})
type AccountValues = z.infer<typeof accountSchema>

const businessSchema = z.object({
    companyName: z.string().min(2, "Business name is required"),
    phone: z.string().optional(),
    country: z.string().min(1, "Country is required"),
})
type BusinessValues = z.infer<typeof businessSchema>

// ── Page ─────────────────────────────────────────────────────────────────────
export default function SignupPage() {
    const [step, setStep] = useState<1 | 2 | 3>(1)
    const [isLoading, setIsLoading] = useState(false)
    const [accountData, setAccountData] = useState<AccountValues | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    const accountForm = useForm<AccountValues>({
        resolver: zodResolver(accountSchema),
        defaultValues: { firstName: "", lastName: "", email: "", password: "" },
    })

    const businessForm = useForm<BusinessValues>({
        resolver: zodResolver(businessSchema),
        defaultValues: { companyName: "", phone: "", country: "Nepal" },
    })

    // Step 1 — create Supabase account
    async function onAccountSubmit(values: AccountValues) {
        setIsLoading(true)
        const supabase = createSupabaseBrowserClient()

        const { data, error } = await supabase.auth.signUp({
            email: values.email,
            password: values.password,
            options: {
                data: {
                    first_name: values.firstName,
                    last_name: values.lastName || "",
                    role: "admin",
                },
            },
        })

        if (error) {
            accountForm.setError("root", { message: error.message })
            setIsLoading(false)
            return
        }

        setAccountData(values)
        setUserId(data.user?.id ?? null)
        setIsLoading(false)
        setStep(2)
    }

    // Step 2 — submit company/business info
    async function onBusinessSubmit(values: BusinessValues) {
        if (!accountData) return
        setIsLoading(true)

        const res = await fetch("/api/tenants/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                companyName: values.companyName,
                ownerEmail: accountData.email,
                ownerFirstName: accountData.firstName,
                ownerLastName: accountData.lastName || "",
                ownerPhone: values.phone || null,
                country: values.country,
                userId,
            }),
        })

        const result = await res.json()
        if (!result.success) {
            businessForm.setError("root", { message: result.error || "Failed to submit request." })
            setIsLoading(false)
            return
        }

        setIsLoading(false)
        setStep(3)
    }

    // ── Success screen ────────────────────────────────────────────────────────
    if (step === 3) {
        return (
            <div className="flex flex-col gap-6">
                <Card className="border-0 shadow-lg rounded-2xl">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-2">
                            <CheckCircle className="h-12 w-12 text-green-500" />
                        </div>
                        <CardTitle>Application Submitted!</CardTitle>
                        <CardDescription>
                            Your business registration is under review.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-6">
                            Our team will review your application and activate your account
                            shortly. You&apos;ll receive an email once your business is ready.
                        </p>
                        <Button asChild className="w-full h-11">
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ── Header ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <Box className="h-6 w-6" />
                </div>
                <h1 className="text-2xl font-bold font-heading">Valanthir POS</h1>
                <p className="text-balance text-sm text-muted-foreground">
                    {step === 1 ? "Create your account" : "Tell us about your business"}
                </p>
            </div>

            {/* ── Step 1: Account details ──────────────────────────────────── */}
            {step === 1 && (
                <Card className="border-0 shadow-lg rounded-2xl">
                    <CardHeader>
                        <CardTitle>Create Account</CardTitle>
                        <CardDescription>Step 1 of 2 — Your personal details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...accountForm}>
                            <form
                                onSubmit={accountForm.handleSubmit(onAccountSubmit)}
                                className="grid gap-4"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={accountForm.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>First Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="John" disabled={isLoading} className="h-11" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={accountForm.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Last Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Doe" disabled={isLoading} className="h-11" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={accountForm.control}
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
                                    control={accountForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
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
                                {accountForm.formState.errors.root && (
                                    <p className="text-sm font-medium text-destructive">
                                        {accountForm.formState.errors.root.message}
                                    </p>
                                )}
                                <Button type="submit" className="w-full h-11 mt-2" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Continue
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                                Sign In
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            )}

            {/* ── Step 2: Business details ─────────────────────────────────── */}
            {step === 2 && (
                <Card className="border-0 shadow-lg rounded-2xl">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <CardTitle>Business Details</CardTitle>
                        </div>
                        <CardDescription>Step 2 of 2 — Tell us about your business</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...businessForm}>
                            <form
                                onSubmit={businessForm.handleSubmit(onBusinessSubmit)}
                                className="grid gap-4"
                            >
                                <FormField
                                    control={businessForm.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Business Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Acme Store"
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
                                    control={businessForm.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="+977 98XXXXXXXX"
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
                                    control={businessForm.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Nepal"
                                                    disabled={isLoading}
                                                    className="h-11"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {businessForm.formState.errors.root && (
                                    <p className="text-sm font-medium text-destructive">
                                        {businessForm.formState.errors.root.message}
                                    </p>
                                )}
                                <div className="flex gap-3 mt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 h-11"
                                        disabled={isLoading}
                                        onClick={() => setStep(1)}
                                    >
                                        Back
                                    </Button>
                                    <Button type="submit" className="flex-1 h-11" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Submit Application
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
