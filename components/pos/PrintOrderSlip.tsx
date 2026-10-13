"use client"

import { useState } from "react"
import { Printer, Bluetooth, Usb, Monitor, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { printer, type OrderSlipData, type PrinterType } from "@/lib/thermal-printer"

interface PrintOrderSlipProps {
    data: OrderSlipData
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PrintOrderSlipDialog({
    data,
    open,
    onOpenChange,
}: PrintOrderSlipProps) {
    const [isPrinting, setIsPrinting] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState<PrinterType | null>(
        printer.getConnectionType()
    )

    async function handlePrint(method: PrinterType) {
        setIsPrinting(true)
        setSelectedMethod(method)

        try {
            if (method === "bluetooth") {
                if (!printer.isConnected() || printer.getConnectionType() !== "bluetooth") {
                    await printer.connectBluetooth()
                }
            } else if (method === "usb") {
                if (!printer.isConnected() || printer.getConnectionType() !== "usb") {
                    await printer.connectUSB()
                }
            } else {
                printer.useBrowser()
            }

            await printer.printOrderSlip(data)
            toast.success("Order slip printed successfully")
            onOpenChange(false)
        } catch (error) {
            const msg =
                error instanceof Error ? error.message : "Print failed"
            toast.error(msg)
        } finally {
            setIsPrinting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-2xl border-0 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                    <DialogTitle className="text-xl font-heading">
                        Print Order Slip
                    </DialogTitle>
                    <DialogDescription>
                        Choose how to print the order slip
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-6 space-y-3">
                    <Button
                        variant="outline"
                        className="w-full h-14 rounded-xl justify-start gap-4"
                        onClick={() => handlePrint("bluetooth")}
                        disabled={isPrinting}
                    >
                        {isPrinting && selectedMethod === "bluetooth" ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Bluetooth className="h-5 w-5 text-blue-500" />
                        )}
                        <div className="text-left">
                            <p className="font-medium text-sm">Bluetooth Printer</p>
                            <p className="text-xs text-muted-foreground">
                                Connect via Web Bluetooth
                            </p>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-14 rounded-xl justify-start gap-4"
                        onClick={() => handlePrint("usb")}
                        disabled={isPrinting}
                    >
                        {isPrinting && selectedMethod === "usb" ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Usb className="h-5 w-5 text-emerald-500" />
                        )}
                        <div className="text-left">
                            <p className="font-medium text-sm">USB Printer</p>
                            <p className="text-xs text-muted-foreground">
                                Connect via WebUSB
                            </p>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-14 rounded-xl justify-start gap-4"
                        onClick={() => handlePrint("browser")}
                        disabled={isPrinting}
                    >
                        {isPrinting && selectedMethod === "browser" ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Monitor className="h-5 w-5 text-violet-500" />
                        )}
                        <div className="text-left">
                            <p className="font-medium text-sm">Browser Print</p>
                            <p className="text-xs text-muted-foreground">
                                Print using browser dialog
                            </p>
                        </div>
                    </Button>
                </div>

                {/* Preview */}
                <div className="px-6 pb-6">
                    <div className="bg-muted/50 rounded-xl p-4 max-h-64 overflow-y-auto">
                        <div className="font-mono text-[10px] leading-relaxed text-center space-y-0.5">
                            <p className="font-bold text-sm">ORDER SLIP</p>
                            <p className="text-muted-foreground text-[9px]">
                                (Not a Tax Invoice)
                            </p>
                            <p>{"─".repeat(32)}</p>
                            <p className="font-semibold">{data.storeName}</p>
                            {data.storeAddress && <p>{data.storeAddress}</p>}
                            {data.storePhone && (
                                <p>Phone: {data.storePhone}</p>
                            )}
                            <p>{"─".repeat(32)}</p>
                            <div className="text-left">
                                <p>
                                    Order #: {data.orderNumber}
                                </p>
                                <p>
                                    Date: {data.date} | {data.time}
                                </p>
                                {data.cashierName && (
                                    <p>Cashier: {data.cashierName}</p>
                                )}
                            </div>
                            <p>{"─".repeat(32)}</p>
                            <div className="text-left">
                                {data.products.map((product, i) => (
                                    <div key={i}>
                                        <p>{product.name}</p>
                                        <p className="flex justify-between">
                                            <span>
                                                &nbsp;&nbsp;{product.qty} x Rs.{" "}
                                                {product.rate.toLocaleString()}
                                            </span>
                                            <span>
                                                Rs.{" "}
                                                {product.amount.toLocaleString()}
                                            </span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <p>{"─".repeat(32)}</p>
                            <div className="text-left">
                                <p className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>
                                        Rs.{" "}
                                        {data.subtotal.toLocaleString()}
                                    </span>
                                </p>
                                {data.discount > 0 && (
                                    <p className="flex justify-between">
                                        <span>Discount:</span>
                                        <span>
                                            Rs.{" "}
                                            {data.discount.toLocaleString()}
                                        </span>
                                    </p>
                                )}
                                <p className="flex justify-between font-bold">
                                    <span>Amount Paid:</span>
                                    <span>
                                        Rs.{" "}
                                        {data.amountPaid.toLocaleString()}
                                    </span>
                                </p>
                                <p>Payment: {data.paymentMode}</p>
                            </div>
                            <p>{"─".repeat(32)}</p>
                            <p className="text-muted-foreground text-[8px] mt-2">
                                {data.disclaimer ||
                                    "This order slip is for your purchase record only."}
                            </p>
                            <p className="text-[8px] mt-1">
                                Powered by Onedexo
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
