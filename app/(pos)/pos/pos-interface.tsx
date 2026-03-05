"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Search, ShoppingCart, Trash2, Banknote, QrCode,
    Plus, Minus, Package, CreditCard, Loader2,
    CheckCircle2, User, X, Delete, Percent,
    Hash, LayoutGrid, List, ScanLine, History,
    RefreshCw, Printer, WifiOff, Wifi, CloudOff,
    ArrowLeft, Clock
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { db, Order } from "@/lib/db"
import { usePosStore } from "@/stores/pos-store"
import { useSeedProducts } from "@/hooks/use-seed-products"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { syncPendingOrders } from "@/lib/sync-engine"
import QrScanner from "@/components/pos/QrScanner"
import SyncLogsPanel from "@/components/pos/SyncLogsPanel"
import { Activity } from "lucide-react"

type NumpadMode = "qty" | "discount" | "price"

/** Dexie may return Date fields as strings after serialization round-trips */
function safeDate(d: Date | string | number): Date {
    return d instanceof Date ? d : new Date(d)
}

export default function POSInterface() {
    // Seed products into Dexie on first load
    useSeedProducts()

    const isOnline = useOnlineStatus()

    // Read products from Dexie (reactive)
    const products = useLiveQuery(
        () => db.items.toArray(),
        [],
        []
    )

    // Pending sync count (reactive)
    const pendingCount = useLiveQuery(
        () => db.orders.where('status').anyOf(['completed', 'sync_failed']).count(),
        [],
        0
    )

    // POS Store
    const {
        cart, addToCart, removeFromCart, updateQuantity,
        clearCart, getTotals, checkout, lastOrder,
    } = usePosStore()

    // Local UI state
    const [search, setSearch] = useState("")
    const [isCheckoutOpen, setCheckoutOpen] = useState(false)
    const [paidAmount, setPaidAmount] = useState("")
    const [paymentMode, setPaymentMode] = useState<"CASH" | "CARD" | "QR" | "CREDIT">("CASH")
    const [isProcessing, setIsProcessing] = useState(false)
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
    const [numpadMode, setNumpadMode] = useState<NumpadMode>("qty")
    const [numpadValue, setNumpadValue] = useState("")
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const [mobileCartOpen, setMobileCartOpen] = useState(false)
    const [receiptOpen, setReceiptOpen] = useState(false)
    const [receiptOrder, setReceiptOrder] = useState<Order | null>(null)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [qrScannerOpen, setQrScannerOpen] = useState(false)
    const [syncLogsOpen, setSyncLogsOpen] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Order history from Dexie
    const orderHistory = useLiveQuery(
        () => db.orders.orderBy('createdAt').reverse().limit(50).toArray(),
        [],
        []
    )

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!products) return []
        return products.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            (p.barcode && p.barcode.includes(search))
        )
    }, [products, search])

    // Cart totals
    const totals = getTotals()

    // Add to cart handler
    const handleAddToCart = useCallback((product: typeof products[number]) => {
        if (product.stock <= 0) {
            toast.error("Item out of stock")
            return
        }
        addToCart({
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock: product.stock,
        })
        setSelectedItemId(product.id)
        setNumpadValue("")
    }, [addToCart])

    // Numpad handling
    const handleNumpadClick = useCallback((value: string) => {
        if (!selectedItemId) {
            toast.error("Select an item first")
            return
        }
        if (value === "C") { setNumpadValue(""); return }
        if (value === "DEL") { setNumpadValue(prev => prev.slice(0, -1)); return }
        if (value === "ENTER") {
            const num = parseFloat(numpadValue) || 0
            if (numpadMode === "qty" && num > 0) {
                updateQuantity(selectedItemId, Math.floor(num))
            }
            setNumpadValue("")
            return
        }
        if (value === "." && numpadValue.includes(".")) return
        setNumpadValue(prev => prev + value)
    }, [selectedItemId, numpadMode, numpadValue, updateQuantity])

    // Checkout
    const handleCheckout = () => {
        if (cart.length === 0) return
        setPaidAmount(totals.total.toFixed(0))
        setCheckoutOpen(true)
    }

    const submitSale = async () => {
        setIsProcessing(true)
        try {
            const paid = Number(paidAmount) || 0
            if (paid < totals.total) {
                toast.error("Insufficient payment amount")
                setIsProcessing(false)
                return
            }
            const order = await checkout(paymentMode, paid)
            setCheckoutOpen(false)
            setPaidAmount("")
            setReceiptOrder(order)
            setReceiptOpen(true)
            toast.success("Sale completed!", { description: `Order #${order.uuid.slice(0, 8)}` })
        } catch (err) {
            toast.error("Checkout failed", { description: err instanceof Error ? err.message : "Unknown error" })
        }
        setIsProcessing(false)
    }

    // Sync
    const handleSync = async () => {
        if (isSyncing) return
        setIsSyncing(true)
        try {
            const result = await syncPendingOrders()
            if (result.synced > 0) {
                toast.success(`Synced ${result.synced} order(s)`)
            }
            if (result.failed > 0) {
                toast.error(`${result.failed} order(s) failed to sync`, {
                    description: result.errors[0],
                })
            }
            if (result.synced === 0 && result.failed === 0) {
                toast.info("No pending orders to sync")
            }
        } catch {
            toast.error("Sync failed")
        }
        setIsSyncing(false)
    }

    // QR/Barcode scan result handler
    const handleQrScan = useCallback((code: string) => {
        if (!products) return
        // Match by barcode, SKU, or ID
        const matched = products.find(
            (p) =>
                p.barcode === code ||
                p.sku.toLowerCase() === code.toLowerCase() ||
                p.id === code
        )
        if (matched) {
            handleAddToCart(matched)
            toast.success(`Added: ${matched.name}`)
            setQrScannerOpen(false)
        } else {
            // Try searching with the scanned code
            setSearch(code)
            setQrScannerOpen(false)
            toast.info(`Scanned: ${code}`, { description: "No exact match — showing search results" })
        }
    }, [products, handleAddToCart])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/" && document.activeElement !== searchInputRef.current) {
                e.preventDefault()
                searchInputRef.current?.focus()
            }
            if (e.key === "Escape") {
                setSearch("")
                searchInputRef.current?.blur()
            }
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [])

    // Print receipt
    const printReceipt = () => {
        window.print()
    }

    return (
        <>
            {/* ─── MAIN LAYOUT ─── */}
            <div className="flex h-[calc(100vh-3.5rem)] bg-muted/30">

                {/* ─── LEFT: CART PANEL (desktop) ─── */}
                <div className="hidden lg:flex w-[380px] flex-col h-full bg-background border-r shadow-lg">
                    {/* Customer */}
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
                            {totals.itemCount > 0 && (
                                <Badge className="bg-primary text-primary-foreground rounded-full px-2 text-xs">
                                    {totals.itemCount}
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

                    {/* Cart Items */}
                    <div className="flex-1 flex flex-col overflow-hidden">
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
                                                key={item.itemId}
                                                onClick={() => { setSelectedItemId(item.itemId); setNumpadValue("") }}
                                                className={`grid grid-cols-[1fr_80px_80px] gap-2 items-center p-2 rounded-lg cursor-pointer transition-colors ${selectedItemId === item.itemId
                                                    ? 'bg-primary/10 border border-primary/30'
                                                    : 'hover:bg-muted/50'
                                                    }`}
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        @ Rs. {item.price.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        className="h-6 w-6 rounded bg-muted hover:bg-muted/70 flex items-center justify-center"
                                                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.itemId, item.quantity - 1) }}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </button>
                                                    <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                                    <button
                                                        className="h-6 w-6 rounded bg-muted hover:bg-muted/70 flex items-center justify-center"
                                                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.itemId, item.quantity + 1) }}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-sm">
                                                        {(item.quantity * item.price).toLocaleString()}
                                                    </p>
                                                    <button
                                                        className="text-xs text-destructive hover:underline"
                                                        onClick={(e) => { e.stopPropagation(); removeFromCart(item.itemId) }}
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

                    {/* Numpad */}
                    {cart.length > 0 && (
                        <div className="border-t bg-muted/20 p-3">
                            <div className="grid grid-cols-4 gap-1 mb-2">
                                <button onClick={() => setNumpadMode("qty")} className={`h-9 rounded-lg text-xs font-medium transition-colors ${numpadMode === "qty" ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}>
                                    <Hash className="h-3.5 w-3.5 mx-auto" />
                                </button>
                                <button onClick={() => setNumpadMode("discount")} className={`h-9 rounded-lg text-xs font-medium transition-colors ${numpadMode === "discount" ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}>
                                    <Percent className="h-3.5 w-3.5 mx-auto" />
                                </button>
                                <button onClick={() => setNumpadMode("price")} className={`h-9 rounded-lg text-xs font-medium transition-colors ${numpadMode === "price" ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/70'}`}>
                                    Price
                                </button>
                                <button onClick={() => handleNumpadClick("DEL")} className="h-9 rounded-lg bg-muted hover:bg-muted/70 text-destructive">
                                    <Delete className="h-4 w-4 mx-auto" />
                                </button>
                            </div>
                            <div className="h-10 rounded-lg bg-background border mb-2 flex items-center justify-between px-3">
                                <span className="text-xs text-muted-foreground uppercase">{numpadMode}</span>
                                <span className="font-mono text-lg font-bold">{numpadValue || "0"}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                                {["7", "8", "9", "C", "4", "5", "6", "", "1", "2", "3", "", ".", "0", "00", "ENTER"].map((key, i) => (
                                    <button
                                        key={key || `empty-${i}`}
                                        onClick={() => key && handleNumpadClick(key)}
                                        className={`h-10 rounded-lg font-medium transition-colors ${!key ? 'invisible' :
                                            key === "C" ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                key === "ENTER" ? 'bg-primary text-primary-foreground text-xs' :
                                                    'bg-muted hover:bg-muted/70'
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
                                <span>Rs. {totals.subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">VAT (13%)</span>
                                <span>Rs. {totals.tax.toLocaleString()}</span>
                            </div>
                            {totals.discount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>Discount</span>
                                    <span>- Rs. {totals.discount.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                        <Separator />
                        <div className="flex justify-between items-end">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-2xl text-primary">
                                Rs. {totals.total.toLocaleString()}
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

                {/* ─── RIGHT: PRODUCTS ─── */}
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
                        <div className="hidden sm:flex rounded-lg bg-muted p-1">
                            <button onClick={() => setViewMode("grid")} className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${viewMode === "grid" ? 'bg-background shadow-sm' : ''}`}>
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button onClick={() => setViewMode("list")} className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${viewMode === "list" ? 'bg-background shadow-sm' : ''}`}>
                                <List className="h-4 w-4" />
                            </button>
                        </div>

                        {/* QR Scanner */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-xl h-11 w-11"
                            onClick={() => setQrScannerOpen(true)}
                            title="Scan barcode / QR"
                        >
                            <ScanLine className="h-5 w-5" />
                        </Button>

                        {/* Sync Button */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-xl h-11 w-11 relative"
                            onClick={handleSync}
                            disabled={isSyncing}
                            title="Sync orders"
                        >
                            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                            {pendingCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {pendingCount}
                                </span>
                            )}
                        </Button>

                        {/* Sync Logs */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-xl h-11 w-11"
                            onClick={() => setSyncLogsOpen(true)}
                            title="Sync logs"
                        >
                            <Activity className="h-5 w-5" />
                        </Button>

                        {/* Order History */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-xl h-11 w-11"
                            onClick={() => setHistoryOpen(true)}
                        >
                            <History className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Products Grid */}
                    <ScrollArea className="flex-1 p-4">
                        {!products || products.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                                <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                                    <Package className="h-10 w-10 text-muted-foreground/50" />
                                </div>
                                <p className="font-medium">Loading products...</p>
                                <p className="text-sm text-muted-foreground/70 mt-1">Seeding from local database</p>
                            </div>
                        ) : filteredProducts.length === 0 ? (
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
                                    const cartQty = cart.find(c => c.itemId === product.id)?.quantity || 0
                                    return (
                                        <Card
                                            key={product.id}
                                            className={`group cursor-pointer border-0 rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 relative ${product.stock <= 0 ? 'opacity-50' : ''}`}
                                            onClick={() => handleAddToCart(product)}
                                        >
                                            {cartQty > 0 && (
                                                <div className="absolute bottom-2 right-2 z-10 bg-black text-white px-2.5 py-1 rounded-lg text-sm font-bold shadow-lg">
                                                    {cartQty}
                                                </div>
                                            )}
                                            <div className="aspect-square bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center relative overflow-hidden">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                ) : (
                                                    <span className="text-4xl font-bold text-muted-foreground/20 group-hover:scale-110 transition-transform duration-300">
                                                        {product.name.charAt(0)}
                                                    </span>
                                                )}
                                                {product.stock <= 10 && (
                                                    <Badge
                                                        variant="secondary"
                                                        className={`absolute top-2 right-2 text-xs font-bold ${product.stock <= 0
                                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                            }`}
                                                    >
                                                        {product.stock <= 0 ? 'Out' : product.stock}
                                                    </Badge>
                                                )}
                                            </div>
                                            <CardContent className="p-2.5">
                                                <h3 className="font-medium text-sm line-clamp-2 leading-tight mb-1">{product.name}</h3>
                                                <div className="font-bold text-primary">Rs. {product.price.toLocaleString()}</div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {filteredProducts.map(product => {
                                    const cartQty = cart.find(c => c.itemId === product.id)?.quantity || 0
                                    return (
                                        <div
                                            key={product.id}
                                            className={`flex items-center gap-4 p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 cursor-pointer transition-colors ${product.stock <= 0 ? 'opacity-50' : ''}`}
                                            onClick={() => handleAddToCart(product)}
                                        >
                                            <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                {product.image ? (
                                                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-xl font-bold text-muted-foreground/30">{product.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium truncate">{product.name}</h3>
                                                <p className="text-sm text-muted-foreground font-mono">{product.sku}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-primary">Rs. {product.price.toLocaleString()}</div>
                                                <div className="text-xs text-muted-foreground">{product.stock} in stock</div>
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
            </div>

            {/* ─── MOBILE FLOATING CART ─── */}
            <div className="lg:hidden fixed bottom-6 right-6 z-50">
                <Button
                    size="lg"
                    className="h-14 rounded-2xl shadow-xl shadow-primary/30 gap-2 px-6"
                    onClick={() => setMobileCartOpen(true)}
                >
                    <ShoppingCart className="h-5 w-5" />
                    {totals.itemCount > 0 && (
                        <span className="bg-white text-primary font-bold text-sm rounded-full h-6 w-6 flex items-center justify-center">
                            {totals.itemCount}
                        </span>
                    )}
                    <span className="font-bold">Rs. {totals.total.toLocaleString()}</span>
                </Button>
            </div>

            {/* ─── MOBILE CART SHEET ─── */}
            <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
                <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 flex flex-col">
                    <SheetHeader className="px-4 pt-4 pb-2 border-b">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4" />
                                Cart
                                {totals.itemCount > 0 && (
                                    <Badge className="bg-primary text-primary-foreground rounded-full px-2 text-xs">{totals.itemCount}</Badge>
                                )}
                            </SheetTitle>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs" onClick={clearCart} disabled={cart.length === 0}>
                                Clear
                            </Button>
                        </div>
                    </SheetHeader>
                    <ScrollArea className="flex-1 px-4 py-2">
                        {cart.length === 0 ? (
                            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                                <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                <p className="text-sm font-medium">Empty Cart</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cart.map(item => (
                                    <div key={item.itemId} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">@ Rs. {item.price.toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center" onClick={() => updateQuantity(item.itemId, item.quantity - 1)}>
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                                            <button className="h-8 w-8 rounded-lg bg-background border flex items-center justify-center" onClick={() => updateQuantity(item.itemId, item.quantity + 1)}>
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <div className="text-right min-w-[70px]">
                                            <p className="font-bold text-sm">Rs. {(item.quantity * item.price).toLocaleString()}</p>
                                        </div>
                                        <button className="text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg flex items-center justify-center" onClick={() => removeFromCart(item.itemId)}>
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                    <div className="border-t bg-background p-4 space-y-3">
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>Rs. {totals.subTotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">VAT (13%)</span>
                                <span>Rs. {totals.tax.toLocaleString()}</span>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-end">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-2xl text-primary">Rs. {totals.total.toLocaleString()}</span>
                        </div>
                        <Button
                            size="lg"
                            className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/25 gap-2"
                            onClick={() => { setMobileCartOpen(false); handleCheckout() }}
                            disabled={cart.length === 0}
                        >
                            <CreditCard className="h-5 w-5" />
                            Pay
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* ─── CHECKOUT DIALOG ─── */}
            <Dialog open={isCheckoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-2xl border-0 p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                        <DialogTitle className="text-xl">Complete Payment</DialogTitle>
                        <DialogDescription>
                            Total: <span className="font-bold text-foreground">Rs. {totals.total.toLocaleString()}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-6 space-y-6">
                        {/* Payment Methods */}
                        <div className="grid grid-cols-2 gap-4">
                            {([
                                { key: 'CASH' as const, icon: Banknote, label: 'Cash' },
                                { key: 'QR' as const, icon: QrCode, label: 'FonePay / QR' },
                                { key: 'CARD' as const, icon: CreditCard, label: 'Card' },
                                { key: 'CREDIT' as const, icon: User, label: 'Credit' },
                            ]).map(({ key, icon: Icon, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setPaymentMode(key)}
                                    className={`relative h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${paymentMode === key
                                        ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <Icon className={`h-6 w-6 ${paymentMode === key ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <span className="font-semibold text-xs">{label}</span>
                                    {paymentMode === key && <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />}
                                </button>
                            ))}
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
                                    placeholder="0"
                                    type="number"
                                />
                            </div>
                        </div>

                        {/* Quick Amount Buttons */}
                        <div className="flex gap-2">
                            {[
                                Math.ceil(totals.total),
                                Math.ceil(totals.total / 100) * 100,
                                Math.ceil(totals.total / 500) * 500,
                                Math.ceil(totals.total / 1000) * 1000,
                            ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).map(amount => (
                                <button key={amount} onClick={() => setPaidAmount(amount.toString())}
                                    className="flex-1 h-10 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium transition-colors">
                                    {amount.toLocaleString()}
                                </button>
                            ))}
                        </div>

                        {/* Change Display */}
                        {Number(paidAmount) >= totals.total && Number(paidAmount) > 0 && (
                            <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-center">
                                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-1">Change Due</p>
                                <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-400">
                                    Rs. {(Number(paidAmount) - totals.total).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-border/50 bg-muted/30">
                        <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="rounded-xl">Cancel</Button>
                        <Button
                            className="flex-1 h-12 text-lg font-bold rounded-xl gap-2"
                            onClick={submitSale}
                            disabled={isProcessing || Number(paidAmount) < totals.total}
                        >
                            {isProcessing ? (
                                <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                            ) : (
                                <><CheckCircle2 className="h-5 w-5" /> Complete Sale</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── RECEIPT DIALOG ─── */}
            <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl border-0 p-0 overflow-hidden">
                    <div className="p-6 print-receipt" id="receipt-content">
                        {receiptOrder && (
                            <>
                                {/* Receipt Header */}
                                <div className="text-center mb-4">
                                    <h2 className="text-lg font-bold">Valanthir POS</h2>
                                    <p className="text-xs text-muted-foreground">Tax Invoice</p>
                                    <div className="h-px bg-border my-3" />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{safeDate(receiptOrder.createdAt).toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        <span>{safeDate(receiptOrder.createdAt).toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Order: #{receiptOrder.uuid.slice(0, 8).toUpperCase()}
                                    </p>
                                </div>

                                {/* Customer */}
                                <div className="text-xs mb-3">
                                    <span className="text-muted-foreground">Customer: </span>
                                    <span className="font-medium">{receiptOrder.customerName}</span>
                                </div>

                                {/* Items */}
                                <div className="border-t border-dashed pt-2 mb-2">
                                    <div className="grid grid-cols-[1fr_40px_60px] gap-1 text-xs font-medium text-muted-foreground mb-1">
                                        <span>Item</span>
                                        <span className="text-center">Qty</span>
                                        <span className="text-right">Amt</span>
                                    </div>
                                    {receiptOrder.items.map((item, i) => (
                                        <div key={i} className="grid grid-cols-[1fr_40px_60px] gap-1 text-sm py-1">
                                            <span className="truncate">{item.name}</span>
                                            <span className="text-center">{item.quantity}</span>
                                            <span className="text-right font-medium">
                                                {(item.price * item.quantity).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-dashed pt-2 space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>Rs. {receiptOrder.subTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">VAT (13%)</span>
                                        <span>Rs. {receiptOrder.taxTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-dashed pt-1 flex justify-between font-bold text-base">
                                        <span>Total</span>
                                        <span>Rs. {receiptOrder.grandTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Paid ({receiptOrder.paymentMode})</span>
                                        <span>Rs. {receiptOrder.paidAmount.toLocaleString()}</span>
                                    </div>
                                    {receiptOrder.changeAmount > 0 && (
                                        <div className="flex justify-between text-sm text-emerald-600 font-medium">
                                            <span>Change</span>
                                            <span>Rs. {receiptOrder.changeAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="text-center text-xs text-muted-foreground mt-4 pt-3 border-t border-dashed">
                                    <p>Thank you for your purchase!</p>
                                    <p className="mt-1 text-[10px] text-muted-foreground/70">Tax filing is the sole responsibility of the business owner.</p>
                                    <p className="mt-1">Powered by Valanthir</p>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
                        <Button variant="outline" className="rounded-xl" onClick={() => setReceiptOpen(false)}>
                            Close
                        </Button>
                        <Button className="flex-1 rounded-xl gap-2" onClick={printReceipt}>
                            <Printer className="h-4 w-4" />
                            Print Receipt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── ORDER HISTORY SHEET ─── */}
            <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                <SheetContent side="right" className="w-[420px] sm:max-w-[420px] p-0 flex flex-col">
                    <SheetHeader className="px-4 pt-4 pb-3 border-b">
                        <SheetTitle className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Order History
                            <Badge variant="secondary" className="rounded-full text-xs">{orderHistory.length}</Badge>
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-2">
                            {orderHistory.length === 0 ? (
                                <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                                    <History className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                    <p className="text-sm font-medium">No orders yet</p>
                                    <p className="text-xs text-muted-foreground/70">Complete a sale to see it here</p>
                                </div>
                            ) : (
                                orderHistory.map(order => (
                                    <div key={order.uuid} className="p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                #{order.uuid.slice(0, 8).toUpperCase()}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className={`text-[10px] font-bold rounded-full ${order.status === 'synced'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : order.status === 'sync_failed'
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                    }`}
                                            >
                                                {order.status === 'synced' ? '✓ Synced' :
                                                    order.status === 'sync_failed' ? '✕ Failed' : '⏳ Pending'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">{order.customerName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.items.length} item(s) • {order.paymentMode}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">Rs. {order.grandTotal.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {safeDate(order.createdAt).toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        {order.syncError && (
                                            <p className="text-xs text-rose-500 mt-2 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">
                                                {order.syncError} (Retry {order.syncRetries}/{5})
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* ─── QR SCANNER ─── */}
            <QrScanner
                open={qrScannerOpen}
                onClose={() => setQrScannerOpen(false)}
                onScan={handleQrScan}
            />

            {/* ─── SYNC LOGS ─── */}
            <SyncLogsPanel
                open={syncLogsOpen}
                onClose={() => setSyncLogsOpen(false)}
            />
        </>
    )
}
