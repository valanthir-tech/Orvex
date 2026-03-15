"use client"

import { Card } from "@/components/ui/card"

interface ReceiptPreviewProps {
    storeName: string
    storeAddress: string
    storePhone: string
    receiptHeader: string
    receiptFooter: string
    receiptDisclaimer: string
    showDisclaimer: boolean
    showCashier: boolean
    currencySymbol: string
}

export function ReceiptPreview({
    storeName,
    storeAddress,
    storePhone,
    receiptHeader,
    receiptFooter,
    receiptDisclaimer,
    showDisclaimer,
    showCashier,
    currencySymbol,
}: ReceiptPreviewProps) {
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

    return (
        <Card className="bg-white border-2 border-dashed border-muted shadow-sm w-full max-w-[320px] mx-auto overflow-hidden text-black font-mono relative">
            {/* Top jagged edge for receipt effect */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAgMTBMNSAwTDEwIDEwWSIgZmlsbD0iI2Y4ZmFmYyIvPjwvc3ZnPg==')] opacity-20"></div>

            <div className="p-6 text-sm leading-tight">
                {/* Header */}
                <div className="text-center mb-4">
                    {receiptHeader && <div className="font-bold text-lg mb-1">{receiptHeader}</div>}
                    <div className="text-xs mb-2">(Not a Tax Invoice)</div>
                    <div className="border-b border-dashed border-black/30 my-2"></div>
                </div>

                {/* Store Info */}
                <div className="text-center mb-4">
                    <div className="font-bold">{storeName || "Your Store Name"}</div>
                    {storeAddress && <div>{storeAddress}</div>}
                    {storePhone && <div>Phone: {storePhone}</div>}
                    <div className="border-b border-dashed border-black/30 my-2 mt-3"></div>
                </div>

                {/* Order Meta */}
                <div className="mb-4 text-xs">
                    <div className="flex justify-between">
                        <span>Order #:</span>
                        <span>POS-123456</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{today}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{now}</span>
                    </div>
                    {showCashier && (
                        <div className="flex justify-between">
                            <span>Cashier:</span>
                            <span>Admin User</span>
                        </div>
                    )}
                    <div className="border-b border-dashed border-black/30 my-2 mt-3"></div>
                </div>

                {/* Items */}
                <div className="mb-4 text-xs">
                    <div className="font-bold mb-2">ITEMS PURCHASED:</div>
                    
                    <div className="mb-2">
                        <div>Premium Coffee Beans</div>
                        <div className="flex justify-between">
                            <span>  Qty: 2 @ {currencySymbol} 800</span>
                            <span>{currencySymbol} 1,600</span>
                        </div>
                    </div>
                    
                    <div className="mb-2">
                        <div>Ceramic Mug</div>
                        <div className="flex justify-between">
                            <span>  Qty: 1 @ {currencySymbol} 400</span>
                            <span>{currencySymbol} 400</span>
                        </div>
                    </div>

                    <div className="border-b border-dashed border-black/30 my-2 mt-3"></div>
                </div>

                {/* Totals */}
                <div className="mb-4 text-xs">
                    <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{currencySymbol} 2,000</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>{currencySymbol} 0</span>
                    </div>
                    <div className="border-b border-dashed border-black/30 my-2"></div>
                    <div className="flex justify-between font-bold text-sm">
                        <span>Amount Paid:</span>
                        <span>{currencySymbol} 2,000</span>
                    </div>
                    <div className="flex justify-between mt-1">
                        <span>Payment Mode:</span>
                        <span>CASH</span>
                    </div>
                    <div className="border-b border-dashed border-black/30 my-2 mt-3"></div>
                </div>

                {/* Footers & Disclaimer */}
                <div className="text-center text-xs space-y-3 mt-4">
                    {receiptFooter && (
                        <div className="whitespace-pre-wrap">{receiptFooter}</div>
                    )}
                    {showDisclaimer && receiptDisclaimer && (
                        <div className="text-[10px] italic whitespace-pre-wrap border-t border-black/10 pt-2">
                            {receiptDisclaimer}
                        </div>
                    )}
                    <div className="font-bold pt-2">Thank you for shopping!</div>
                </div>
            </div>
            
            {/* Bottom shadow for realism */}
            <div className="h-4 bg-gradient-to-t from-black/5 to-transparent absolute bottom-0 left-0 right-0"></div>
        </Card>
    )
}
