"use client"

import { useState, useEffect } from "react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Printer, Bluetooth, Usb, MonitorDot } from "lucide-react"
import { printer, PrinterType } from "@/lib/thermal-printer"
import { toast } from "sonner"

export function PrinterConnect() {
    const [connectedType, setConnectedType] = useState<PrinterType | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)

    // Check status on mount and when changed
    useEffect(() => {
        const checkStatus = () => {
            if (printer.isConnected()) {
                setConnectedType(printer.getConnectionType())
            } else {
                setConnectedType(null)
            }
        }
        
        checkStatus()
        // We could ideally poll or listen to events, but for now simple manual triggers updates it
    }, [])

    const handleConnect = async (type: PrinterType) => {
        setIsConnecting(true)
        try {
            if (type === "bluetooth") {
                await printer.connectBluetooth()
                setConnectedType("bluetooth")
                toast.success("Bluetooth Printer Connected!")
            } else if (type === "usb") {
                await printer.connectUSB()
                setConnectedType("usb")
                toast.success("USB Printer Connected!")
            } else if (type === "browser") {
                printer.useBrowser()
                setConnectedType("browser")
                toast.success("Browser Print Defaulted!")
            }
        } catch (error: any) {
            console.error("Printer connection error:", error)
            toast.error(error.message || "Failed to connect to printer")
            setConnectedType(null)
        } finally {
            setIsConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        try {
            await printer.disconnect()
            setConnectedType(null)
            toast.success("Printer disconnected")
        } catch (error) {
            console.error("Disconnect error:", error)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className={`h-7 rounded-full text-xs px-2.5 transition-colors ${
                        connectedType === 'bluetooth' || connectedType === 'usb' 
                            ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                            : 'bg-muted/50'
                    }`}
                >
                    <Printer className={`h-3 w-3 mr-1.5 ${isConnecting ? 'animate-pulse' : ''}`} />
                    {isConnecting ? "Connecting..." : connectedType ? `${connectedType.charAt(0).toUpperCase() + connectedType.slice(1)} Printer` : "No Printer"}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground flex items-center">
                    <Printer className="h-3 w-3 mr-2" />
                    Hardware Connections
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => handleConnect("bluetooth")} disabled={isConnecting}>
                    <Bluetooth className="h-4 w-4 mr-2 text-blue-500" />
                    <div className="flex flex-col">
                        <span>Bluetooth Thermal</span>
                        <span className="text-[10px] text-muted-foreground">Pair via Web Bluetooth</span>
                    </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleConnect("usb")} disabled={isConnecting}>
                    <Usb className="h-4 w-4 mr-2 text-indigo-500" />
                    <div className="flex flex-col">
                        <span>USB POS Printer</span>
                        <span className="text-[10px] text-muted-foreground">Requires USB Cable</span>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Software Fallback</DropdownMenuLabel>
                
                <DropdownMenuItem onClick={() => handleConnect("browser")}>
                    <MonitorDot className="h-4 w-4 mr-2" />
                    <div className="flex flex-col">
                        <span>Browser Print</span>
                        <span className="text-[10px] text-muted-foreground">Standard (Ctrl+P) Mode</span>
                    </div>
                </DropdownMenuItem>

                {connectedType && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDisconnect} className="text-red-500 focus:text-red-600">
                            Disconnect
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
