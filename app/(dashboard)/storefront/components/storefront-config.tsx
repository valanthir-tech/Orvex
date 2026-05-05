"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { updateStorefrontConfig } from "@/app/actions/storefront"
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
import { GripVertical, Loader2 } from "lucide-react"

export function StorefrontConfig({ initialData, defaultCurrency, baseStoreName, tenantId }: { initialData: any, defaultCurrency: string, baseStoreName: string, tenantId: string }) {
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
    { id: "b1", type: "clean-hero", title: "Clean Hero Banner", config: { headline: "Simplicity Reimagined", subheadline: "Discover the new standard." } },
    { id: "b2", type: "product-grid", title: "Product Grid", config: { limit: 8 } },
    { id: "b3", type: "banner-with-image", title: "Feature Banner", config: { headline: "Quality First", image: "" } }
  ])

  // Content fields
  const [tagline, setTagline] = useState(initialData?.tagline || "")
  const [philosophyText, setPhilosophyText] = useState(initialData?.philosophy_text || "")
  const [aboutHeadline, setAboutHeadline] = useState(initialData?.about_headline || "")
  const [testimonialQuote, setTestimonialQuote] = useState(initialData?.testimonial_quote || "")
  const [testimonialAuthor, setTestimonialAuthor] = useState(initialData?.testimonial_author || "")
  const [newsletterDescription, setNewsletterDescription] = useState(initialData?.newsletter_description || "")
  const [themeTemplate, setThemeTemplate] = useState(initialData?.theme_template || "default")

  const [materials, setMaterials] = useState<Array<{ label: string; sublabel: string }>>(
    initialData?.materials?.length ? initialData.materials : [
      { label: "Solid Oak", sublabel: "Natural wood grain, ethically sourced" },
      { label: "Stoneware Ceramic", sublabel: "Hand-thrown, kiln-fired at 1280°C" },
      { label: "Aged Brass", sublabel: "Living finish, deepens with time" },
    ]
  )
  const [uiLabels, setUiLabels] = useState<Record<string, string>>(initialData?.ui_labels || {
    hero_primary_button: "Explore the Collection",
    hero_secondary_button: "View All Products →",
    featured_label: "Featured Selection",
    featured_badge: "Featured",
    button_view_product: "View Product",
    button_view_all: "View All →",
    product_grid_label: "Our Offering",
    product_grid_heading: "The Collection",
    categories_label: "Browse",
    categories_heading: "Shop by Category",
    newsletter_label: "Stay Connected",
    newsletter_heading: "Join the community",
    newsletter_success: "Thank you — you're on the list. Welcome to the community.",
    newsletter_button: "Subscribe"
  })

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
      const { error } = await supabase.storage
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

  const handleSaveContent = () => {
    startTransition(async () => {
      try {
        await updateStorefrontConfig({
          tagline: tagline || undefined,
          philosophy_text: philosophyText || undefined,
          about_headline: aboutHeadline || undefined,
          testimonial_quote: testimonialQuote || undefined,
          testimonial_author: testimonialAuthor || undefined,
          newsletter_description: newsletterDescription || undefined,
          materials: materials.filter(m => m.label.trim()),
        })
        toast.success("Content saved successfully")
      } catch (err: any) {
        toast.error("Failed to save content: " + err.message)
      }
    })
  }

  const handleSaveLabels = () => {
    startTransition(async () => {
      try {
        await updateStorefrontConfig({
          ui_labels: uiLabels
        })
        toast.success("Microcopy labels saved successfully")
      } catch (err: any) {
        toast.error("Failed to save labels: " + err.message)
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
        <TabsTrigger value="branding">Branding & Media</TabsTrigger>
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="labels">Microcopy & Labels</TabsTrigger>
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
                <div>
                  <Input type="file" id="faviconUpload" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, setFaviconUrl)} />
                  <Button variant="outline" onClick={() => document.getElementById('faviconUpload')?.click()}>Upload Favicon</Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <Label>Hero Section Background Image</Label>
              <div className="flex gap-2">
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

      {/* CONTENT */}
      <TabsContent value="content" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Site Tagline</CardTitle>
            <CardDescription>Short line shown in the hero section and footer (e.g. "Thoughtful objects for everyday living.").</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              placeholder="Thoughtful objects for everyday living."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Our Philosophy</CardTitle>
            <CardDescription>The animated paragraph shown in the intro section below the hero. Keep it 1–3 sentences.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={4}
              value={philosophyText}
              onChange={e => setPhilosophyText(e.target.value)}
              placeholder="We believe the objects you use every day should be beautiful, durable, and meaningful..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Our Story Section</CardTitle>
            <CardDescription>The bold headline in the dark "About" block. The body text is set in Branding &amp; Media.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Label>Story Headline</Label>
              <Input
                value={aboutHeadline}
                onChange={e => setAboutHeadline(e.target.value)}
                placeholder="Born from a love of honest materials and quiet design."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Testimonial</CardTitle>
            <CardDescription>The quote shown in the testimonials section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Quote</Label>
              <Textarea
                rows={3}
                value={testimonialQuote}
                onChange={e => setTestimonialQuote(e.target.value)}
                placeholder="Every piece feels like it was made just for our home..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Attribution</Label>
              <Input
                value={testimonialAuthor}
                onChange={e => setTestimonialAuthor(e.target.value)}
                placeholder="— Elena & Marcus, Berlin"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Newsletter Section</CardTitle>
            <CardDescription>The description line below the newsletter heading.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              value={newsletterDescription}
              onChange={e => setNewsletterDescription(e.target.value)}
              placeholder="New collections, maker stories, and early access to limited editions."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material Highlights</CardTitle>
            <CardDescription>Three cards shown in the "Material Quality" section. Each card has a name and a short subtitle.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {materials.map((mat, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="grid gap-2">
                  <Label>Card {i + 1} — Name</Label>
                  <Input
                    value={mat.label}
                    onChange={e => {
                      const updated = [...materials]
                      updated[i] = { ...updated[i], label: e.target.value }
                      setMaterials(updated)
                    }}
                    placeholder={["Solid Oak", "Stoneware Ceramic", "Aged Brass"][i] || "Material name"}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Card {i + 1} — Subtitle</Label>
                  <Input
                    value={mat.sublabel}
                    onChange={e => {
                      const updated = [...materials]
                      updated[i] = { ...updated[i], sublabel: e.target.value }
                      setMaterials(updated)
                    }}
                    placeholder={["Natural wood grain, ethically sourced", "Hand-thrown, kiln-fired at 1280°C", "Living finish, deepens with time"][i] || "Short description"}
                  />
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveContent} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Content
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* MICROCOPY & LABELS */}
      <TabsContent value="labels" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Microcopy & Labels</CardTitle>
            <CardDescription>Customize every hardcoded button, section title, and small text across the storefront.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Hero Section</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Primary Button</Label>
                  <Input value={uiLabels.hero_primary_button || ""} onChange={e => setUiLabels({ ...uiLabels, hero_primary_button: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Secondary Button</Label>
                  <Input value={uiLabels.hero_secondary_button || ""} onChange={e => setUiLabels({ ...uiLabels, hero_secondary_button: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Featured Selection</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Section Label</Label>
                  <Input value={uiLabels.featured_label || ""} onChange={e => setUiLabels({ ...uiLabels, featured_label: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Featured Badge</Label>
                  <Input value={uiLabels.featured_badge || ""} onChange={e => setUiLabels({ ...uiLabels, featured_badge: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>View Product Button</Label>
                  <Input value={uiLabels.button_view_product || ""} onChange={e => setUiLabels({ ...uiLabels, button_view_product: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>View All Button</Label>
                  <Input value={uiLabels.button_view_all || ""} onChange={e => setUiLabels({ ...uiLabels, button_view_all: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Product Grid</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Section Label</Label>
                  <Input value={uiLabels.product_grid_label || ""} onChange={e => setUiLabels({ ...uiLabels, product_grid_label: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Section Heading</Label>
                  <Input value={uiLabels.product_grid_heading || ""} onChange={e => setUiLabels({ ...uiLabels, product_grid_heading: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Categories Grid</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Section Label</Label>
                  <Input value={uiLabels.categories_label || ""} onChange={e => setUiLabels({ ...uiLabels, categories_label: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Section Heading</Label>
                  <Input value={uiLabels.categories_heading || ""} onChange={e => setUiLabels({ ...uiLabels, categories_heading: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Newsletter</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Section Label</Label>
                  <Input value={uiLabels.newsletter_label || ""} onChange={e => setUiLabels({ ...uiLabels, newsletter_label: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Section Heading</Label>
                  <Input value={uiLabels.newsletter_heading || ""} onChange={e => setUiLabels({ ...uiLabels, newsletter_heading: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Success Message</Label>
                  <Input value={uiLabels.newsletter_success || ""} onChange={e => setUiLabels({ ...uiLabels, newsletter_success: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Subscribe Button</Label>
                  <Input value={uiLabels.newsletter_button || ""} onChange={e => setUiLabels({ ...uiLabels, newsletter_button: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Navigation & Cart</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Shop Link</Label>
                  <Input value={uiLabels.nav_shop || ""} onChange={e => setUiLabels({ ...uiLabels, nav_shop: e.target.value })} placeholder="Shop" />
                </div>
                <div className="grid gap-2">
                  <Label>Story Link</Label>
                  <Input value={uiLabels.nav_story || ""} onChange={e => setUiLabels({ ...uiLabels, nav_story: e.target.value })} placeholder="Story" />
                </div>
                <div className="grid gap-2">
                  <Label>Cart Heading</Label>
                  <Input value={uiLabels.cart_title || ""} onChange={e => setUiLabels({ ...uiLabels, cart_title: e.target.value })} placeholder="Your Bag" />
                </div>
                <div className="grid gap-2">
                  <Label>Checkout Button</Label>
                  <Input value={uiLabels.cart_checkout || ""} onChange={e => setUiLabels({ ...uiLabels, cart_checkout: e.target.value })} placeholder="Proceed to Checkout" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Footer Setup</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Footer Headline</Label>
                  <Input value={uiLabels.footer_shop_now || ""} onChange={e => setUiLabels({ ...uiLabels, footer_shop_now: e.target.value })} placeholder="Shop Now →" />
                </div>
                <div className="grid gap-2">
                  <Label>Footer Disclaimer</Label>
                  <Input value={uiLabels.footer_rights || ""} onChange={e => setUiLabels({ ...uiLabels, footer_rights: e.target.value })} placeholder="All rights reserved." />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveLabels} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Labels
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
