export const metadata = {
  title: "Stock Ledger | Onedexo",
  description: "Chronological audit trail of warehouse inward arrivals, dispatches, and balance valuations."
}

import StockLedgerPageClient from "@/components/stock/stock-ledger-page-client"

export default function StockLedgerPage() {
  return <StockLedgerPageClient />
}
