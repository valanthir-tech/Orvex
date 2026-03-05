import Link from "next/link"
import { ShieldAlert, Server, Activity, Users, Store, Check, X } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { ApproveButton } from "./approve-button"
import { createSupabaseServerClient } from "@/lib/tenant"

export async function SuperadminDashboard() {
    const supabase = await createSupabaseServerClient()

    // 1. Fetch active/provisioned tenants
    const { data: tenants, error: tenantsError } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false })

    // 2. Fetch pending signups from the new queue table
    const { data: signups, error: signupsError } = await supabase
        .from("tenant_signups")
        .select("*")
        .in("status", ["pending_approval", "failed"])
        .order("created_at", { ascending: false })

    const totalTenants = tenants?.length || 0
    const activeTenants = tenants?.filter(t => t.status === "active").length || 0
    const suspendedTenants = tenants?.filter(t => t.status === "suspended").length || 0
    const pendingCount = signups?.filter(s => s.status === 'pending_approval').length || 0

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold font-heading">Superadmin Control Panel</h2>
                    <p className="text-muted-foreground text-sm">System-wide tenant management and operations</p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalTenants}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <Users className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{pendingCount}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Active Tenants</CardTitle>
                        <Activity className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{activeTenants}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-rose-500">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-rose-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{suspendedTenants}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Signups Table */}
            <Card className="border-orange-500/50 shadow-orange-500/5">
                <CardHeader>
                    <CardTitle className="text-orange-500 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Pending Approvals
                    </CardTitle>
                    <CardDescription>Review and approve new tenant requests to trigger ERPNext provisioning.</CardDescription>
                </CardHeader>
                <CardContent>
                    {signupsError ? (
                        <div className="p-4 text-rose-500 bg-rose-500/10 rounded-md">
                            Failed to load signups: {signupsError.message}
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Requested Business Name</TableHead>
                                        <TableHead>Owner Contact</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Requested Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {signups?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                                No pending signup requests.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {signups?.map((signup) => (
                                        <TableRow key={signup.id} className={signup.status === 'failed' ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''}>
                                            <TableCell className="font-medium">
                                                {signup.company_name}
                                                <div className="text-xs font-mono text-muted-foreground">Code: {signup.company_abbr}</div>
                                            </TableCell>
                                            <TableCell>
                                                {signup.owner_first_name} {signup.owner_last_name}
                                                <div className="text-xs text-muted-foreground">{signup.owner_email}</div>
                                                <div className="text-xs text-muted-foreground">{signup.owner_phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                {signup.country}
                                            </TableCell>
                                            <TableCell>
                                                {signup.status === 'pending_approval' && <Badge variant="outline" className="text-orange-500 border-orange-500/50 bg-orange-500/10">Awaiting Review</Badge>}
                                                {signup.status === 'failed' && <Badge variant="destructive">Provisioning Failed</Badge>}
                                                {signup.error_message && <div className="text-xs text-rose-500 mt-1 max-w-[200px] truncate" title={signup.error_message}>{signup.error_message}</div>}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(signup.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ApproveButton signupId={signup.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Active Tenants Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Tenant Registry</CardTitle>
                    <CardDescription>All provisioned ERPNext environments and POS tenants.</CardDescription>
                </CardHeader>
                <CardContent>
                    {tenantsError ? (
                        <div className="p-4 text-rose-500 bg-rose-500/10 rounded-md">
                            Failed to load tenants: {tenantsError.message}
                        </div>
                    ) : (
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Company Code</TableHead>
                                        <TableHead>Business Name</TableHead>
                                        <TableHead>Owner / Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tenants?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                                No tenants provisioned yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {tenants?.map((tenant) => (
                                        <TableRow key={tenant.id}>
                                            <TableCell className="font-mono text-xs uppercase text-muted-foreground">
                                                {tenant.company_abbr}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {tenant.company_name}
                                                <div className="text-xs text-muted-foreground">{tenant.erpnext_url}</div>
                                            </TableCell>
                                            <TableCell>
                                                {tenant.owner_first_name} {tenant.owner_last_name}
                                                <div className="text-xs text-muted-foreground">{tenant.owner_email}</div>
                                            </TableCell>
                                            <TableCell>
                                                {tenant.status === 'active' && <Badge variant="default" className="bg-emerald-500">Active</Badge>}
                                                {tenant.status === 'suspended' && <Badge variant="destructive">Suspended</Badge>}
                                                {tenant.status === 'provisioning' && <Badge variant="secondary">Provisioning...</Badge>}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(tenant.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {tenant.status === 'active' && (
                                                    <Button variant="outline" size="sm">
                                                        Impersonate
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
