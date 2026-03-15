import CustomersPageClient from "@/components/customers/customers-page-client"
import { getTenantFeatures } from "@/app/actions/subscriptions"

export default async function CustomersPage() {
    const features = await getTenantFeatures()
    return <CustomersPageClient hasKhataAccess={features.khata} />
}
