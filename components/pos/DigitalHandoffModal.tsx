"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface DigitalHandoffPayload {
  invoice_id: number;
  invoice_number: string;
  total: number;
  items: Array<{
    name: string;
    qty: number;
    amount: number;
  }>;
  date: string;
  business_name: string;
}

interface DigitalHandoffModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: DigitalHandoffPayload | null;
}

export function DigitalHandoffModal({
  open,
  onOpenChange,
  payload,
}: DigitalHandoffModalProps) {
  const [phone, setPhone] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  const handoffJson = useMemo(() => {
    if (!payload) {
      return "";
    }
    return JSON.stringify(
      {
        invoice_number: payload.invoice_number,
        total: payload.total,
        items: payload.items,
        date: payload.date,
        business_name: payload.business_name,
      },
      null,
      2
    );
  }, [payload]);

  async function handleSavePhone(): Promise<void> {
    if (!payload || !phone.trim()) {
      return;
    }

    setIsSavingPhone(true);
    try {
      await db.pending_sms.add({
        invoice_id: payload.invoice_id,
        phone: phone.trim(),
        created_at: new Date(),
        status: "pending",
      });

      toast.success("SMS request queued for when the device is online.");
      setPhone("");
    } catch (error: unknown) {
      logger.error("Failed to queue pending SMS receipt handoff.", { error });
      toast.error("Could not queue SMS request.");
    } finally {
      setIsSavingPhone(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Printer Unavailable</DialogTitle>
          <DialogDescription>
            Please photograph this screen as your receipt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* TODO: Install `react-qr-code` and render a QR code for this payload instead of <pre>. */}
          <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
            {handoffJson}
          </pre>

          <div className="space-y-2">
            <label htmlFor="handoff-phone" className="text-sm font-medium">
              Send via SMS when online? (optional)
            </label>
            <div className="flex gap-2">
              <Input
                id="handoff-phone"
                placeholder="98XXXXXXXX"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSavePhone}
                disabled={isSavingPhone || !phone.trim() || !payload}
              >
                {isSavingPhone ? "Saving..." : "Queue SMS"}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

