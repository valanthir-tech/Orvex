"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ApproveButton({ signupId }: { signupId: string }) {
    const [isDeploying, setIsDeploying] = useState(false)

    const handleApprove = async () => {
        setIsDeploying(true)
        try {
            const res = await fetch('/api/tenants/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ signupId })
            })

            if (res.ok) {
                window.location.reload()
                // Do not set isDeploying(false) so it stays disabled while page reloads
            } else {
                const err = await res.json()
                alert('Deploy Error: ' + err.error)
                setIsDeploying(false)
            }
        } catch (error) {
            alert('Network error occurred while attempting to provision the workspace.')
            setIsDeploying(false)
        }
    }

    return (
        <Button
            size="sm"
            type="button"
            className="gap-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={handleApprove}
            disabled={isDeploying}
        >
            <Check className="h-4 w-4 mr-1" />
            {isDeploying ? 'Deploying...' : 'Approve & Deploy'}
        </Button>
    )
}
