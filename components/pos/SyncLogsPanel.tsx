"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Activity,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Trash2,
    Clock,
    CloudUpload,
} from "lucide-react";
import { db, SyncLog } from "@/lib/db";
import { retryOrder } from "@/lib/sync-engine";
import { toast } from "sonner";

interface SyncLogsPanelProps {
    open: boolean;
    onClose: () => void;
}

export default function SyncLogsPanel({ open, onClose }: SyncLogsPanelProps) {
    // Live query all sync logs (most recent first)
    const syncLogs = useLiveQuery(
        () =>
            db.syncLogs
                .orderBy("timestamp")
                .reverse()
                .limit(200)
                .toArray(),
        [],
        []
    );

    // Group logs by orderUuid for summary view
    const orderSummaries = useLiveQuery(async () => {
        const orders = await db.orders.toArray();
        return orders.map((order) => ({
            uuid: order.uuid,
            status: order.status,
            customerName: order.customerName,
            grandTotal: order.grandTotal,
            createdAt: order.createdAt,
            syncRetries: order.syncRetries,
            syncError: order.syncError,
            syncedAt: order.syncedAt,
        }));
    }, [], []);

    const pendingOrders = orderSummaries.filter(
        (o) => o.status === "completed" || o.status === "sync_failed"
    );
    const syncedOrders = orderSummaries.filter((o) => o.status === "synced");

    const handleRetry = async (uuid: string) => {
        try {
            await retryOrder(uuid);
            toast.success("Order queued for retry");
        } catch {
            toast.error("Failed to queue retry");
        }
    };

    const handleClearLogs = async () => {
        try {
            await db.syncLogs.clear();
            toast.success("Sync logs cleared");
        } catch {
            toast.error("Failed to clear logs");
        }
    };

    const formatTime = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleTimeString("en-NP", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const formatDate = (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString("en-NP", {
            month: "short",
            day: "numeric",
        });
    };

    return (
        <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
            <SheetContent
                side="right"
                className="w-[440px] sm:max-w-[440px] p-0 flex flex-col"
            >
                <SheetHeader className="px-4 pt-4 pb-3 border-b">
                    <SheetTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            Sync Logs
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground hover:text-destructive"
                            onClick={handleClearLogs}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Clear
                        </Button>
                    </SheetTitle>
                </SheetHeader>

                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b bg-muted/20">
                    <div className="text-center">
                        <p className="text-lg font-bold text-amber-600">
                            {pendingOrders.length}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            Pending
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">
                            {syncedOrders.length}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            Synced
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-lg font-bold">
                            {syncLogs.length}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            Log Entries
                        </p>
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-2">
                        {syncLogs.length === 0 ? (
                            <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground">
                                <CloudUpload className="h-12 w-12 text-muted-foreground/30 mb-3" />
                                <p className="text-sm font-medium">No sync activity</p>
                                <p className="text-xs text-muted-foreground/70 mt-1">
                                    Sync logs will appear here after checkout
                                </p>
                            </div>
                        ) : (
                            syncLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-start gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors"
                                >
                                    {/* Status icon */}
                                    <div className="mt-0.5">
                                        {log.action === "sync_success" ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : log.action === "sync_failed" ? (
                                            <XCircle className="h-4 w-4 text-rose-500" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4 text-amber-500" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs text-muted-foreground">
                                                #{log.orderUuid.slice(0, 8).toUpperCase()}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className={`text-[10px] font-bold rounded-full ${
                                                    log.action === "sync_success"
                                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                        : log.action === "sync_failed"
                                                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                }`}
                                            >
                                                {log.action === "sync_success"
                                                    ? "Synced"
                                                    : log.action === "sync_failed"
                                                    ? "Failed"
                                                    : "Attempt"}
                                            </Badge>
                                        </div>
                                        {log.errorMessage && (
                                            <p className="text-xs text-rose-500 mt-1 truncate">
                                                {log.errorMessage}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                {formatDate(log.timestamp)}{" "}
                                                {formatTime(log.timestamp)}
                                            </span>
                                        </div>

                                        {/* Retry button for failed */}
                                        {log.action === "sync_failed" && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 h-7 text-xs rounded-lg"
                                                onClick={() =>
                                                    handleRetry(log.orderUuid)
                                                }
                                            >
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                Retry
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
