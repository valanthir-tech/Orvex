"use client"

import { useState, useEffect } from "react"
import {
    Store,
    CreditCard,
    Bell,
    Shield,
    LogOut,
    Loader2,
    User,
    Receipt,
    MapPin,
    Phone,
    Mail,
    Key,
    Copy,
    Trash2,
    Plus,
    Eye,
    EyeOff,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { badgeStyles } from "@/lib/theme"
import { getSettings, updateSettings } from "@/app/actions/settings"
import { listApiKeys, createApiKey, revokeApiKey, type ApiKeyRecord } from "@/app/actions/api-keys"
import { ReceiptPreview } from "./receipt-preview"
import { StaffSettingsCard } from "./staff-settings-card"
import { TerminalRegistrationCard } from "./terminal-registration-card"

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsPageClient() {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Store settings (loaded from backend)
    const [storeName, setStoreName] = useState("")
    const [storeAddress, setStoreAddress] = useState("")
    const [storePhone, setStorePhone] = useState("")
    const [storeEmail, setStoreEmail] = useState("")
    const [panNumber, setPanNumber] = useState("")
    const [currency, setCurrency] = useState("NPR")
    const [currencySymbol, setCurrencySymbol] = useState("Rs.")
    const [taxRate, setTaxRate] = useState("13")
    const [taxLabel, setTaxLabel] = useState("VAT")
    const [receiptHeader, setReceiptHeader] = useState("ORDER SLIP")
    const [receiptFooter, setReceiptFooter] = useState("")
    const [receiptDisclaimer, setReceiptDisclaimer] = useState("")
    const [receiptShowDisclaimer, setReceiptShowDisclaimer] = useState(true)
    const [receiptShowCashier, setReceiptShowCashier] = useState(true)
    const [lowStockThreshold, setLowStockThreshold] = useState("10")

    // Feature flags
    const [enableNotifications, setEnableNotifications] = useState(true)
    const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(true)
    const [enableDailySummary, setEnableDailySummary] = useState(false)
    const [enableOfflineMode, setEnableOfflineMode] = useState(true)

    // API keys
    const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([])
    const [newKeyName, setNewKeyName] = useState("")
    const [isCreatingKey, setIsCreatingKey] = useState(false)
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
    const [showNewKey, setShowNewKey] = useState(false)
    const [userRole, setUserRole] = useState("admin")
    const [forceOverride, setForceOverride] = useState(false)

    // User account info
    const [userName, setUserName] = useState("")
    const [userEmail, setUserEmail] = useState("")

    // Load user + settings from backend
    useEffect(() => {
        async function loadUser() {
            const supabase = createSupabaseBrowserClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserEmail(user.email || "")
                const meta = user.user_metadata || {}
                const name = [meta.first_name, meta.last_name].filter(Boolean).join(" ")
                setUserName(name || user.email?.split("@")[0] || "User")
            }
        }
        loadUser()
        async function loadSettings() {
            try {
                const settings = await getSettings()
                if (settings) {
                    setStoreName(settings.store_name || "")
                    setStoreAddress(settings.store_address || "")
                    setStorePhone(settings.store_phone || "")
                    setStoreEmail(settings.store_email || "")
                    setPanNumber(settings.pan_number || "")
                    setCurrency(settings.currency || "NPR")
                    setCurrencySymbol(settings.currency_symbol || "Rs.")
                    setTaxRate(String(settings.tax_rate || 13))
                    setTaxLabel(settings.tax_label || "VAT")
                    setReceiptHeader(settings.receipt_header || "ORDER SLIP")
                    setReceiptFooter(settings.receipt_footer || "")
                    setReceiptDisclaimer(settings.receipt_disclaimer || "")
                    setReceiptShowDisclaimer(settings.receipt_show_disclaimer)
                    setReceiptShowCashier(settings.receipt_show_cashier)
                    setLowStockThreshold(String(settings.low_stock_threshold || 10))
                    setEnableNotifications(settings.enable_notifications)
                    setEnableLowStockAlerts(settings.enable_low_stock_alerts)
                    setEnableDailySummary(settings.enable_daily_summary)
                    setEnableOfflineMode(settings.enable_offline_mode)
                }
            } catch {
                toast.error("Failed to load settings")
            } finally {
                setIsLoading(false)
            }
        }
        loadSettings()
    }, [])

    async function loadApiKeys() {
        const result = await listApiKeys()
        if (result.error) {
            console.error(result.error)
        } else {
            setApiKeys(result.keys)
            if (result.role) {
                setUserRole(result.role)
            }
        }
    }

    async function handleCreateKey() {
        if (!newKeyName.trim()) {
            toast.error("Enter a name for the API key")
            return
        }
        setIsCreatingKey(true)
        try {
            const result = await createApiKey(newKeyName, forceOverride)
            if (result.error) {
                toast.error(result.error)
            } else if (result.key) {
                setNewlyCreatedKey(result.key)
                setShowNewKey(true)
                setNewKeyName("")
                setForceOverride(false) // reset override
                await loadApiKeys()
                toast.success("API key created! Copy it now — it won't be shown again.")
            }
        } catch {
            toast.error("Failed to create API key")
        }
        setIsCreatingKey(false)
    }

    async function handleRevokeKey(keyId: string) {
        // Double confirm if not overriding
        if (!forceOverride) {
            if (!confirm("Are you sure you want to revoke this key? Custom storefronts relying on this will break.")) return;
        }

        const result = await revokeApiKey(keyId, forceOverride)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success("API key revoked")
            await loadApiKeys()
        }
    }

    function handleCopyKey(key: string) {
        navigator.clipboard.writeText(key)
        toast.success("Copied to clipboard")
    }

    async function handleSave() {
        setIsSaving(true)
        try {
            const result = await updateSettings({
                store_name: storeName,
                store_address: storeAddress,
                store_phone: storePhone,
                store_email: storeEmail,
                pan_number: panNumber,
                currency,
                currency_symbol: currencySymbol,
                tax_rate: parseFloat(taxRate) || 13,
                tax_label: taxLabel,
                receipt_header: receiptHeader,
                receipt_footer: receiptFooter,
                receipt_disclaimer: receiptDisclaimer,
                receipt_show_disclaimer: receiptShowDisclaimer,
                receipt_show_cashier: receiptShowCashier,
                low_stock_threshold: parseInt(lowStockThreshold) || 10,
                enable_notifications: enableNotifications,
                enable_low_stock_alerts: enableLowStockAlerts,
                enable_daily_summary: enableDailySummary,
                enable_offline_mode: enableOfflineMode,
            })
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Settings saved successfully")
            }
        } catch {
            toast.error("Failed to save settings")
        }
        setIsSaving(false)
    }

    async function handleLogout() {
        document.cookie = "onedexo_demo_session=; path=/; max-age=0;"
        try {
            const supabase = createSupabaseBrowserClient()
            await supabase.auth.signOut()
        } catch {
            // Ignore client signout error
        }

        // Hard redirect to fully clear in-memory auth state
        window.location.href = "/login"
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold font-heading tracking-tight">
                    Settings
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Manage your store preferences and account
                </p>
            </div>

            {/* Team & Staff Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StaffSettingsCard />
                <TerminalRegistrationCard />
            </div>

            {/* Row 1: Account + Store Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                                {userName ? userName.slice(0, 2).toUpperCase() : "?"}
                            </span>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{userName || "Loading..."}</p>
                            <p className="text-sm text-muted-foreground">
                                {userEmail}
                            </p>
                        </div>
                        <Badge className={`${badgeStyles.info} text-xs`}>
                            {userRole === "superadmin" ? "Super Admin" : userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Store Settings */}
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Store className="h-4 w-4 text-muted-foreground" />
                        Store Information
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
                            placeholder="Your store name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>
                            <MapPin className="h-3 w-3 inline mr-1" />
                            Address
                        </Label>
                        <Input
                            value={storeAddress}
                            onChange={(e) => setStoreAddress(e.target.value)}
                            className="h-11"
                            placeholder="Store address (Kathmandu, Nepal)"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>
                                <Phone className="h-3 w-3 inline mr-1" />
                                Phone
                            </Label>
                            <Input
                                value={storePhone}
                                onChange={(e) => setStorePhone(e.target.value)}
                                className="h-11"
                                placeholder="9841234567"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>
                                <Mail className="h-3 w-3 inline mr-1" />
                                Email
                            </Label>
                            <Input
                                value={storeEmail}
                                onChange={(e) => setStoreEmail(e.target.value)}
                                className="h-11"
                                placeholder="store@example.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>PAN Number</Label>
                        <Input
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value)}
                            className="h-11"
                            placeholder="Your PAN number (for records only)"
                        />
                    </div>
                </CardContent>
            </Card>

            </div>{/* end row 1 */}

            {/* Row 2: Tax & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Tax & Currency */}
            <Card className="card-float border-0 rounded-2xl md:col-span-1">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        Tax & Currency
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Currency</Label>
                            <Select
                                value={currency}
                                onValueChange={(val) => {
                                    setCurrency(val)
                                    const symbols: Record<string, string> = { NPR: "Rs.", USD: "$", INR: "\u20B9" }
                                    setCurrencySymbol(symbols[val] || val)
                                }}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NPR">NPR (Rs.)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="INR">INR (&#8377;)</SelectItem>
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
                        <Label>Tax Label</Label>
                        <Input
                            value={taxLabel}
                            onChange={(e) => setTaxLabel(e.target.value)}
                            className="h-11"
                            placeholder="VAT"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Low Stock Alert Threshold</Label>
                        <Input
                            type="number"
                            value={lowStockThreshold}
                            onChange={(e) => setLowStockThreshold(e.target.value)}
                            className="h-11"
                            min={0}
                        />
                        <p className="text-xs text-muted-foreground">Items below this quantity will show alerts</p>
                    </div>
                </CardContent>
            </Card>

            {/* Receipt Customization - Spans Full Width for Designer View */}
            <Card className="card-float border-0 rounded-2xl md:col-span-2">
                <CardHeader className="pb-3 border-b border-border/50 mb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                        Order Slip / Receipt Designer
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left side: Inputs */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label>Receipt Title</Label>
                            <Input
                                value={receiptHeader}
                                onChange={(e) => setReceiptHeader(e.target.value)}
                                className="h-11"
                                placeholder="ORDER SLIP"
                            />
                            <p className="text-xs text-muted-foreground">Displayed at the top of every receipt</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Receipt Footer Message</Label>
                            <Textarea
                                value={receiptFooter}
                                onChange={(e) => setReceiptFooter(e.target.value)}
                                placeholder="This is an order slip for record-keeping only..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Disclaimer Text</Label>
                            <Textarea
                                value={receiptDisclaimer}
                                onChange={(e) => setReceiptDisclaimer(e.target.value)}
                                placeholder="This order slip is for your purchase record only..."
                                rows={3}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Show Disclaimer</p>
                                <p className="text-xs text-muted-foreground">Display disclaimer on every receipt</p>
                            </div>
                            <Switch checked={receiptShowDisclaimer} onCheckedChange={setReceiptShowDisclaimer} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Show Cashier Name</p>
                                <p className="text-xs text-muted-foreground">Print cashier name on receipt</p>
                            </div>
                            <Switch checked={receiptShowCashier} onCheckedChange={setReceiptShowCashier} />
                        </div>
                    </div>

                    {/* Right side: Live Preview */}
                    <div className="flex flex-col items-center justify-center bg-muted/30 rounded-xl p-6 border border-dashed">
                        <p className="text-sm font-medium text-muted-foreground mb-4">Live Preview (80mm Thermal)</p>
                        <ReceiptPreview 
                            storeName={storeName}
                            storeAddress={storeAddress}
                            storePhone={storePhone}
                            receiptHeader={receiptHeader}
                            receiptFooter={receiptFooter}
                            receiptDisclaimer={receiptDisclaimer}
                            showDisclaimer={receiptShowDisclaimer}
                            showCashier={receiptShowCashier}
                            currencySymbol={currencySymbol}
                        />
                    </div>
                </CardContent>
            </Card>

            </div>{/* end row 2 */}

            {/* Row 3: Notifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Notifications */}
            <Card id="notifications" className="card-float border-0 rounded-2xl scroll-mt-24">
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

            </div>{/* end row 3 */}

            {/* Row 4: Advanced + Admin Portal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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

            {/* API Keys (for Storefront Integration) */}
            {false && (
            <Card className="card-float border-0 rounded-2xl">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        API Keys
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Manage API keys for custom storefront integrations
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Create new key */}
                    {userRole === 'superadmin' && (
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Key name (e.g. Production, Staging)"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="rounded-xl"
                                    onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                                />
                                <Button
                                    onClick={handleCreateKey}
                                    disabled={isCreatingKey}
                                    size="sm"
                                    className="btn-pill shrink-0"
                                >
                                    {isCreatingKey ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <div className="flex flex-row items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 mt-2">
                                <Switch
                                    checked={forceOverride}
                                    onCheckedChange={setForceOverride}
                                    className="data-[state=checked]:bg-destructive"
                                />
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-semibold text-destructive">Force Recreate / Override</Label>
                                    <p className="text-[10px] text-muted-foreground">Bypass the 6-month lock to manually recreate or revoke API keys if an emergency occurs.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Newly created key (show once) */}
                    {newlyCreatedKey && (
                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 space-y-2">
                            <p className="text-xs font-medium text-green-700 dark:text-green-400">
                                Copy this key now — it won&apos;t be shown again!
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="text-xs bg-background/50 px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">
                                    {showNewKey ? newlyCreatedKey : "•".repeat(40)}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setShowNewKey(!showNewKey)}
                                >
                                    {showNewKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => newlyCreatedKey && handleCopyKey(newlyCreatedKey)}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Existing keys */}
                    {apiKeys.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                            No API keys yet. Create one to integrate a custom storefront.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {apiKeys.map((key) => (
                                <div
                                    key={key.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                                >
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium">{key.key_name}</p>
                                            {key.revoked_at ? (
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Revoked</Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Active</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono">{key.key_prefix}</p>
                                        {key.last_used_at && (
                                            <p className="text-[10px] text-muted-foreground">
                                                Last used: {new Date(key.last_used_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    {!key.revoked_at && userRole === 'superadmin' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                            onClick={() => handleRevokeKey(key.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            )}

            </div>{/* end row 4 */}

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
