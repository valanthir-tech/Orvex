'use client';

import { db, OfflineInvoice, OfflineInvoiceItem } from '@/lib/db';
import { logger } from '@/lib/logger';

const INITIAL_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 60_000;
const SYNC_INTERVAL_MS = 30_000;

interface SyncInvoiceRequest {
  local_invoice_number: string;
  pos_uuid: string;
  total: number;
  payment_method: string;
  customer_name: string;
  items: OfflineInvoiceItem[];
}

type SyncInvoiceApiStatus = 'synced' | 'already_synced' | 'conflict' | 'retry';

interface SyncInvoiceApiResponse {
  status: SyncInvoiceApiStatus;
  invoiceId?: string;
  reason?: string;
}

class SyncEngineError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'SyncEngineError';
  }
}

function isOfflineInvoiceItem(value: unknown): value is OfflineInvoiceItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.item_code === 'string' &&
    typeof candidate.qty === 'number' &&
    Number.isFinite(candidate.qty) &&
    candidate.qty > 0 &&
    typeof candidate.rate === 'number' &&
    Number.isFinite(candidate.rate) &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount)
  );
}

function getBackoffDelayMs(syncAttempts: number): number {
  if (syncAttempts <= 0) {
    return INITIAL_BACKOFF_MS;
  }

  const exponent = Math.max(0, syncAttempts - 1);
  return Math.min(INITIAL_BACKOFF_MS * 2 ** exponent, MAX_BACKOFF_MS);
}

function shouldAttemptSync(invoice: OfflineInvoice): boolean {
  const attempts = invoice.sync_attempts ?? 0;
  const lastAttempt = invoice.last_sync_attempt ?? null;

  if (attempts <= 0 || !lastAttempt) {
    return true;
  }

  const elapsed = Date.now() - new Date(lastAttempt).getTime();
  return elapsed >= getBackoffDelayMs(attempts);
}

function deriveItems(invoice: OfflineInvoice): OfflineInvoiceItem[] {
  if (!Array.isArray(invoice.items)) {
    return [];
  }

  return invoice.items.filter(isOfflineInvoiceItem);
}

function deriveTotal(invoice: OfflineInvoice, items: OfflineInvoiceItem[]): number {
  if (typeof invoice.total === 'number' && Number.isFinite(invoice.total) && invoice.total > 0) {
    return invoice.total;
  }

  return items.reduce((sum, item) => sum + item.amount, 0);
}

function derivePaymentMethod(invoice: OfflineInvoice): string {
  const value = (invoice.payment_method ?? '').trim().toUpperCase();
  if (!value) {
    return 'CASH';
  }

  return value;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof SyncEngineError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown synchronization error.';
}

function parseApiResponse(payload: unknown): SyncInvoiceApiResponse {
  if (!payload || typeof payload !== 'object') {
    throw new SyncEngineError('Invalid sync response payload.');
  }

  const candidate = payload as Record<string, unknown>;
  const status = candidate.status;
  if (
    status !== 'synced' &&
    status !== 'already_synced' &&
    status !== 'conflict' &&
    status !== 'retry'
  ) {
    throw new SyncEngineError('Sync response is missing a valid status.');
  }

  const parsed: SyncInvoiceApiResponse = { status };
  if (typeof candidate.invoiceId === 'string' && candidate.invoiceId.trim().length > 0) {
    parsed.invoiceId = candidate.invoiceId;
  }
  if (typeof candidate.reason === 'string' && candidate.reason.trim().length > 0) {
    parsed.reason = candidate.reason;
  }
  return parsed;
}

async function callOfflineInvoiceSyncApi(payload: SyncInvoiceRequest): Promise<SyncInvoiceApiResponse> {
  let response: Response;
  try {
    response = await fetch('/api/sync/offline-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice: payload }),
    });
  } catch (error: unknown) {
    throw new SyncEngineError('Network error while syncing offline invoice.', error);
  }

  let responsePayload: unknown = null;
  try {
    responsePayload = await response.json();
  } catch (error: unknown) {
    throw new SyncEngineError('Failed to parse sync API response.', error);
  }

  if (!response.ok) {
    const parsed = parseApiResponse(responsePayload);
    const reason = parsed.reason ?? `Sync API failed with status ${response.status}.`;
    throw new SyncEngineError(reason);
  }

  return parseApiResponse(responsePayload);
}

async function markInvoiceAsSyncing(invoiceId: number, syncAttempts: number, attemptTimestamp: Date): Promise<void> {
  await db.offline_invoices.update(invoiceId, {
    status: 'syncing',
    sync_attempts: syncAttempts,
    last_sync_attempt: attemptTimestamp,
    sync_error: null,
  });
}

async function markInvoiceAsPendingRetry(
  invoiceId: number,
  syncAttempts: number,
  attemptTimestamp: Date,
  reason: string,
): Promise<void> {
  await db.offline_invoices.update(invoiceId, {
    status: 'pending_sync',
    sync_attempts: syncAttempts,
    last_sync_attempt: attemptTimestamp,
    sync_error: reason,
  });
}

async function processSingleInvoice(invoice: OfflineInvoice): Promise<void> {
  if (typeof invoice.id !== 'number') {
    logger.warn('Offline invoice is missing a numeric ID and was skipped.', {
      local_invoice_number: invoice.local_invoice_number,
    });
    return;
  }

  if (invoice.status !== 'pending_sync' && invoice.status !== 'syncing') {
    return;
  }

  if (!shouldAttemptSync(invoice)) {
    return;
  }

  const items = deriveItems(invoice);
  const total = deriveTotal(invoice, items);
  const paymentMethod = derivePaymentMethod(invoice);
  const customerName = (invoice.customer_name ?? 'Walk-in Customer').trim() || 'Walk-in Customer';
  const posUuid = (invoice.source_entry_id ?? invoice.local_invoice_number).trim();

  if (items.length === 0 || total <= 0 || !posUuid) {
    await db.offline_invoices.update(invoice.id, {
      status: 'conflict',
      sync_error: 'Invoice payload is incomplete and cannot be synchronized.',
    });
    return;
  }

  const nextAttempt = (invoice.sync_attempts ?? 0) + 1;
  const attemptTime = new Date();
  await markInvoiceAsSyncing(invoice.id, nextAttempt, attemptTime);

  const requestPayload: SyncInvoiceRequest = {
    local_invoice_number: invoice.local_invoice_number,
    pos_uuid: posUuid,
    total,
    payment_method: paymentMethod,
    customer_name: customerName,
    items,
  };

  try {
    const result = await callOfflineInvoiceSyncApi(requestPayload);

    if (result.status === 'synced' || result.status === 'already_synced') {
      await db.offline_invoices.update(invoice.id, {
        status: 'synced',
        erpnext_invoice_id: result.invoiceId ?? null,
        synced_at: new Date(),
        sync_attempts: nextAttempt,
        last_sync_attempt: attemptTime,
        sync_error: null,
      });
      return;
    }

    if (result.status === 'conflict') {
      await db.offline_invoices.update(invoice.id, {
        status: 'conflict',
        sync_attempts: nextAttempt,
        last_sync_attempt: attemptTime,
        sync_error: result.reason ?? 'Stock conflict detected while syncing invoice.',
      });
      return;
    }

    await markInvoiceAsPendingRetry(
      invoice.id,
      nextAttempt,
      attemptTime,
      result.reason ?? 'Temporary sync failure. Will retry automatically.',
    );
  } catch (error: unknown) {
    await markInvoiceAsPendingRetry(invoice.id, nextAttempt, attemptTime, extractErrorMessage(error));
  }
}

export async function syncOfflineInvoices(invoiceList: OfflineInvoice[]): Promise<void> {
  for (const invoice of invoiceList) {
    await processSingleInvoice(invoice);
  }
}

export async function syncPendingOfflineInvoices(): Promise<void> {
  const pendingInvoices = await db.offline_invoices
    .where('status')
    .anyOf(['pending_sync', 'syncing'])
    .sortBy('created_at');

  await syncOfflineInvoices(pendingInvoices);
}

export async function getPendingOfflineInvoiceCount(): Promise<number> {
  return db.offline_invoices.where('status').anyOf(['pending_sync', 'syncing']).count();
}

let syncTriggersInitialized = false;
let syncCycleInProgress = false;

function canRunSyncCycle(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return navigator.onLine;
}

async function runSyncCycle(): Promise<void> {
  if (syncCycleInProgress || !canRunSyncCycle()) {
    return;
  }

  syncCycleInProgress = true;
  try {
    await syncPendingOfflineInvoices();
  } catch (error: unknown) {
    logger.error('Offline invoice sync cycle failed.', { error });
  } finally {
    syncCycleInProgress = false;
  }
}

export function setupSyncTriggers(): () => void {
  if (typeof window === 'undefined' || syncTriggersInitialized) {
    return () => {};
  }

  syncTriggersInitialized = true;

  const onOnline = () => {
    void runSyncCycle();
  };

  window.addEventListener('online', onOnline);
  const intervalId = window.setInterval(() => {
    void runSyncCycle();
  }, SYNC_INTERVAL_MS);

  // Startup run ensures pending invoices are attempted as soon as the app boots online.
  void runSyncCycle();

  return () => {
    window.removeEventListener('online', onOnline);
    window.clearInterval(intervalId);
    syncTriggersInitialized = false;
  };
}

