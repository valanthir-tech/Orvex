"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db, Order, SyncLog, PosSession } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeft, Clock, RefreshCw, AlertCircle, CheckCircle2, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function safeDate(d: any) {
    if (!d) return new Date();
    return d instanceof Date ? d : new Date(d);
}

export default function HistoryInterface() {
    // Load local history from Dexie (Offline First)
    const orders = useLiveQuery(() => db.orders.orderBy("createdAt").reverse().limit(100).toArray(), [], [])
    const syncLogs = useLiveQuery(() => db.syncLogs.orderBy("timestamp").reverse().limit(100).toArray(), [], [])
    const sessions = useLiveQuery(() => db.sessions.reverse().limit(50).toArray(), [], [])

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold font-heading tracking-tight">App Activity History</h2>
                    <p className="text-muted-foreground text-sm mt-0.5">Review your offline sales, synchronization events, and cashier sessions.</p>
                </div>
            </div>

            <Tabs defaultValue="orders" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-md">
                    <TabsTrigger value="orders">Sales & Orders</TabsTrigger>
                    <TabsTrigger value="sync">Sync Logs</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                </TabsList>

                {/* ORDERS TAB */}
                <TabsContent value="orders" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5"/> Recent Sales</CardTitle>
                            <CardDescription>Up to the last 100 transactions recorded from this device.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Customer</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No sales recorded yet.</TableCell>
                                            </TableRow>
                                        ) : orders.map((order) => (
                                            <TableRow key={order.uuid}>
                                                <TableCell className="whitespace-nowrap flex items-center gap-2">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    {formatDistanceToNow(safeDate(order.createdAt), { addSuffix: true })}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs">{order.uuid.slice(0, 8)}</TableCell>
                                                <TableCell>{order.customerName}</TableCell>
                                                <TableCell>
                                                    {order.status === 'synced' && <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600"><CheckCircle2 className="h-3 w-3 mr-1"/> Synced</Badge>}
                                                    {order.status === 'completed' && <Badge variant="outline" className="border-warning text-warning"><RefreshCw className="h-3 w-3 mr-1 animate-spin"/> Pending</Badge>}
                                                    {order.status === 'sync_failed' && <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1"/> Failed Sync</Badge>}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">Rs. {order.grandTotal.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SYNC LOGS TAB */}
                <TabsContent value="sync" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5"/> Background Sync worker</CardTitle>
                            <CardDescription>Activity tracking showing how offline mode synced data back securely.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Order Target</TableHead>
                                            <TableHead>Action</TableHead>
                                            <TableHead>Message</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {syncLogs.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No background sync activities yet.</TableCell>
                                            </TableRow>
                                        ) : syncLogs.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="whitespace-nowrap text-xs">
                                                    {safeDate(log.timestamp).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">{log.orderUuid.startsWith('item-') || log.orderUuid.startsWith('cart-') ? '-' : log.orderUuid.slice(0, 8)}</TableCell>
                                                <TableCell>
                                                    {log.action === 'sync_success' && <Badge variant="outline" className="text-emerald-500 border-emerald-500">Success</Badge>}
                                                    {log.action === 'sync_attempt' && <Badge variant="secondary">Attempt</Badge>}
                                                    {log.action === 'sync_failed' && <Badge variant="destructive">Failure</Badge>}
                                                    {log.action === 'sale_canceled' && <Badge variant="outline" className="border-amber-500 text-amber-500">Sale Canceled</Badge>}
                                                    {log.action === 'item_removed' && <Badge variant="outline" className="text-muted-foreground">Item Removed</Badge>}
                                                </TableCell>
                                                <TableCell className="text-sm max-w-xs truncate text-muted-foreground">
                                                    {log.errorMessage || "Synced payload successfully"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SESSIONS TAB */}
                <TabsContent value="sessions" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/> Terminal Sessions</CardTitle>
                            <CardDescription>Clerk terminal locking and opening history for hardware tracking.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Cashier</TableHead>
                                            <TableHead>Opened At</TableHead>
                                            <TableHead>Closed At</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sessions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No sessions recorded natively.</TableCell>
                                            </TableRow>
                                        ) : sessions.map((session) => (
                                            <TableRow key={session.id}>
                                                <TableCell className="font-medium">{session.openedBy}</TableCell>
                                                <TableCell>{safeDate(session.openedAt).toLocaleString()}</TableCell>
                                                <TableCell>{session.closedAt ? safeDate(session.closedAt).toLocaleString() : "-"}</TableCell>
                                                <TableCell>
                                                    {session.status === 'OPEN' ? <Badge>Active</Badge> : <Badge variant="secondary">Closed</Badge>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
