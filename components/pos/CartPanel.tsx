import { Minus, Plus, Trash2, Printer, CreditCard, Banknote, QrCode, House } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { usePosStore } from "@/stores/pos-store";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function CartPanel() {
    const { cart, updateQuantity, removeFromCart, getTotals, checkout, clearCart } = usePosStore();
    const totals = getTotals();

    const handleCheckout = async (mode: 'CASH' | 'CARD' | 'QR') => {
        try {
            if (cart.length === 0) return toast.error("Cart is empty");

            const orderId = await checkout(mode);
            toast.success(`Order ${orderId.slice(0, 8)}... created!`);
        } catch (e) {
            toast.error("Checkout failed");
        }
    };

    return (
        <div className="flex flex-col h-full bg-card border-r border-border">
            {/* Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-muted/40 gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" asChild>
                    <Link href="/" title="Back to Dashboard">
                        <House className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <h2 className="font-heading font-semibold text-lg truncate">Current Order</h2>
                    <p className="text-xs text-muted-foreground truncate">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 shrink-0"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                </Button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-hidden relative">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                        {cart.map((item) => (
                            <div key={item.itemId} className="flex gap-3 group">
                                {/* Qty Controls */}
                                <div className="flex flex-col items-center justify-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-6 w-6 rounded-full border-input"
                                        onClick={() => updateQuantity(item.itemId, 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-6 w-6 rounded-full border-input"
                                        onClick={() => updateQuantity(item.itemId, -1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                </div>

                                {/* Item Details */}
                                <Card className="flex-1 flex p-2 border-0 shadow-sm bg-muted/50 items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{item.name}</h4>
                                        <p className="text-xs text-muted-foreground">
                                            {item.quantity} x Rs. {item.price}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-sm">Rs. {item.price * item.quantity}</p>
                                    </div>
                                </Card>

                                {/* Delete Button (Hover only on desktop) */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-auto w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeFromCart(item.itemId)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        {cart.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground opacity-50 space-y-2">
                                <div className="bg-muted p-4 rounded-full">
                                    <div className="h-8 w-8 border-2 border-current border-dashed rounded-full" />
                                </div>
                                <p className="text-sm">Cart is empty</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Totals Section */}
            <div className="p-4 bg-card border-t border-border space-y-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>Rs. {totals.subTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Tax (13%)</span>
                        <span>Rs. {totals.tax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end pt-2">
                        <span className="font-semibold text-base">Total Amount</span>
                        <span className="font-bold text-2xl text-primary font-heading">
                            Rs. {totals.total.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                    <Button
                        variant="outline"
                        className="flex flex-col gap-1 h-auto py-3 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400"
                        onClick={() => handleCheckout('CASH')}
                    >
                        <Banknote className="h-5 w-5" />
                        <span className="text-[10px] font-semibold">CASH</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex flex-col gap-1 h-auto py-3 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 dark:bg-sky-950/30 dark:border-sky-900 dark:text-sky-400"
                        onClick={() => handleCheckout('QR')}
                    >
                        <QrCode className="h-5 w-5" />
                        <span className="text-[10px] font-semibold">QR PAY</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex flex-col gap-1 h-auto py-3 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:bg-indigo-950/30 dark:border-indigo-900 dark:text-indigo-400"
                        onClick={() => handleCheckout('CARD')}
                    >
                        <CreditCard className="h-5 w-5" />
                        <span className="text-[10px] font-semibold">CARD</span>
                    </Button>

                    <Button
                        variant="default"
                        className="col-span-1 h-auto py-3 flex-col gap-1 bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        onClick={() => window.print()}
                    >
                        <Printer className="h-5 w-5" />
                        <span className="text-[10px] font-semibold">PRINT</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
