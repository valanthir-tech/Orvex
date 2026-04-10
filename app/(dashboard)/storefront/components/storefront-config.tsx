"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateStorefrontConfig, StorefrontConfigPayload } from "@/app/actions/storefront"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { PlusCircle, GripVertical, Trash2, Loader2 } from "lucide-react"

export function StorefrontConfig({ initialData, defaultCurrency, baseStoreName, tenantId }: { initialData: any, defaultCurrency: string, baseStoreName: string, tenantId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [storeName, setStoreName] = useState(initialData?.store_name || baseStoreName)
  const [supportEmail, setSupportEmail] = useState(initialData?.support_email || "")
  const [taxRate, setTaxRate] = useState(initialData?.tax_rate_fallback || 0)
  const [shippingRate, setShippingRate] = useState(initialData?.shipping_rate_fallback || 0)

  const [isMaintenanceMode, setIsMaintenanceMode] = useState(!!initialData?.is_maintenance_mode)
  const [isCheckoutDisabled, setIsCheckoutDisabled] = useState(!!initialData?.is_checkout_disabled)

  const [themeBlocks, setThemeBlocks] = useState<any[]>(initialData?.theme_blocks?.length ? initialData.theme_blocks : [
    { id: "b1", type: "hero", title: "Hero Banner", config: { headline: "Welcome to our Gallery", subheadline: "Explore the latest curations." } },
    { id: "b2", type: "about-history", title: "Our History", config: { text: "Founded in 2026, we specialize in..." } },
    { id: "b3", type: "featured-grid", title: "Featured Artworks", config: { limit: 8 } }
  ])

  const handleSaveGeneral = () => {
    startTransition(async () => {
      try {
        await updateStorefrontConfig({
          store_name: storeName,
          support_email: supportEmail,
          tax_rate_fallback: Number(taxRate),
          shipping_rate_fallback: Number(shippingRate)
        })
        toast.success("General settings saved successfully")
      } catch (err: any) {
        toast.error("Failed to save settings: " + err.message)
      }
    })
  }

  const handleSaveCMS = () => {
    startTransition(async () => {
      try {
        await updateStorefrontConfig({
          theme_blocks: themeBlocks
        })
        toast.success("Theme published successfully")
      } catch (err: any) {
        toast.error("Failed to publish theme: " + err.message)
      }
    })
  }

  const handleToggleDanger = async (key: 'checkout' | 'maintenance', state: boolean) => {
    startTransition(async () => {
      try {
        if (key === 'checkout') {
          setIsCheckoutDisabled(state)
          await updateStorefrontConfig({ is_checkout_disabled: state })
          toast.success(`Checkout ${state ? 'disabled' : 'enabled'}`)
        } else {
          setIsMaintenanceMode(state)
          await updateStorefrontConfig({ is_maintenance_mode: state })
          toast.success(`Maintenance mode ${state ? 'enabled' : 'disabled'}`)
        }
      } catch (err: any) {
        if (key === 'checkout') setIsCheckoutDisabled(!state)
        if (key === 'maintenance') setIsMaintenanceMode(!state)
        toast.error("Failed to update status: " + err.message)
      }
    })
  }

  return (
    <Tabs defaultValue="general" className="space-y-4">
      <TabsList>
        <TabsTrigger value="general">Store Profile</TabsTrigger>
        <TabsTrigger value="cms">Theme Builder</TabsTrigger>
        <TabsTrigger value="danger">Store Status</TabsTrigger>
      </TabsList>

      {/* GENERAL CONFIG */}
      <TabsContent value="general" className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Global Store Settings</CardTitle>
                <CardDescription>
                  Basic information used across your storefront.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <a 
                  href={`/store/${(storeName || baseStoreName).toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  View Live Store ↗
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Store Name</Label>
              <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder={baseStoreName} />
            </div>
            <div className="grid gap-2">
              <Label>Support/Contact Email</Label>
              <Input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} type="email" placeholder="e.g. support@store.com" />
            </div>
            <div className="grid gap-2">
              <Label>Default Currency (System)</Label>
              <Input value={defaultCurrency} readOnly disabled className="w-1/4" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveGeneral} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping & Tax Overrides</CardTitle>
            <CardDescription>Global fallbacks for orders missing specific item overrides.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="grid gap-2 flex-1">
                <Label>Default Tax Rate (%)</Label>
                <Input value={taxRate || ""} onChange={e => setTaxRate(Number(e.target.value))} type="number" />
              </div>
              <div className="grid gap-2 flex-1">
                <Label>Flat Shipping Rate ({defaultCurrency})</Label>
                <Input value={shippingRate || ""} onChange={e => setShippingRate(Number(e.target.value))} type="number" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveGeneral} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Overrides
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

{/* CMS THEME BUILDER */}
      <TabsContent value="cms" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Theme Layout Builder</CardTitle>
              <CardDescription>
                Customize your storefront's homepage blocks. Drag and drop to reorder.
              </CardDescription>
            </div>
            <Button onClick={handleSaveCMS} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish Theme
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {themeBlocks.map((block, index) => (
              <div key={block.id} className="flex gap-4 items-start p-4 border rounded-md bg-slate-50 relative group">
                <GripVertical className="h-5 w-5 text-slate-400 mt-2 cursor-move" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{block.title}</h4>
                    <span className="text-xs uppercase bg-slate-200 text-slate-700 px-2 py-1 rounded">
                      {block.type}
                    </span>
                  </div>
                  {/* Basic editors based on block type */}
                  {block.type === "hero" && (
                    <div className="grid gap-2">
                      <Input 
                        value={block.config.headline} 
                        onChange={(e) => {
                          const newBlocks = [...themeBlocks]
                          newBlocks[index].config.headline = e.target.value
                          setThemeBlocks(newBlocks)
                        }} 
                        placeholder="Headline" 
                      />
                      <Input 
                        value={block.config.subheadline} 
                        onChange={(e) => {
                          const newBlocks = [...themeBlocks]
                          newBlocks[index].config.subheadline = e.target.value
                          setThemeBlocks(newBlocks)
                        }} 
                        placeholder="Subheadline" 
                      />
                    </div>
                  )}
                  {block.type === "about-history" && (
                    <Textarea 
                      value={block.config.text}
                      onChange={(e) => {
                        const newBlocks = [...themeBlocks]
                        newBlocks[index].config.text = e.target.value
                        setThemeBlocks(newBlocks)
                      }}
                      rows={3}
                    />
                  )}
                  {block.type === "featured-grid" && (
                    <div className="flex items-center gap-2">
                      <Label>Product Limit:</Label>
                      <Input 
                        type="number" 
                        value={block.config.limit}
                        onChange={(e) => {
                          const newBlocks = [...themeBlocks]
                          newBlocks[index].config.limit = Number(e.target.value)
                          setThemeBlocks(newBlocks)
                        }}
                        className="w-24"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </TabsContent>

      {/* DANGER ZONE */}
      <TabsContent value="danger" className="space-y-4">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Store Toggles</CardTitle>
            <CardDescription>Emergency kill-switches for the storefront.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Disable Checkout</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily pause all sales. Users can browse but cannot buy.
                </p>
              </div>
              <Switch checked={isCheckoutDisabled} onCheckedChange={(s) => handleToggleDanger('checkout', s)} disabled={isPending} />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-4">
              <div className="space-y-0.5">
                <Label className="text-base text-destructive">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Takes the entire storefront offline with a "Be back soon" message.
                </p>
              </div>
              <Switch checked={isMaintenanceMode} onCheckedChange={(s) => handleToggleDanger('maintenance', s)} disabled={isPending} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
