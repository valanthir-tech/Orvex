import { getCustomers } from "@/app/actions/customers"
import { CustomersPageClient } from "@/components/customers/customers-page-client"

export const metadata = {
  title: "Customers | Orvex",
  description: "Manage your customer list, view their purchase history, and handle credits.",
}

export default async function CustomersPage() {
  const customers = await getCustomers()

  return <CustomersPageClient initialCustomers={customers} />
}
