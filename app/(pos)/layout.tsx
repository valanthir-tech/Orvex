import POSLayoutClient from "./pos-layout-client"
import { POSAuthGuard } from "@/components/pos/pos-auth-guard"

export default function POSLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <POSAuthGuard>
            <POSLayoutClient>{children}</POSLayoutClient>
        </POSAuthGuard>
    )
}
