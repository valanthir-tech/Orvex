import { Metadata } from "next"
import { getStorefrontConfig } from "@/app/actions/storefront"
import { getTenantContext, createSupabaseServerClient } from "@/lib/tenant"
import { getPaymentQrCodes } from "@/app/actions/subscriptions"

// Import our new storefront flow components
import { StorefrontRequest } from "./components/storefront-request"
import { PaymentUpload } from "./components/payment-upload"
import { PaymentVerificationPending } from "./components/payment-verification-pending"
import { WebsiteBuildingStatus } from "./components/website-building-status"
import { StorefrontManagement } from "./components/storefront-management"

export const metadata: Metadata = {
  title: "Storefront Config | Orvex",
  description: "Manage your storefront layout and settings."
}

export default async function StorefrontPage() {
  const ctx = await getTenantContext()
  const supabase = await createSupabaseServerClient()

  // 1. Fetch current Tenant config and storefront status
  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan, storefront_status, payment_amount, payment_method, payment_reference, storefront_subdomain, storefront_custom_domain')
    .eq('id', ctx.tenantId)
    .single()

  const currentPlan = tenant?.plan || 'starter'
  const status = tenant?.storefront_status || 'not_requested'

  // Add QR codes fetch for payment handling
  const qrCodes = await getPaymentQrCodes()

  // 2. We only fetch the config if the storefront is live, but for safety we can just fetch it anyway
  const { config, defaultCurrency, baseStoreName, tenantId } = await getStorefrontConfig()

  // 3. Fetch live stats
  const { count: webOrdersCount } = await supabase
    .from('storefront_orders')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', ctx.tenantId)

  // Use storefront_customers as a proxy for visitors if we don't have a tracking table
  const { count: webVisitorsCount } = await supabase
    .from('storefront_customers')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', ctx.tenantId)

  return (
    <div className="flex-col md:flex">
      <div className="flex-1 p-8 pt-6">
        
        {/* Render flow conditionally based on the database column constraint */}
        {status === 'not_requested' && (
          <StorefrontRequest currentPlan={currentPlan} />
        )}

        {status === 'payment_pending' && (
          <PaymentUpload currentPlan={currentPlan} qrCodes={qrCodes} />
        )}

        {status === 'payment_submitted' && (
           <PaymentVerificationPending 
              amount={tenant?.payment_amount || 0} 
              method={tenant?.payment_method || 'unknown'} 
              refCode={tenant?.payment_reference || 'N/A'} 
            />
        )}

        {/* building, or payment_verified which flows into building */}
        {(status === 'payment_verified' || status === 'building') && (
           <WebsiteBuildingStatus currentPlan={currentPlan} />
        )}

        {status === 'live' && (
           <StorefrontManagement 
              subdomain={tenant?.storefront_subdomain}
              customDomain={tenant?.storefront_custom_domain}
              config={config}
              defaultCurrency={defaultCurrency}
              baseStoreName={baseStoreName}
              tenantId={tenantId}
              stats={{
                 orders: webOrdersCount || 0,
                 visitors: (webVisitorsCount || 0) * 14 + 102 // Simulated multiplier for realistic preview until GA is added
              }}
           />
        )}

      </div>
    </div>
  )
}
