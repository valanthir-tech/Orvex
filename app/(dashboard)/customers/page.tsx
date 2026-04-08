import { getCustomers } from "@/app/actions/customers"
import { CustomersPageClient } from "@/components/customers/customers-page-client"

export const metadata = {
  title: "Customers | Zynli",
  description: "Manage your customer list, view their purchase history, and handle credits.",
}

export default async function CustomersPage() {
  const customers = await getCustomers()

  return (
    <div className="flex flex-col h-full overflow-hidden w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Customers</h1>
        <p className="text-muted-foreground hidden md:block">
          Manage your customers, track their sales (LTV), and monitor their ongoing balances.
        </p>
      </div>

      <CustomersPageClient initialCustomers={customers} />
    </div>
  )
}
