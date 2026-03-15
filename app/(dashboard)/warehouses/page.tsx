import WarehousesPageClient from "@/components/warehouses/warehouses-page-client"
import { getTenantFeatures } from "@/app/actions/subscriptions"
import { PlanUpgradePrompt } from "@/components/payment/plan-upgrade-prompt"

export const metadata = {
    title: "Warehouses | Valanthir IMS",
}

export const dynamic = "force-dynamic"

export default async function WarehousesPage() {
    const features = await getTenantFeatures()
    
    if (!features.multi_warehouse) {
        return (
            <div className="p-4 md:p-8">
                <PlanUpgradePrompt featureName="Multi-Warehouse Management" />
            </div>
        )
    }

    return <WarehousesPageClient />
}
