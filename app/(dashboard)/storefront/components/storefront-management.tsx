"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StorefrontConfig } from "./storefront-config"
import { ExternalLink, Users, ShoppingCart, Globe2, Sparkles, Building2 } from "lucide-react"

interface StorefrontManagementProps {
  subdomain: string | null
  customDomain: string | null
  config: any
  defaultCurrency: string
  baseStoreName: string
  tenantId: string
}

export function StorefrontManagement({
  subdomain,
  customDomain,
  config,
  defaultCurrency,
  baseStoreName,
  tenantId
}: StorefrontManagementProps) {
  
  // The actual live URL
  const primaryUrl = customDomain ? `https://${customDomain}` : (subdomain ? `https://${subdomain}.orvex.app` : null)

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your Storefront is Live!</h2>
          <p className="text-muted-foreground mt-1">Manage content, view stats, and configure your site.</p>
        </div>
        
        {primaryUrl && (
          <Button size="lg" className="shadow-lg shadow-primary/20" asChild>
            <a href={primaryUrl} target="_blank" rel="noopener noreferrer">
              <Globe2 className="mr-2 h-5 w-5" />
              Visit Store
              <ExternalLink className="ml-2 h-4 w-4 opacity-50" />
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domain</CardTitle>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              {customDomain || (subdomain ? `${subdomain}.orvex.app` : 'Pending...')}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
              Secured with SSL
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Web Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,204</div>
            <p className="text-xs text-emerald-500 mt-1 flex items-center shadow-emerald-500/20 drop-shadow-sm">+20% from last month</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground mt-1">Processed natively in POS</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 transition-all border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary flex items-center">
               <Sparkles className="h-4 w-4 mr-2" /> Custom Design
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[70px] justify-end">
             <Button variant="secondary" size="sm" className="w-full shadow-sm" onClick={() => window.open('mailto:support@orvex.app')}>Request Changes</Button>
          </CardContent>
        </Card>
      </div>

      {/* Website Configuration Editor mapped directly to Frappe variables */}
      <h3 className="text-2xl font-semibold tracking-tight border-b pb-2 pt-4 flex items-center gap-3">
         <Building2 className="h-6 w-6 text-primary"/>  Core Storefront Settings
      </h3>
      <StorefrontConfig 
        initialData={config} 
        defaultCurrency={defaultCurrency} 
        baseStoreName={baseStoreName} 
        tenantId={tenantId} 
      />

    </div>
  )
}
