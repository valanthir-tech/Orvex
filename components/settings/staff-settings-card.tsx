"use client"

import { useState, useEffect } from "react"
import { Users, UserPlus, Shield, Loader2, Info } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { listStaff, inviteStaff, updateStaffRole, type StaffMember } from "@/app/actions/staff"
import { getTenantSubscription, type TenantSubscription } from "@/app/actions/subscriptions"

export function StaffSettingsCard() {
    const router = useRouter()
    const [staffList, setStaffList] = useState<StaffMember[]>([])
    const [subscription, setSubscription] = useState<TenantSubscription | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Form state
    const [isInviting, setIsInviting] = useState(false)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteFirstName, setInviteFirstName] = useState("")
    const [inviteLastName, setInviteLastName] = useState("")
    const [inviteRole, setInviteRole] = useState<"manager" | "cashier">("cashier")

    // Limits
    const maxStaff = subscription?.plan?.max_staff ?? 2 // Default to starter limit
    const currentStaffCount = staffList.length
    const hasReachedLimit = maxStaff >= 0 && currentStaffCount >= maxStaff

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setIsLoading(true)
        try {
            const [staffRes, subRes] = await Promise.all([
                listStaff(),
                getTenantSubscription()
            ])

            if (staffRes.success && staffRes.staff) {
                setStaffList(staffRes.staff)
            } else if (staffRes.error) {
                toast.error(staffRes.error)
            }

            setSubscription(subRes)
        } catch (error) {
            toast.error("Failed to load staff settings")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleInviteSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (hasReachedLimit) return

        setIsInviting(true)
        try {
            const result = await inviteStaff({
                email: inviteEmail,
                firstName: inviteFirstName,
                lastName: inviteLastName,
                role: inviteRole,
            })

            if (result.success) {
                toast.success("Staff member invited successfully!")
                // Reset form
                setInviteEmail("")
                setInviteFirstName("")
                setInviteLastName("")
                setInviteRole("cashier")
                setIsInviteModalOpen(false)
                // Reload list
                await loadData()
            } else {
                toast.error(result.error || "Failed to invite staff")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsInviting(false)
        }
    }

    return (
        <Card className="card-float border-0 rounded-2xl md:col-span-2">
            <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Team & Staff
                        </CardTitle>
                        <CardDescription>Manage user access and roles for your store.</CardDescription>
                    </div>
                    
                    <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                        <DialogTrigger asChild>
                            <Button 
                                disabled={hasReachedLimit || isLoading}
                                className="w-full md:w-auto"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Invite Staff
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite new staff</DialogTitle>
                                <DialogDescription>
                                    They will receive an email with a magic link to sign in.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInviteSubmit} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Email *</Label>
                                    <Input 
                                        type="email" 
                                        required 
                                        placeholder="cashier@example.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>First Name *</Label>
                                        <Input 
                                            required 
                                            placeholder="John"
                                            value={inviteFirstName}
                                            onChange={(e) => setInviteFirstName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Last Name</Label>
                                        <Input 
                                            placeholder="Doe"
                                            value={inviteLastName}
                                            onChange={(e) => setInviteLastName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Role *</Label>
                                    <Select 
                                        value={inviteRole} 
                                        onValueChange={(val: "manager" | "cashier") => setInviteRole(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="manager">Manager (Can manage products & settings)</SelectItem>
                                            <SelectItem value="cashier">Cashier (Only POS & Sales)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <Button type="submit" className="w-full" disabled={isInviting}>
                                    {isInviting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Send Invitation
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
                
                {/* Limits Warning Banner */}
                {maxStaff >= 0 && (
                    <div className={`flex items-start gap-3 p-3 rounded-xl border ${hasReachedLimit ? 'border-destructive/30 bg-destructive/5' : 'bg-muted/30'}`}>
                        <Info className={`w-5 h-5 shrink-0 ${hasReachedLimit ? 'text-destructive' : 'text-muted-foreground'}`} />
                        <div className="flex-1 text-sm">
                            <p className="font-medium">
                                Plan Limits: {currentStaffCount} of {maxStaff} staff members used
                            </p>
                            {hasReachedLimit ? (
                                <p className="text-muted-foreground mt-1">
                                    You have reached the maximum number of staff profiles allowed on your current <strong>{subscription?.plan?.name || 'Starter'}</strong> plan. 
                                    <Link href="/settings/subscription" className="text-primary hover:underline ml-1 font-medium">Upgrade to invite more.</Link>
                                </p>
                            ) : (
                                <p className="text-muted-foreground mt-1">
                                    You can invite {maxStaff - currentStaffCount} more staff member{(maxStaff - currentStaffCount) === 1 ? '' : 's'} on your current plan.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Staff List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : staffList.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground py-8">
                            No team members yet.
                        </p>
                    ) : (
                        <div className="grid gap-3">
                            {staffList.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0">
                                            {member.first_name?.[0]?.toUpperCase() || member.email?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {member.first_name} {member.last_name}
                                                {member.role === 'admin' || member.role === 'superadmin' ? ' (You)' : ''}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant={member.role === 'manager' || member.role === 'admin' || member.role === 'superadmin' ? 'default' : 'secondary'}>
                                        {member.role === 'superadmin' ? 'Admin' : member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
