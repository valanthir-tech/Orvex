import POSLayoutClient from "./pos-layout-client"

export default function POSLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <POSLayoutClient>{children}</POSLayoutClient>
}
