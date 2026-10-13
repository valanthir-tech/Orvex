/**
 * Thermal Printer Library for ESC/POS printers
 * Supports Web Bluetooth and WebUSB APIs for browser-based printing.
 */

// ESC/POS command constants
const ESC = 0x1b
const GS = 0x1d
const LF = 0x0a

const CMD = {
    // Initialization
    INIT: new Uint8Array([ESC, 0x40]),
    // Text alignment
    ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]),
    ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]),
    ALIGN_RIGHT: new Uint8Array([ESC, 0x61, 0x02]),
    // Text style
    BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]),
    BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]),
    DOUBLE_HEIGHT_ON: new Uint8Array([ESC, 0x21, 0x10]),
    DOUBLE_WIDTH_ON: new Uint8Array([ESC, 0x21, 0x20]),
    DOUBLE_SIZE_ON: new Uint8Array([ESC, 0x21, 0x30]),
    NORMAL_SIZE: new Uint8Array([ESC, 0x21, 0x00]),
    UNDERLINE_ON: new Uint8Array([ESC, 0x2d, 0x01]),
    UNDERLINE_OFF: new Uint8Array([ESC, 0x2d, 0x00]),
    // Feed and cut
    FEED_LINE: new Uint8Array([LF]),
    FEED_3: new Uint8Array([ESC, 0x64, 0x03]),
    FEED_5: new Uint8Array([ESC, 0x64, 0x05]),
    CUT_PAPER: new Uint8Array([GS, 0x56, 0x00]),
    CUT_PAPER_PARTIAL: new Uint8Array([GS, 0x56, 0x01]),
    // Line spacing
    LINE_SPACING_DEFAULT: new Uint8Array([ESC, 0x32]),
    LINE_SPACING_SET: (n: number) => new Uint8Array([ESC, 0x33, n]),
}

const CHARS_PER_LINE = 32 // Standard 58mm thermal printer

// ─── Text Encoder ────────────────────────────────────────────────────────────

function textToBytes(text: string): Uint8Array {
    const encoder = new TextEncoder()
    return encoder.encode(text)
}

function concat(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const arr of arrays) {
        result.set(arr, offset)
        offset += arr.length
    }
    return result
}

// ─── Receipt Builder ─────────────────────────────────────────────────────────

export class ReceiptBuilder {
    private parts: Uint8Array[] = []

    constructor() {
        this.parts.push(CMD.INIT)
        this.parts.push(CMD.LINE_SPACING_DEFAULT)
    }

    center(): this {
        this.parts.push(CMD.ALIGN_CENTER)
        return this
    }

    left(): this {
        this.parts.push(CMD.ALIGN_LEFT)
        return this
    }

    right(): this {
        this.parts.push(CMD.ALIGN_RIGHT)
        return this
    }

    bold(on = true): this {
        this.parts.push(on ? CMD.BOLD_ON : CMD.BOLD_OFF)
        return this
    }

    doubleSize(on = true): this {
        this.parts.push(on ? CMD.DOUBLE_SIZE_ON : CMD.NORMAL_SIZE)
        return this
    }

    doubleHeight(on = true): this {
        this.parts.push(on ? CMD.DOUBLE_HEIGHT_ON : CMD.NORMAL_SIZE)
        return this
    }

    text(str: string): this {
        this.parts.push(textToBytes(str))
        return this
    }

    line(str: string): this {
        this.parts.push(textToBytes(str))
        this.parts.push(CMD.FEED_LINE)
        return this
    }

    /** Print text left-justified with value right-justified on same line */
    leftRight(leftText: string, rightText: string): this {
        const spaces = CHARS_PER_LINE - leftText.length - rightText.length
        const padding = spaces > 0 ? " ".repeat(spaces) : " "
        this.parts.push(CMD.ALIGN_LEFT)
        this.parts.push(textToBytes(leftText + padding + rightText))
        this.parts.push(CMD.FEED_LINE)
        return this
    }

    separator(char = "-"): this {
        this.parts.push(CMD.ALIGN_CENTER)
        this.parts.push(textToBytes(char.repeat(CHARS_PER_LINE)))
        this.parts.push(CMD.FEED_LINE)
        return this
    }

    emptyLine(): this {
        this.parts.push(CMD.FEED_LINE)
        return this
    }

    feed(lines = 3): this {
        this.parts.push(
            lines === 3
                ? CMD.FEED_3
                : lines === 5
                  ? CMD.FEED_5
                  : new Uint8Array([ESC, 0x64, lines])
        )
        return this
    }

    cut(): this {
        this.parts.push(CMD.CUT_PAPER_PARTIAL)
        return this
    }

    build(): Uint8Array {
        return concat(...this.parts)
    }
}

// ─── Order Slip Types ────────────────────────────────────────────────────────

export interface OrderSlipItem {
    name: string
    qty: number
    rate: number
    amount: number
}

export interface OrderSlipData {
    storeName: string
    storeAddress?: string
    storePhone?: string
    orderNumber: string
    date: string
    time: string
    cashierName?: string
    products: OrderSlipItem[]
    subtotal: number
    discount: number
    amountPaid: number
    paymentMode: string
    change?: number
    receiptHeader?: string
    receiptFooter?: string
    disclaimer?: string
}

// ─── Build Order Slip Receipt ────────────────────────────────────────────────

export function buildOrderSlip(data: OrderSlipData): Uint8Array {
    const r = new ReceiptBuilder()

    // Header
    r.center()
    if (data.receiptHeader) {
        r.line(data.receiptHeader)
    }
    r.bold().doubleSize().line("ORDER SLIP").doubleSize(false).bold(false)
    r.line("(Not a Tax Invoice)")
    r.separator()

    // Store info
    r.center()
    r.bold().line(data.storeName).bold(false)
    if (data.storeAddress) r.line(data.storeAddress)
    if (data.storePhone) r.line(`Phone: ${data.storePhone}`)
    r.separator()

    // Order details
    r.left()
    r.leftRight("Order #:", data.orderNumber)
    r.leftRight("Date:", data.date)
    r.leftRight("Time:", data.time)
    if (data.cashierName) {
        r.leftRight("Cashier:", data.cashierName)
    }
    r.separator()

    // Items
    r.left()
    r.bold().line("ITEMS PURCHASED:").bold(false)
    r.emptyLine()

    for (const product of data.products) {
        r.line(product.name)
        r.leftRight(
            `  Qty: ${product.qty} @ Rs. ${product.rate.toLocaleString()}`,
            `Rs. ${product.amount.toLocaleString()}`
        )
    }

    r.separator()

    // Totals
    r.leftRight("Subtotal:", `Rs. ${data.subtotal.toLocaleString()}`)
    if (data.discount > 0) {
        r.leftRight("Discount:", `Rs. ${data.discount.toLocaleString()}`)
    }
    r.separator()
    r.bold()
    r.leftRight(
        "Amount Paid:",
        `Rs. ${data.amountPaid.toLocaleString()}`
    )
    r.bold(false)

    if (data.change && data.change > 0) {
        r.leftRight("Change:", `Rs. ${data.change.toLocaleString()}`)
    }

    r.emptyLine()
    r.leftRight("Payment Mode:", data.paymentMode)
    r.separator()

    // Disclaimer
    r.center()
    r.emptyLine()
    const disc =
        data.disclaimer ||
        "This order slip is for your purchase record only. For tax invoice or warranty claims, please request from accounts."
    // Word-wrap disclaimer to fit receipt width
    const words = disc.split(" ")
    let currentLine = ""
    for (const word of words) {
        if ((currentLine + " " + word).trim().length > CHARS_PER_LINE) {
            r.line(currentLine.trim())
            currentLine = word
        } else {
            currentLine = currentLine ? currentLine + " " + word : word
        }
    }
    if (currentLine.trim()) {
        r.line(currentLine.trim())
    }

    r.emptyLine()

    // Footer
    if (data.receiptFooter) {
        r.line(data.receiptFooter)
    }
    r.line("Powered by Onedexo")
    r.feed(5)
    r.cut()

    return r.build()
}

// ─── Printer Connections ─────────────────────────────────────────────────────

export type PrinterType = "bluetooth" | "usb" | "browser"

interface PrinterConnection {
    type: PrinterType
    print(data: Uint8Array): Promise<void>
    disconnect(): Promise<void>
    isConnected(): boolean
}

// Web Bluetooth connection
class BluetoothPrinterConnection implements PrinterConnection {
    type: PrinterType = "bluetooth"
    private device: BluetoothDevice | null = null
    private characteristic: BluetoothRemoteGATTCharacteristic | null = null

    async connect(): Promise<void> {
        if (!navigator.bluetooth) {
            throw new Error("Web Bluetooth is not supported in this browser")
        }

        this.device = await navigator.bluetooth.requestDevice({
            // Common thermal printer services
            filters: [
                { services: ["000018f0-0000-1000-8000-00805f9b34fb"] },
            ],
            optionalServices: [
                "000018f0-0000-1000-8000-00805f9b34fb",
                "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
            ],
        })

        if (!this.device.gatt) {
            throw new Error("Bluetooth GATT not available")
        }

        const server = await this.device.gatt.connect()

        // Try common thermal printer service UUIDs
        const serviceUUIDs = [
            "000018f0-0000-1000-8000-00805f9b34fb",
            "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        ]

        for (const uuid of serviceUUIDs) {
            try {
                const service = await server.getPrimaryService(uuid)
                const characteristics = await service.getCharacteristics()
                // Find a writable characteristic
                for (const char of characteristics) {
                    if (
                        char.properties.write ||
                        char.properties.writeWithoutResponse
                    ) {
                        this.characteristic = char
                        return
                    }
                }
            } catch {
                // Try next service
            }
        }

        throw new Error("No writable characteristic found on printer")
    }

    async print(data: Uint8Array): Promise<void> {
        if (!this.characteristic) {
            throw new Error("Not connected to printer")
        }

        // Send in chunks (BLE max is typically 512 bytes, but many printers limit to 20)
        const CHUNK_SIZE = 100
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE)
            if (this.characteristic.properties.writeWithoutResponse) {
                await this.characteristic.writeValueWithoutResponse(chunk)
            } else {
                await this.characteristic.writeValue(chunk)
            }
            // Small delay between chunks
            await new Promise((resolve) => setTimeout(resolve, 50))
        }
    }

    async disconnect(): Promise<void> {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect()
        }
        this.device = null
        this.characteristic = null
    }

    isConnected(): boolean {
        return !!this.device?.gatt?.connected
    }
}

// WebUSB connection
class USBPrinterConnection implements PrinterConnection {
    type: PrinterType = "usb"
    private device: USBDevice | null = null
    private endpointNumber = 0

    async connect(): Promise<void> {
        if (!navigator.usb) {
            throw new Error("WebUSB is not supported in this browser")
        }

        this.device = await navigator.usb.requestDevice({
            filters: [], // Show all USB devices, user must select the printer
        })

        await this.device.open()

        // Select configuration
        if (this.device.configuration === null) {
            await this.device.selectConfiguration(1)
        }

        // Claim interface
        const iface = this.device.configuration?.interfaces[0]
        if (iface) {
            await this.device.claimInterface(iface.interfaceNumber)

            // Find OUT endpoint
            const endpoint = iface.alternate.endpoints.find(
                (ep) => ep.direction === "out"
            )
            if (endpoint) {
                this.endpointNumber = endpoint.endpointNumber
            }
        }
    }

    async print(data: Uint8Array): Promise<void> {
        if (!this.device) {
            throw new Error("Not connected to printer")
        }

        // Send in chunks
        const CHUNK_SIZE = 512
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            const chunk = data.slice(i, i + CHUNK_SIZE)
            await this.device.transferOut(this.endpointNumber, chunk)
        }
    }

    async disconnect(): Promise<void> {
        if (this.device) {
            await this.device.close()
        }
        this.device = null
    }

    isConnected(): boolean {
        return !!this.device?.opened
    }
}

// Browser print fallback (window.print with formatted receipt)
class BrowserPrintConnection implements PrinterConnection {
    type: PrinterType = "browser"

    async print(data: Uint8Array): Promise<void> {
        // Decode ESC/POS to plain text for browser printing
        // This is a simplified decoder - strips ESC/POS commands
        const text = new TextDecoder().decode(data)
        const cleanText = text.replace(
            // eslint-disable-next-line no-control-regex
            /[\x00-\x09\x0b-\x0c\x0e-\x1f]/g,
            ""
        )

        const printWindow = window.open("", "_blank", "width=300,height=600")
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Order Slip</title>
                    <style>
                        body {
                            font-family: 'Courier New', monospace;
                            font-size: 12px;
                            width: 280px;
                            margin: 0 auto;
                            padding: 10px;
                            white-space: pre-wrap;
                            word-wrap: break-word;
                        }
                        @media print {
                            body { margin: 0; padding: 5px; }
                        }
                    </style>
                </head>
                <body>${cleanText.replace(/\n/g, "<br>")}</body>
                </html>
            `)
            printWindow.document.close()
            printWindow.focus()
            printWindow.print()
            printWindow.close()
        }
    }

    async disconnect(): Promise<void> {
        // No-op for browser print
    }

    isConnected(): boolean {
        return true // Always available
    }
}

// ─── Printer Manager (Singleton) ─────────────────────────────────────────────

class PrinterManager {
    private connection: PrinterConnection | null = null

    async connectBluetooth(): Promise<void> {
        await this.disconnect()
        const bt = new BluetoothPrinterConnection()
        await bt.connect()
        this.connection = bt
    }

    async connectUSB(): Promise<void> {
        await this.disconnect()
        const usb = new USBPrinterConnection()
        await usb.connect()
        this.connection = usb
    }

    useBrowser(): void {
        this.connection = new BrowserPrintConnection()
    }

    async print(data: Uint8Array): Promise<void> {
        if (!this.connection) {
            // Fallback to browser print
            this.useBrowser()
        }
        await this.connection!.print(data)
    }

    async printOrderSlip(data: OrderSlipData): Promise<void> {
        const receipt = buildOrderSlip(data)
        await this.print(receipt)
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.disconnect()
            this.connection = null
        }
    }

    isConnected(): boolean {
        return !!this.connection?.isConnected()
    }

    getConnectionType(): PrinterType | null {
        return this.connection?.type ?? null
    }
}

// Export singleton instance
export const printer = new PrinterManager()
