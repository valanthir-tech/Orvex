import { Metadata } from "next"
import { InboxClient } from "./components/inbox-client"
import { getInquiries } from "@/app/actions/inbox"

export const metadata: Metadata = {
  title: "Inbox | Orvex",
  description: "Manage your storefront inquiries and messages."
}

export default async function InboxPage() {
  const inquiries = await getInquiries()
  return (
    <div className="flex-col md:flex h-full">
      <div className="flex-1 space-y-4 p-8 pt-6 h-full flex flex-col max-h-screen">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Unified Inbox</h2>
        </div>
        <InboxClient initialInquiries={inquiries} />
      </div>
    </div>
  )
}
