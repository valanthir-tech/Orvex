"use client"

import { useTransition } from "react"
import { completeSetup } from "@/app/actions/setup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Building, User } from "lucide-react"
import { toast } from "sonner"

export default function SetupPage() {
    const [isPending, startTransition] = useTransition()

    async function handleSubmit(formData: FormData) {
        startTransition(async () => {
            const result = await completeSetup(formData)
            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success("Welcome aboard!")
            }
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
            <div className="w-full max-w-md space-y-4">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold font-heading">Welcome to Inventory POS</h1>
                    <p className="text-muted-foreground">Let's set up your business profile.</p>
                </div>

                <form action={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Setup</CardTitle>
                            <CardDescription>
                                Create your workspace to manage inventory.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="fullName" className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Your Full Name
                                </Label>
                                <Input id="fullName" name="fullName" placeholder="John Doe" required />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="organizationName" className="flex items-center gap-2">
                                    <Building className="h-4 w-4" />
                                    Business Name
                                </Label>
                                <Input id="organizationName" name="organizationName" placeholder="My Awesome Store" required />
                            </div>

                            <Button type="submit" className="w-full" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Complete Setup
                            </Button>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </div>
    )
}
