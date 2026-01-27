"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, ShoppingCart, Trash2, Banknote, QrCode, Plus, Minus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { createPOSInvoice } from "@/app/actions/pos"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

type Product = {
    id: string
    name: string
    itemCode: string
    standardRate: number
    currentStock: number
    image: string | null
}

type CartItem = Product & { qty: number }

export default function POSInterface({ products }: { products: Product[] }) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [search, setSearch] = useState("")
    const [isCheckoutOpen, setCheckoutOpen] = useState(false)
    const [paidAmount, setPaidAmount] = useState("")
    const [paymentMode, setPaymentMode] = useState("CASH")
    const [isPending, startTransition] = useTransition()

    // Filter Products
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.itemCode.toLowerCase().includes(search.toLowerCase())
    )

    // Cart Logic
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id)
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p)
            }
            return [...prev, { ...product, qty: 1 }]
        })
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(p => p.id !== id))
    }

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.id === id) return { ...p, qty: Math.max(1, p.qty + delta) }
            return p
        }))
    }

    // Totals
    const totalAmount = cart.reduce((sum, item) => sum + (item.standardRate * item.qty), 0)
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0)

    // Checkout
    const handleCheckout = () => {
        if (cart.length === 0) return
        setPaidAmount(totalAmount.toString())
        setCheckoutOpen(true)
    }

    const submitSale = async () => {
        const payload = new FormData()
        payload.append("items", JSON.stringify(cart.map(c => ({
            itemId: c.id,
            qty: c.qty,
            rate: c.standardRate
        }))))
        payload.append("paidAmount", paidAmount)
        payload.append("paymentMode", paymentMode)

        startTransition(async () => {
            const result = await createPOSInvoice(payload)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Sale completed successfully")
                setCart([])
                setCheckoutOpen(false)
                setPaidAmount("")
            }
        })
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-background">
            {/* Left: Product Grid */}
            <div className="flex-1 flex flex-col h-full border-r">
                {/* Search Header */}
                <div className="p-4 border-b bg-background">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Scan barcode or search name..."
                            className="pl-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/10 p-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredProducts.map(product => (
                            <Card
                                key={product.id}
                                className="cursor-pointer hover:border-primary transition-colors overflow-hidden flex flex-col h-full"
                                onClick={() => addToCart(product)}
                            >
                                <div className="h-32 bg-muted flex items-center justify-center relative">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-4xl text-muted-foreground/20 font-bold">
                                            {product.name.charAt(0)}
                                        </span>
                                    )}
                                    <Badge
                                        variant={product.currentStock > 0 ? "secondary" : "destructive"}
                                        className="absolute top-2 right-2"
                                    >
                                        {product.currentStock}
                                    </Badge>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground mb-2">{product.itemCode}</p>
                                    <div className="font-bold text-primary">
                                        NPR {product.standardRate.toLocaleString()}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Cart Sidebar */}
            <div className="w-[400px] flex flex-col h-full bg-background shadow-lg z-20">
                <div className="h-14 border-b flex items-center justify-between px-4 bg-background">
                    <h2 className="font-semibold flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Current Order ({totalItems})
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setCart([])}
                        disabled={cart.length === 0}
                    >
                        Clear
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                            <ShoppingCart className="h-12 w-12" />
                            <p>No items in cart</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-3 bg-muted/20 p-2 rounded-lg border">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                            <p className="font-bold text-sm">{(item.qty * item.standardRate).toLocaleString()}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">@{item.standardRate.toLocaleString()}</p>

                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="flex items-center border rounded-md bg-background">
                                                <button
                                                    className="h-7 w-7 flex items-center justify-center hover:bg-muted"
                                                    onClick={() => updateQty(item.id, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center text-sm font-medium">{item.qty}</span>
                                                <button
                                                    className="h-7 w-7 flex items-center justify-center hover:bg-muted"
                                                    onClick={() => updateQty(item.id, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive ml-auto"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-4 border-t bg-muted/5 space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax</span>
                            <span>-</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between items-end">
                            <span className="font-semibold text-lg">Total</span>
                            <span className="font-bold text-2xl text-primary">NPR {totalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        className="w-full font-semibold"
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                    >
                        Charge {totalAmount.toLocaleString()}
                    </Button>
                </div>
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Complete Payment</DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                variant={paymentMode === 'CASH' ? 'default' : 'outline'}
                                className="h-24 flex-col gap-2"
                                onClick={() => setPaymentMode('CASH')}
                            >
                                <Banknote className="h-6 w-6" />
                                <span className="font-semibold">Cash</span>
                            </Button>
                            <Button
                                variant={paymentMode === 'QR_FONEPAY' ? 'default' : 'outline'}
                                className="h-24 flex-col gap-2"
                                onClick={() => setPaymentMode('QR_FONEPAY')}
                            >
                                <QrCode className="h-6 w-6" />
                                <span className="font-semibold">FonePay</span>
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Amount Received</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">NPR</span>
                                <Input
                                    className="pl-12 h-12 text-lg"
                                    value={paidAmount}
                                    onChange={e => setPaidAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {Number(paidAmount) >= totalAmount && (
                            <div className="p-4 bg-emerald-50 rounded-lg text-center border border-emerald-100">
                                <p className="text-sm text-emerald-800 font-medium">Change Due</p>
                                <p className="text-2xl font-bold text-emerald-700">
                                    NPR {(Number(paidAmount) - totalAmount).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={submitSale}
                            disabled={isPending}
                        >
                            {isPending ? "Processing..." : "Complete Sale"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
