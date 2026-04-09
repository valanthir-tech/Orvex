import { Metadata } from "next"
import { StorefrontConfig } from "./components/storefront-config"
import { getStorefrontConfig } from "@/app/actions/storefront"

export const metadata: Metadata = {
  title: "Storefront Config | Orvex",
  description: "Manage your storefront layout and settings."
}

export default async function StorefrontPage() {
  const { config, defaultCurrency, baseStoreName, tenantId } = await getStorefrontConfig()

  return (
    <div className="flex-col md:flex">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">API & Storefront Configuration</h2>
        </div>
        <div className="space-y-4">
          <StorefrontConfig initialData={config} defaultCurrency={defaultCurrency} baseStoreName={baseStoreName} tenantId={tenantId} />
        </div>
      </div>
    </div>
  )
}
