import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Download, ArrowLeft, Clock, ShoppingCart, CreditCard, User, Receipt } from "lucide-react"

import { getInvoice } from "@/app/actions/pos"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DeleteTransactionButton } from "./delete-button"

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
    }).format(amount || 0).replace("₹", "Rs. ")
}

function formatDate(dateObj: Date) {
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "Invalid Date";
    return new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(dateObj)
}

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sale = await getInvoice(id)

    if (!sale) {
        notFound()
    }

    const shortId = sale.name.replace(/ACC-SINV-\d+-/, '#')

    return (
        <div className="flex flex-col gap-8 w-full py-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/dashboard">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-heading flex items-center gap-2">
                            Transaction {shortId}
                            <Badge variant={sale.status.toLowerCase() === 'paid' ? 'default' : 'secondary'} className="ml-2">
                                {sale.status}
                            </Badge>
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(sale.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {sale.status.toLowerCase() !== 'cancelled' && (
                        <DeleteTransactionButton id={id} />
                    )}
                    <Button variant="outline" size="sm" className="gap-2">
                        <Download className="w-4 h-4" /> Receipt
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content: Items */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="border-0 shadow-sm rounded-2xl">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-primary" />
                                Order Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {sale.items.map((item: any, i: number) => (
                                    <div key={i} className="flex px-6 py-4 items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{item.itemName}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {item.qty} × {formatCurrency(item.rate)}
                                            </p>
                                        </div>
                                        <p className="font-semibold font-heading">{formatCurrency(item.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payments */}
                    <Card className="border-0 shadow-sm rounded-2xl">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <CardTitle className="text-lg font-heading flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                Payment details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {sale.payments.map((p: any, i: number) => (
                                <div key={i} className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                            <Receipt className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium text-sm">{p.mode}</span>
                                    </div>
                                    <span className="font-semibold">{formatCurrency(p.amount)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Summary & Customer */}
                <div className="space-y-6">
                    <Card className="border-0 shadow-sm rounded-2xl">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <CardTitle className="text-lg font-heading">Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatCurrency(sale.grandTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Paid Amount</span>
                                <span>{formatCurrency(sale.paidAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Change Given</span>
                                <span>{formatCurrency(sale.changeAmount)}</span>
                            </div>
                            <div className="pt-4 border-t border-border border-dashed flex justify-between items-center">
                                <span className="font-medium">Total</span>
                                <span className="text-xl font-bold font-heading text-primary">{formatCurrency(sale.grandTotal)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm rounded-2xl border-t-4 border-t-primary">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <User className="w-4 h-4" /> Customer Ref
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-medium text-lg">{sale.customer}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}