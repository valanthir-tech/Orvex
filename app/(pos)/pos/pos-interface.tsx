"use client"

import { useState, useTransition, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Search,
    ShoppingCart,
    Trash2,
    Banknote,
    QrCode,
    Plus,
    Minus,
    Package,
    CreditCard,
    Loader2,
    CheckCircle2,
    User,
    X,
    Delete,
    Percent,
    Hash,
    LayoutGrid,
    List,
    ScanLine,
    History
} from "lucide-react"
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
    DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Product = {
    id: string
    name: string
    itemCode: string
    standardRate: number
    currentStock: number
    image: string | null
}

type CartItem = Product & { qty: number }

type NumpadMode = "qty" | "discount" | "price"

export default function POSInterface({ products }: { products: Product[] }) {
    const [cart, setCart] = useState<CartItem[]>([])
    const [search, setSearch] = useState("")
    const [isCheckoutOpen, setCheckoutOpen] = useState(false)
    const [paidAmount, setPaidAmount] = useState("")
    const [paymentMode, setPaymentMode] = useState("CASH")
    const [isPending, startTransition] = useTransition()
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
    const [numpadMode, setNumpadMode] = useState<NumpadMode>("qty")
    const [numpadValue, setNumpadValue] = useState("")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Filter Products
    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.itemCode.toLowerCase().includes(search.toLowerCase())
        )
    }, [products, search])

    // Cart Logic
    const addToCart = (product: Product) => {
        if (product.currentStock <= 0) {
            toast.error("Item out of stock")
            return
        }
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id)
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p)
            }
            return [...prev, { ...product, qty: 1 }]
        })
        setSelectedItemId(product.id)
        setNumpadValue("")
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(p => p.id !== id))
        if (selectedItemId === id) {
            setSelectedItemId(null)
        }
    }

    const updateQty = (id: string, newQty: number) => {
        if (newQty <= 0) {
            removeFromCart(id)
            return
        }
        setCart(prev => prev.map(p => {
            if (p.id === id) return { ...p, qty: newQty }
            return p
        }))
    }

    const clearCart = () => {
        setCart([])
        setSelectedItemId(null)
        setNumpadValue("")
    }

    // Numpad handling
    const handleNumpadClick = (value: string) => {
        if (!selectedItemId) {
            toast.error("Select an item first")
            return
        }

        if (value === "C") {
            setNumpadValue("")
            return
        }

        if (value === "DEL") {
            setNumpadValue(prev => prev.slice(0, -1))
            return
        }

        if (value === "ENTER") {
            const num = parseFloat(numpadValue) || 0
            if (numpadMode === "qty" && num > 0) {
                updateQty(selectedItemId, Math.floor(num))
            }
            setNumpadValue("")
            return
        }

        // Append digit
        if (value === "." && numpadValue.includes(".")) return
        setNumpadValue(prev => prev + value)
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
                toast.success("Sale completed successfully!")
                clearCart()
                setCheckoutOpen(false)
                setPaidAmount("")
            }
        })
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Focus search on /
            if (e.key === "/" && document.activeElement !== searchInputRef.current) {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
            // Clear search on Escape
            if (e.key === "Escape") {
                setSearch("")
                searchInputRef.current?.blur()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    const selectedItem = cart.find(item => item.id === selectedItemId)

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-muted/30">
            {/* Left Panel - Cart (ERPNext style) */}
            <div className="w-[380px] flex flex-col h-full bg-background border-r shadow-lg">
                {/* Customer Selector (ERPNext style) */}
                <div className="p-3 border-b bg-muted/30">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-sm">Walk-in Customer</p>
                            <p className="text-xs text-muted-foreground">Click to select customer</p>
                        </div>
                    </div>
                </div>

                {/* Cart Header */}
                <div className="h-12 border-b flex items-center justify-between px-4 bg-background">
                    <h2 className="font-bold text-sm flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Order
                        {totalItems > 0 && (
                            <Badge className="bg-primary text-primary-foreground rounded-full px-2 text-xs">
                                {totalItems}
                            </Badge>
                        )}
                    </h2>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs"
                        onClick={clearCart}
                        disabled={cart.length === 0}
                    >
                        Clear
                    </Button>
                </div>

                {/* Cart Items (ERPNext style with column headers) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Column Headers */}
                    {cart.length > 0 && (
                        <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/20">
                            <span>Item</span>
                            <span className="text-center">Qty</span>
                            <span className="text-right">Amount</span>
                        </div>
                    )}

                    <ScrollArea className="flex-1">
                        <div className="p-2">
                            {cart.length === 0 ? (
                                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                                    <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                    <p className="text-sm font-medium">Empty Cart</p>
                                    <p className="text-xs text-muted-foreground/70">Add items to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {cart.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => {
                                                setSelectedItemId(item.id)
                                                setNumpadValue("")
                                            }}
                                            className={`grid grid-cols-[1fr_80px_80px] gap-2 items-center p-2 rounded-lg cursor-pointer transition-colors ${selectedItemId === item.id
                                                    ? 'bg-primary/10 border border-primary/30'
                                                    : 'hover:bg-muted/50'
                                                }`}
                                        >
                                            <div className="min-w-0">
                                                <p className="font-medium text-sm truncate">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    @ Rs. {item.standardRate.toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    className="h-6 w-6 rounded bg-muted hover:bg-muted/70 flex items-center justify-center"
                                                    onClick={(e) => { e.stopPropagation(); updateQty(item.id, item.qty - 1) }}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </button>
                                                <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                                                <button
                                                    className="h-6 w-6 rounded bg-muted hover:bg-muted/70 flex items-center justify-center"
                                                    onClick={(e) => { e.stopPropagation(); updateQty(item.id, item.qty + 1) }}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">
                                                    {(item.qty * item.standardRate).toLocaleString()}
                                                </p>
                                                <button
                                                    className="text-xs text-destructive hover:underline"
                                                    onClick={(e) => { e.stopPropagation(); removeFromCart(item.id) }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Numpad (ERPNext/Odoo style) */}
                {cart.length > 0 && (
                    <div className="border-t bg-muted/20 p-3">
                        {/* Numpad Mode Buttons */}
                        <div className="grid grid-cols-4 gap-1 mb-2">
                            <button
                                onClick={() => setNumpadMode("qty")}
                                className={`h-9 rounded-lg text-xs font-medium transition-colors ${numpadMode === "qty"
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/70'
                                    }`}
                            >
                                <Hash className="h-3.5 w-3.5 mx-auto" />
                            </button>
                            <button
                                onClick={() => setNumpadMode("discount")}
                                className={`h-9 rounded-lg text-xs font-medium transition-colors ${numpadMode === "discount"
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/70'
                                    }`}
                            >
                                <Percent className="h-3.5 w-3.5 mx-auto" />
                            </button>
                            <button
                                onClick={() => setNumpadMode("price")}
                                className={`h-9 rounded-lg text-xs font-medium transition-colors ${numpadMode === "price"
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/70'
                                    }`}
                            >
                                Price
                            </button>
                            <button
                                onClick={() => handleNumpadClick("DEL")}
                                className="h-9 rounded-lg bg-muted hover:bg-muted/70 text-destructive"
                            >
                                <Delete className="h-4 w-4 mx-auto" />
                            </button>
                        </div>

                        {/* Display */}
                        <div className="h-10 rounded-lg bg-background border mb-2 flex items-center justify-between px-3">
                            <span className="text-xs text-muted-foreground uppercase">{numpadMode}</span>
                            <span className="font-mono text-lg font-bold">{numpadValue || "0"}</span>
                        </div>

                        {/* Number Grid */}
                        <div className="grid grid-cols-4 gap-1">
                            {["7", "8", "9", "C"].map(key => (
                                <button
                                    key={key}
                                    onClick={() => handleNumpadClick(key)}
                                    className={`h-10 rounded-lg font-medium transition-colors ${key === "C"
                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            : 'bg-muted hover:bg-muted/70'
                                        }`}
                                >
                                    {key}
                                </button>
                            ))}
                            {["4", "5", "6", ""].map((key, i) => (
                                <button
                                    key={key || "empty"}
                                    onClick={() => key && handleNumpadClick(key)}
                                    className={`h-10 rounded-lg font-medium bg-muted hover:bg-muted/70 ${!key && 'invisible'}`}
                                >
                                    {key}
                                </button>
                            ))}
                            {["1", "2", "3", ""].map((key, i) => (
                                <button
                                    key={key || "empty2"}
                                    onClick={() => key && handleNumpadClick(key)}
                                    className={`h-10 rounded-lg font-medium bg-muted hover:bg-muted/70 ${!key && 'invisible'}`}
                                >
                                    {key}
                                </button>
                            ))}
                            {[".", "0", "00", "ENTER"].map(key => (
                                <button
                                    key={key}
                                    onClick={() => handleNumpadClick(key)}
                                    className={`h-10 rounded-lg font-medium transition-colors ${key === "ENTER"
                                            ? 'bg-primary text-primary-foreground text-xs'
                                            : 'bg-muted hover:bg-muted/70'
                                        }`}
                                >
                                    {key === "ENTER" ? "✓" : key}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Totals & Checkout */}
                <div className="border-t bg-background p-4 space-y-3">
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span>Rs. {totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tax (0%)</span>
                            <span>Rs. 0</span>
                        </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-end">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-2xl text-primary font-heading">
                            Rs. {totalAmount.toLocaleString()}
                        </span>
                    </div>
                    <Button
                        size="lg"
                        className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/25 gap-2"
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                    >
                        <CreditCard className="h-5 w-5" />
                        Pay
                    </Button>
                </div>
            </div>

            {/* Right Panel - Products (Odoo style) */}
            <div className="flex-1 flex flex-col h-full">
                {/* Search & Controls */}
                <div className="p-3 border-b bg-background/80 backdrop-blur-sm flex items-center gap-3">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search or scan barcode... (Press /)"
                            className="pl-11 h-11 rounded-xl border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                        {search && (
                            <button
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center"
                                onClick={() => setSearch("")}
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="flex rounded-lg bg-muted p-1">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${viewMode === "grid" ? 'bg-background shadow-sm' : ''
                                }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${viewMode === "list" ? 'bg-background shadow-sm' : ''
                                }`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <Button variant="outline" size="icon" className="rounded-xl h-11 w-11">
                        <ScanLine className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl h-11 w-11">
                        <History className="h-5 w-5" />
                    </Button>
                </div>

                {/* Products Grid */}
                <ScrollArea className="flex-1 p-4">
                    {filteredProducts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                            <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                <Package className="h-10 w-10 text-muted-foreground/50" />
                            </div>
                            <p className="font-medium">No products found</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                {search ? `No results for "${search}"` : "Add products to get started"}
                            </p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                            {filteredProducts.map(product => {
                                const cartQty = cart.find(c => c.id === product.id)?.qty || 0
                                return (
                                    <Card
                                        key={product.id}
                                        className={`group cursor-pointer border-0 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 card-float relative ${product.currentStock <= 0 ? 'opacity-50' : ''
                                            }`}
                                        onClick={() => addToCart(product)}
                                    >
                                        {/* Cart Quantity Badge (Odoo style) */}
                                        {cartQty > 0 && (
                                            <div className="absolute bottom-2 right-2 z-10 bg-black text-white px-2.5 py-1 rounded-lg text-sm font-bold shadow-lg">
                                                {cartQty}
                                            </div>
                                        )}

                                        {/* Product Image */}
                                        <div className="aspect-square bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center relative overflow-hidden">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <span className="text-4xl font-bold text-muted-foreground/20 group-hover:scale-110 transition-transform duration-300">
                                                    {product.name.charAt(0)}
                                                </span>
                                            )}
                                            {/* Stock Badge */}
                                            {product.currentStock <= 10 && (
                                                <Badge
                                                    variant="secondary"
                                                    className={`absolute top-2 right-2 text-xs font-bold ${product.currentStock <= 0
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                        }`}
                                                >
                                                    {product.currentStock <= 0 ? 'Out' : product.currentStock}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardContent className="p-2.5">
                                            <h3 className="font-medium text-sm line-clamp-2 leading-tight mb-1">
                                                {product.name}
                                            </h3>
                                            <div className="font-bold text-primary">
                                                Rs. {product.standardRate.toLocaleString()}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    ) : (
                        /* List View */
                        <div className="space-y-2">
                            {filteredProducts.map(product => {
                                const cartQty = cart.find(c => c.id === product.id)?.qty || 0
                                return (
                                    <div
                                        key={product.id}
                                        className={`flex items-center gap-4 p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 cursor-pointer transition-colors ${product.currentStock <= 0 ? 'opacity-50' : ''
                                            }`}
                                        onClick={() => addToCart(product)}
                                    >
                                        <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xl font-bold text-muted-foreground/30">
                                                    {product.name.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium truncate">{product.name}</h3>
                                            <p className="text-sm text-muted-foreground font-mono">{product.itemCode}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-primary">Rs. {product.standardRate.toLocaleString()}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {product.currentStock} in stock
                                            </div>
                                        </div>
                                        {cartQty > 0 && (
                                            <div className="bg-primary text-primary-foreground h-8 w-8 rounded-full flex items-center justify-center font-bold">
                                                {cartQty}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Checkout Dialog */}
            <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-2xl border-0 p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                        <DialogTitle className="text-xl font-heading">Complete Payment</DialogTitle>
                        <DialogDescription>
                            Total: <span className="font-bold text-foreground">Rs. {totalAmount.toLocaleString()}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="px-6 py-6 space-y-6">
                        {/* Payment Methods */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setPaymentMode('CASH')}
                                className={`relative h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${paymentMode === 'CASH'
                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <Banknote className={`h-8 w-8 ${paymentMode === 'CASH' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="font-semibold text-sm">Cash</span>
                                {paymentMode === 'CASH' && (
                                    <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />
                                )}
                            </button>
                            <button
                                onClick={() => setPaymentMode('QR_FONEPAY')}
                                className={`relative h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${paymentMode === 'QR_FONEPAY'
                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                                        : 'border-border hover:border-primary/50'
                                    }`}
                            >
                                <QrCode className={`h-8 w-8 ${paymentMode === 'QR_FONEPAY' ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className="font-semibold text-sm">FonePay</span>
                                {paymentMode === 'QR_FONEPAY' && (
                                    <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />
                                )}
                            </button>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Amount Received</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">Rs.</span>
                                <Input
                                    className="pl-12 h-14 text-xl font-bold rounded-xl border-0 bg-muted/50 focus:bg-background focus:ring-2 focus:ring-primary/20"
                                    value={paidAmount}
                                    onChange={e => setPaidAmount(e.target.value)}
                                    placeholder="0.00"
                                    type="number"
                                />
                            </div>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="flex gap-2">
                            {[totalAmount, Math.ceil(totalAmount / 100) * 100, Math.ceil(totalAmount / 500) * 500].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setPaidAmount(amount.toString())}
                                    className="flex-1 h-10 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium transition-colors"
                                >
                                    Rs. {amount.toLocaleString()}
                                </button>
                            ))}
                        </div>

                        {/* Change Display */}
                        {Number(paidAmount) >= totalAmount && (
                            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-center">
                                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-1">Change Due</p>
                                <p className="text-3xl font-bold font-heading text-emerald-700 dark:text-emerald-400">
                                    Rs. {(Number(paidAmount) - totalAmount).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/30">
                        <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 h-12 text-lg font-bold rounded-xl gap-2"
                            onClick={submitSale}
                            disabled={isPending || Number(paidAmount) < totalAmount}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5" />
                                    Complete Sale
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
