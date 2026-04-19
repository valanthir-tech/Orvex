"use client"

import { useState, useEffect } from "react"
import { TabletSmartphone, UserPlus, Shield, Loader2, Info, MonitorCheck, PlaySquare, KeyRound, MonitorX, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

import { listTerminals, registerTerminal, revokeTerminal, type PosDevice } from "@/app/actions/terminals"

export function TerminalRegistrationCard() {
    const router = useRouter()
    const [terminalsList, setTerminalsList] = useState<PosDevice[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Form state
    const [isRegistering, setIsRegistering] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [deviceName, setDeviceName] = useState("")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setIsLoading(true)
        try {
            const res = await listTerminals()

            if (res.success && res.devices) {
                setTerminalsList(res.devices)
            } else if (res.error) {
                toast.error(res.error)
            }
        } catch (error) {
            toast.error("Failed to load POS terminals")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!deviceName.trim()) return

        setIsRegistering(true)
        try {
            const userAgent = navigator.userAgent
            const result = await registerTerminal(deviceName, userAgent)

            if (result.success && result.token) {
                // IMPORTANT: Save securely to local offline IndexedDB (Dexie)
                await db.configStore.put({ key: 'device_token', value: result.token })
                
                // Bulk insert staff profiles for offline PIN login 
                if (result.staffProfiles && result.staffProfiles.length > 0) {
                    const profilesToStore = result.staffProfiles.map((p: any) => ({
                        id: p.id,
                        tenant_id: p.tenant_id,
                        email: p.email,
                        first_name: p.first_name,
                        last_name: p.last_name,
                        full_name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown',
                        role: p.role,
                        pin_code: p.pin_code,
                        permissions: p.permissions || null
                    }))
                    await db.staffProfiles.clear()
                    await db.staffProfiles.bulkPut(profilesToStore)
                }

                toast.success("This POS Terminal successfully registered and sync'd!")
                
                setDeviceName("")
                setIsModalOpen(false)
                await loadData()
            } else {
                toast.error(result.error || "Failed to register terminal")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsRegistering(false)
        }
    }

    const handleRevoke = async (id: string) => {
        if (!confirm("Are you sure you want to deactivate this terminal? Offline checkouts queued on it will not sync until reactivated.")) return

        try {
            const res = await revokeTerminal(id)
            if (res.success) {
                toast.success("Terminal Access revoked")
                // If it happens to be the same device, maybe clear local token too, but only if IDs matched
                // Ignoring logic to verify if currently on that device, assume they manage remotely mostly
                await loadData()
            } else {
                toast.error(res.error || "Failed to revoke terminal")
            }
        } catch (e) {
            toast.error("Failed to revoke terminal")
        }
    }

    return (
        <Card className="card-float border-0 rounded-2xl flex flex-col h-full overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TabletSmartphone className="w-5 h-5 text-primary" />
                            Hardware Terminals
                        </CardTitle>
                        <CardDescription className="mt-1.5">
                            Manage authorized offline-first POS devices
                        </CardDescription>
                    </div>
                    
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full md:w-auto">
                                <Plus className="w-4 h-4 mr-2" />
                                Register Current Device
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Register This Device</DialogTitle>
                                <DialogDescription>
                                    Approving this device will sync staff PINs locally so cashiers can operate it offline.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Terminal Name</Label>
                                    <Input 
                                        required 
                                        placeholder="e.g. Front Counter iPad"
                                        value={deviceName}
                                        onChange={(e) => setDeviceName(e.target.value)}
                                        autoComplete="off"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Registers the current browser/tablet permanently to this Store Tenant.
                                    </p>
                                </div>
                                <Button type="submit" className="w-full" disabled={isRegistering}>
                                    {isRegistering && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Sync & Authorize Device
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="pt-6 flex-1">

                {/* Terminals List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : terminalsList.length === 0 ? (
                        <div className="text-center py-8">
                            <MonitorX className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm font-medium text-foreground">No POS terminals registered.</p>
                            <p className="text-xs text-muted-foreground mt-1">Register front-counter devices here so cashiers can work offline.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {terminalsList.map((term) => (
                                <div key={term.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium shrink-0 ${term.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                            <MonitorCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {term.device_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground line-clamp-1 break-all max-w-[250px] opacity-70">
                                                {new Date(term.created_at).toLocaleDateString()} — {term.user_agent}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0">
                                        <Badge variant={term.is_active ? 'success' : 'secondary'} className={term.is_active ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-500/20" : ""}>
                                            {term.is_active ? 'Active' : 'Revoked'}
                                        </Badge>
                                        {term.is_active && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRevoke(term.id)}
                                                className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                Revoke
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
