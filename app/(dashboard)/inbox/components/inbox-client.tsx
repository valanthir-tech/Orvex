"use client"

import * as React from "react"
import { useState, useTransition } from "react"
import { Search, Mail, Filter, Reply, CheckCircle2, Clock, Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateInquiryStatus, sendInquiryReply } from "@/app/actions/inbox"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export function InboxClient({ initialInquiries }: { initialInquiries: any[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [isPending, startTransition] = useTransition()
  
  const selectedMessage = initialInquiries.find(m => m.id === selectedId)

  const handleStatusChange = (newStatus: 'new' | 'in-progress' | 'resolved') => {
    if (!selectedMessage) return
    startTransition(async () => {
      try {
        await updateInquiryStatus(selectedMessage.id, newStatus)
        toast.success(`Marked as ${newStatus}`)
      } catch (err: any) {
        toast.error("Failed: " + err.message)
      }
    })
  }

  const handleReply = () => {
    if (!selectedMessage || !replyText.trim()) return
    startTransition(async () => {
      try {
        await sendInquiryReply(selectedMessage.id, selectedMessage.customer_email, replyText)
        toast.success(`Reply sent to ${selectedMessage.customer_email}`)
        setReplyText("")
      } catch (err: any) {
        toast.error("Failed to send reply: " + err.message)
      }
    })
  }

  return (
    <div className="flex flex-1 border rounded-xl overflow-hidden shadow-sm bg-background">
      {/* LEFT: LIST */}
      <div className="w-1/3 flex flex-col border-r h-[calc(100vh-14rem)]">
        <div className="p-4 border-b space-y-3 bg-muted/40">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Mail className="h-5 w-5" /> 
              Inquiries
              <Badge variant="secondary" className="ml-2">3</Badge>
            </h3>
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search messages..." className="pl-8 bg-background" />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-2">
            {initialInquiries.length === 0 && (
               <div className="p-8 text-center text-sm font-medium text-muted-foreground">No inquiries yet.</div>
            )}
            {initialInquiries.map((msg) => (
              <button
                key={msg.id}
                onClick={() => setSelectedId(msg.id)}
                className={`flex flex-col items-start p-3 text-left border rounded-lg transition-all ${
                  selectedId === msg.id 
                    ? "bg-accent ring-1 ring-ring" 
                    : "hover:bg-muted/50 border-transparent bg-background"
                }`}
              >
                <div className="flex w-full justify-between items-baseline mb-1">
                  <span className="font-semibold">{msg.customer_name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis ml-2 pl-1 max-w-[80px] text-right">
                    {msg.created_at ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true }) : ""}
                  </span>
                </div>
                <span className="text-sm font-medium mb-1 truncate w-full">{msg.subject}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{msg.body}</span>
                <div className="flex mt-2 gap-2">
                  {msg.status === 'new' && <Badge className="text-[10px] h-5 bg-blue-500 hover:bg-blue-600">New</Badge>}
                  {msg.status === 'in-progress' && <Badge variant="secondary" className="text-[10px] h-5"><Clock className="mr-1 h-3 w-3"/> In Progress</Badge>}
                  {msg.status === 'resolved' && <Badge variant="outline" className="text-[10px] h-5 text-green-600 border-green-200"><CheckCircle2 className="mr-1 h-3 w-3"/> Resolved</Badge>}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT: DETAIL */}
      <div className="w-2/3 flex flex-col bg-background relative h-[calc(100vh-14rem)]">
        {selectedMessage ? (
          <>
            <div className="p-6 flex flex-col h-full">
              <div className="flex justify-between items-start border-b pb-6 mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedMessage.customer_name}</span> 
                    <span>({selectedMessage.customer_email})</span>
                  </div>
                </div>
                {selectedMessage.context_product_id && (
                  <Badge variant="outline" className="bg-muted/50 py-1 px-3">
                    Viewing: <span className="font-semibold ml-1">{selectedMessage.context_product_id}</span>
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm leading-relaxed">
                    {selectedMessage.body}
                  </div>
                </div>
              </ScrollArea>

              <div className="mt-auto pt-6 border-t">
                <div className="bg-muted/20 border rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                  <Textarea 
                    placeholder="Type your reply here... (Will send as email)" 
                    className="border-0 focus-visible:ring-0 resize-none rounded-none min-h-[120px] bg-transparent"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    disabled={isPending}
                  />
                  <div className="flex justify-between items-center p-3 bg-muted/30 border-t">
                    <div className="flex gap-2">
                       {selectedMessage.status !== 'in-progress' && selectedMessage.status !== 'resolved' && (
                         <Button onClick={() => handleStatusChange('in-progress')} variant="outline" size="sm" disabled={isPending}>Mark In-Progress</Button>
                       )}
                       {selectedMessage.status !== 'resolved' && (
                         <Button onClick={() => handleStatusChange('resolved')} variant="outline" size="sm" disabled={isPending}>Mark Resolved</Button>
                       )}
                    </div>
                    <Button onClick={handleReply} size="sm" className="gap-2" disabled={isPending || !replyText.trim()}>
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Reply className="h-4 w-4" />} 
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 h-full">
            <Mail className="h-12 w-12 mb-4 opacity-20" />
            <p>Select a message from the list to view the conversation</p>
          </div>
        )}
      </div>
    </div>
  )
}
