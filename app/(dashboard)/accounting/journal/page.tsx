export const metadata = {
  title: "Journal Entries | Onedexo",
  description: "General ledger journal vouchers with strict Dr = Cr balance invariant."
}

import JournalPageClient from "@/components/accounting/journal-page-client"

export default function JournalPage() {
  return <JournalPageClient />
}
