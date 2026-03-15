"use client"

import { useState } from "react"
import { MessageCircle, Send, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

interface FeedbackDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
    const [type, setType] = useState("general")
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [sent, setSent] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!message.trim()) return
        setIsSending(true)
        try {
            const supabase = createSupabaseBrowserClient()
            const { data: { user } } = await supabase.auth.getUser()
            await supabase.from("feedback").insert({
                user_id: user?.id ?? null,
                email: user?.email ?? null,
                type,
                message: message.trim(),
            })
            setSent(true)
            setMessage("")
            setType("general")
            setTimeout(() => {
                setSent(false)
                onOpenChange(false)
            }, 2000)
        } catch {
            // silently fail — feedback is non-critical
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[460px] rounded-2xl border-0 p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <MessageCircle className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-heading">Send Feedback</DialogTitle>
                            <DialogDescription className="text-sm">
                                Help us improve Valanthir IMS
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {sent ? (
                    <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
                        <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                            <Send className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="font-semibold">Thank you for your feedback!</p>
                        <p className="text-sm text-muted-foreground">We&apos;ll review it shortly.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
                        <div className="space-y-1.5">
                            <Label>Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-10">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="bug">Bug Report</SelectItem>
                                    <SelectItem value="feature">Feature Request</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Message</Label>
                            <Textarea
                                placeholder="Tell us what you think, report an issue, or suggest an improvement…"
                                rows={4}
                                className="resize-none"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 rounded-xl"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSending || !message.trim()}
                                className="flex-1 rounded-xl gap-2"
                            >
                                {isSending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                Send Feedback
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
