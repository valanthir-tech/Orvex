"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deleteInvoice } from "@/app/actions/pos"
import { db } from "@/lib/db"

export function DeleteTransactionButton({ id }: { id: string }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        if (!confirm("Are you sure you want to cancel and delete this transaction?")) return;
        setIsDeleting(true)
        try {
            await deleteInvoice(id)
            
            // Log this action offline for the Activity Log
            try {
                await db.syncLogs.add({
                    orderUuid: id,
                    action: 'sale_canceled',
                    errorMessage: "Transaction " + id + " was manually cancelled/deleted.",
                    timestamp: new Date().toISOString(),
                    status: 'completed',
                    details: { message: "Cashier cancelled the saved transaction from the dashboard." }
                } as any)
            } catch(e) {}

            router.push("/dashboard")
            router.refresh()
        } catch (error) {
            console.error("Failed to delete", error)
            alert("Failed to delete transaction. Please try again.")
            setIsDeleting(false)
        }
    }

    return (
        <Button variant="destructive" size="sm" className="gap-2" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 className="w-4 h-4" /> {isDeleting ? "Deleting..." : "Cancel & Delete Transaction"}
        </Button>
    )
}
