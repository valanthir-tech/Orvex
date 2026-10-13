export const metadata = {
  title: "Stock Reconciliation | Onedexo",
  description: "Perform physical shelf counts and reconcile inventory discrepancies."
}

import StockCountsPageClient from "@/components/stock/stock-counts-page-client"

export default function StockCountsPage() {
  return <StockCountsPageClient />
}
