"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateStorefrontConfig, StorefrontConfigPayload } from "@/app/actions/storefront"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
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

  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || "")
  const [faviconUrl, setFaviconUrl] = useState(initialData?.favicon_url || "")
  const [heroImageUrl, setHeroImageUrl] = useState(initialData?.hero_image_url || "")
  const [heroHeading, setHeroHeading] = useState(initialData?.hero_heading || "")
  const [heroSubheading, setHeroSubheading] = useState(initialData?.hero_subheading || "")
  const [aboutText, setAboutText] = useState(initialData?.about_text || "")
  const [socialLinks, setSocialLinks] = useState(initialData?.social_links || { facebook: "", instagram: "", twitter: "", youtube: "" })

  const [themePrimaryColor, setThemePrimaryColor] = useState(initialData?.theme_primary_color || "#4b5563")
  const [themeTextColor, setThemeTextColor] = useState(initialData?.theme_text_color || "#1f2937")
  const [themeBgColor, setThemeBgColor] = useState(initialData?.theme_bg_color || "#ffffff")

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
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return
    const supabase = createSupabaseBrowserClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${tenantId}/${Date.now()}-${Math.random()}.${fileExt}`
    
    toast("Uploading image...")
    
    try {
      const { data, error } = await supabase.storage
         .from('storefront_media')
         .upload(fileName, file)
         
      if (error) {
         toast.error("Upload failed: " + error.message)
         return
      }
      
      const { data: { publicUrl } } = supabase.storage
         .from('storefront_media')
         .getPublicUrl(fileName)
         
      setter(publicUrl)
      toast.success("Image uploaded successfully!")
    } catch (err: any) {
      toast.error("Upload error: " + err.message)
    }
  }
  const handleSaveBranding = () => {
    startTransition(async () => {
      try {
        await updateStorefrontConfig({
          logo_url: logoUrl,
          favicon_url: faviconUrl,
          hero_image_url: heroImageUrl,
          hero_heading: heroHeading,
          hero_subheading: heroSubheading,
          about_text: aboutText,
          social_links: socialLinks,
          theme_primary_color: themePrimaryColor,
          theme_text_color: themeTextColor,
          theme_bg_color: themeBgColor,
        })
        toast.success("Branding details saved successfully")
      } catch (err: any) {
        toast.error("Failed to save branding: " + err.message)
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
        <TabsTrigger value="branding">Branding & Text</TabsTrigger>
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

      {/* BRANDING & TEXT */}
      <TabsContent value="branding" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Branding & Media</CardTitle>
            <CardDescription>Upload URLs for your main logos and hero image to keep the storefront on brand.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              <Label>Logo</Label>
              <div className="flex gap-2">
                <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" />
                <div>
                  <Input type="file" id="logoUpload" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, setLogoUrl)} />
                  <Button variant="outline" onClick={() => document.getElementById('logoUpload')?.click()}>Upload Logo</Button>
                </div>
              </div>
              {logoUrl && <img src={logoUrl} alt="Logo Preview" className="h-10 object-contain w-auto mt-2" />}
            </div>
            
            <div className="grid gap-3">
              <Label>Favicon</Label>
              <div className="flex gap-2">
                <Input value={faviconUrl} onChange={e => setFaviconUrl(e.target.value)} placeholder="https://example.com/favicon.ico" />
                <div>
                  <Input type="file" id="faviconUpload" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, setFaviconUrl)} />
                  <Button variant="outline" onClick={() => document.getElementById('faviconUpload')?.click()}>Upload Favicon</Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <Label>Hero Section Background Image</Label>
              <div className="flex gap-2">
                <Input value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} placeholder="https://example.com/hero.jpg" />
                <div>
                  <Input type="file" id="heroUpload" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, setHeroImageUrl)} />
                  <Button variant="outline" onClick={() => document.getElementById('heroUpload')?.click()}>Upload Hero</Button>
                </div>
              </div>
              {heroImageUrl && <img src={heroImageUrl} alt="Hero Preview" className="h-32 object-cover w-full rounded-md mt-2 opacity-80" />}
            </div>
          </CardContent>
          <Separator />
          <CardHeader>
            <CardTitle>Core Texts</CardTitle>
            <CardDescription>Update your Homepage welcome and About section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Hero Heading</Label>
              <Input value={heroHeading} onChange={e => setHeroHeading(e.target.value)} placeholder="Welcome to our Store" />
            </div>
            <div className="grid gap-2">
              <Label>Hero Subheading</Label>
              <Input value={heroSubheading} onChange={e => setHeroSubheading(e.target.value)} placeholder="Find the best items here." />
            </div>
            <div className="grid gap-2">
              <Label>About Us Summary</Label>
              <Textarea rows={4} value={aboutText} onChange={e => setAboutText(e.target.value)} placeholder="We are a local brand..." />
            </div>
          </CardContent>
          <Separator />
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Displayed in the site footer.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Facebook URL</Label>
                <Input value={socialLinks.facebook || ""} onChange={e => setSocialLinks({ ...socialLinks, facebook: e.target.value })} placeholder="https://facebook.com/..." />
              </div>
              <div className="grid gap-2">
                <Label>Instagram URL</Label>
                <Input value={socialLinks.instagram || ""} onChange={e => setSocialLinks({ ...socialLinks, instagram: e.target.value })} placeholder="https://instagram.com/..." />
              </div>
              <div className="grid gap-2">
                <Label>Twitter/X URL</Label>
                <Input value={socialLinks.twitter || ""} onChange={e => setSocialLinks({ ...socialLinks, twitter: e.target.value })} placeholder="https://twitter.com/..." />
              </div>
              <div className="grid gap-2">
                <Label>YouTube URL</Label>
                <Input value={socialLinks.youtube || ""} onChange={e => setSocialLinks({ ...socialLinks, youtube: e.target.value })} placeholder="https://youtube.com/..." />
              </div>
            </div>

            <div className="pt-6 mt-6 border-t">
              <h3 className="font-semibold text-lg text-slate-800 mb-2">Theme Colors</h3>
              <p className="text-sm text-slate-500 mb-4">
                Define the colors for text and backgrounds on your storefront. Choose colors that contrast nicely over your uploaded images.
              </p>
              <div className="grid gap-6 md:grid-cols-3 mb-6">
                <div className="space-y-2">
                  <Label>Primary Brand Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input type="color" className="w-12 h-10 p-1 cursor-pointer" value={themePrimaryColor} onChange={e => setThemePrimaryColor(e.target.value)} title="Choose Primary Color" />
                    <Input value={themePrimaryColor} onChange={e => setThemePrimaryColor(e.target.value)} placeholder="#4b5563" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input type="color" className="w-12 h-10 p-1 cursor-pointer" value={themeTextColor} onChange={e => setThemeTextColor(e.target.value)} title="Choose Text Color" />
                    <Input value={themeTextColor} onChange={e => setThemeTextColor(e.target.value)} placeholder="#1f2937" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2 items-center">
                    <Input type="color" className="w-12 h-10 p-1 cursor-pointer" value={themeBgColor} onChange={e => setThemeBgColor(e.target.value)} title="Choose Background Color" />
                    <Input value={themeBgColor} onChange={e => setThemeBgColor(e.target.value)} placeholder="#ffffff" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveBranding} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Branding
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
