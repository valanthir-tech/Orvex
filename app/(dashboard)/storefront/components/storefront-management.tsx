"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StorefrontConfig } from "./storefront-config"
import { ExternalLink, Users, ShoppingCart, Globe2, Sparkles, Building2, Paintbrush } from "lucide-react"
import { cardStyles } from "@/lib/theme"

interface StorefrontManagementProps {
  subdomain: string | null
  customDomain: string | null
  config: any
  defaultCurrency: string
  baseStoreName: string
  tenantId: string
  stats?: {
    orders: number
    visitors: number
  }
}

export function StorefrontManagement({
  subdomain,
  customDomain,
  config,
  defaultCurrency,
  baseStoreName,
  tenantId,
  stats = { orders: 0, visitors: 0 }
}: StorefrontManagementProps) {
  
  // The actual live URL
  const primaryUrl = customDomain ? `https://${customDomain}` : (subdomain ? `https://${subdomain}.onedexo.page` : null)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-heading">Your Storefront is Live!</h2>
          <p className="text-muted-foreground mt-1">Manage content, view stats, and configure your site.</p>
        </div>
        
        {primaryUrl && (
          <Button size="lg" className="shadow-lg shadow-primary/20 rounded-full" asChild>
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer">
              <Globe2 className="mr-2 h-5 w-5" />
              Visit Store
              <ExternalLink className="ml-2 h-4 w-4 opacity-50" />
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={cardStyles.sky.card}>
          <div className={cardStyles.sky.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Domain</CardTitle>
            <div className={cardStyles.sky.icon}>
                <Globe2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl font-bold font-heading truncate">
              {customDomain || (subdomain ? `${subdomain}.onedexo.page` : 'Pending...')}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
              Secured with SSL
            </p>
          </CardContent>
        </Card>
        
        <Card className={cardStyles.emerald.card}>
          <div className={cardStyles.emerald.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Web Visitors</CardTitle>
            <div className={cardStyles.emerald.icon}>
                <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold font-heading">{stats.visitors.toLocaleString()}</div>
            <div className="text-xs mt-2 text-emerald-600 dark:text-emerald-400 font-medium">+12% from last week</div>
          </CardContent>
        </Card>
        
        <Card className={cardStyles.amber.card}>
          <div className={cardStyles.amber.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Online Orders</CardTitle>
            <div className={cardStyles.amber.icon}>
                <ShoppingCart className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold font-heading">{stats.orders.toLocaleString()}</div>
             <div className="text-xs mt-2 text-muted-foreground">all-time deliveries</div>
          </CardContent>
        </Card>

        <Card className={cardStyles.rose.card}>
          <div className={cardStyles.rose.overlay} />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custom Design</CardTitle>
            <div className={cardStyles.rose.icon}>
                <Paintbrush className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative flex flex-col h-[70px] justify-end">
             <Button variant="outline" size="sm" className="w-full relative z-10 bg-white/50 backdrop-blur border-white/20 hover:bg-white/80" onClick={() => window.open('mailto:support@onedexo.app')}>
               Request Changes
             </Button>
          </CardContent>
        </Card>
      </div>

      {/* Website Configuration Editor mapped directly to Frappe variables */}
      <Card className="card-float border-0 rounded-2xl p-4">
        <h3 className="text-2xl font-semibold tracking-tight border-b pb-2 pt-2 flex items-center gap-3 font-heading">
           <Building2 className="h-6 w-6 text-primary"/>  Core Storefront Settings
        </h3>
        <div className="pt-6">
          <StorefrontConfig 
            initialData={config} 
            defaultCurrency={defaultCurrency} 
            baseStoreName={baseStoreName} 
            tenantId={tenantId} 
          />
        </div>
      </Card>
    </div>
  )
}
