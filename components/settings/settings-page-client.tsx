"use client"

import { useState } from "react"
import {
    Store,
    CreditCard,
    Bell,
    Shield,
    LogOut,
    Moon,
    Sun,
    Loader2,
    ChevronRight,
    User,
    Palette,
    Globe,
    Receipt,
} from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { badgeStyles } from "@/lib/theme"

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsPageClient() {
    const { theme, setTheme } = useTheme()
    const [isSaving, setIsSaving] = useState(false)

    // Store settings (mock state)
    const [storeName, setStoreName] = useState("Valanthir Store")
    const [currency, setCurrency] = useState("LKR")
    const [taxRate, setTaxRate] = useState("0")
    const [receiptFooter, setReceiptFooter] = useState("Thank you for shopping!")

    // Feature flags
    const [enableNotifications, setEnableNotifications] = useState(true)
    const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(true)
    const [enableDailySummary, setEnableDailySummary] = useState(false)
    const [enableOfflineMode, setEnableOfflineMode] = useState(true)

    async function handleSave() {
        setIsSaving(true)
        await new Promise((resolve) => setTimeout(resolve, 500))
        setIsSaving(false)
        toast.success("Settings saved successfully")
    }

    function handleLogout() {
        toast.success("Logged out successfully")
        // In real app: router.push("/login")
    }

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold font-heading tracking-tight">
                    Settings
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage your store preferences and account
                </p>
            </div>

            {/* Account Section */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-xl font-bold text-primary">
                                VA
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">Valanthir Admin</p>
                            <p className="text-sm text-muted-foreground">
                                admin@valanthir.com
                            </p>
                        </div>
                        <Badge className={`${badgeStyles.success} text-xs`}>
                            Super Admin
                        </Badge>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">
                                Subscription Plan
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Current billing cycle: Jan 1 - Jan 31
                            </p>
                        </div>
                        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-xs">
                            Pro Plan
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Store Settings */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        Store Settings
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="storeName">Store Name</Label>
                        <Input
                            id="storeName"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            className="h-11"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select value={currency} onValueChange={setCurrency}>
                                <SelectTrigger className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LKR">
                                        LKR (Rs.)
                                    </SelectItem>
                                    <SelectItem value="USD">
                                        USD ($)
                                    </SelectItem>
                                    <SelectItem value="EUR">
                                        EUR (&euro;)
                                    </SelectItem>
                                    <SelectItem value="INR">
                                        INR (&#8377;)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tax Rate (%)</Label>
                            <Input
                                type="number"
                                value={taxRate}
                                onChange={(e) => setTaxRate(e.target.value)}
                                className="h-11"
                                min={0}
                                max={100}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Receipt Footer Message</Label>
                        <Input
                            value={receiptFooter}
                            onChange={(e) => setReceiptFooter(e.target.value)}
                            className="h-11"
                            placeholder="Message printed at bottom of receipts"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        Appearance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {theme === "dark" ? (
                                <Moon className="h-5 w-5 text-muted-foreground" />
                            ) : (
                                <Sun className="h-5 w-5 text-amber-500" />
                            )}
                            <div>
                                <p className="text-sm font-medium">Dark Mode</p>
                                <p className="text-xs text-muted-foreground">
                                    Switch between light and dark themes
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={theme === "dark"}
                            onCheckedChange={(checked) =>
                                setTheme(checked ? "dark" : "light")
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        Notifications & Alerts
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">
                                Push Notifications
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Receive browser notifications
                            </p>
                        </div>
                        <Switch
                            checked={enableNotifications}
                            onCheckedChange={setEnableNotifications}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">
                                Low Stock Alerts
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Get notified when stock drops below minimum
                            </p>
                        </div>
                        <Switch
                            checked={enableLowStockAlerts}
                            onCheckedChange={setEnableLowStockAlerts}
                        />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">
                                Daily Sales Summary
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Receive end-of-day sales report
                            </p>
                        </div>
                        <Switch
                            checked={enableDailySummary}
                            onCheckedChange={setEnableDailySummary}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Advanced */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        Advanced
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Offline Mode</p>
                            <p className="text-xs text-muted-foreground">
                                Enable offline data caching for POS
                            </p>
                        </div>
                        <Switch
                            checked={enableOfflineMode}
                            onCheckedChange={setEnableOfflineMode}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pb-20 lg:pb-6">
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn-pill h-11 flex-1 shadow-lg shadow-primary/20"
                >
                    {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Settings
                </Button>
                <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="rounded-xl h-11 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    )
}
