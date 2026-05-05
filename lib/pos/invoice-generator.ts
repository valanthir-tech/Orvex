'use client';

import { v7 as uuidv7 } from 'uuid';
import { db, DevicePoolConfig, OfflineInvoice } from '@/lib/db';
import { logger } from '@/lib/logger';

const DEVICE_ID_STORAGE_KEY = 'orvex_device_id';

export interface LocalSaleItem {
  item_code: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface LocalSaleData {
  items: LocalSaleItem[];
  total: number;
  payment_method: string;
  customer_name?: string;
  source_entry_id?: string | null;
}

export interface GeneratedOfflineInvoice extends OfflineInvoice {
  id: number;
  erpnext_invoice_id: string | null;
  items: LocalSaleItem[];
  total: number;
  payment_method: string;
  customer_name: string;
  sync_attempts: number;
  last_sync_attempt: Date | null;
  sync_error: string | null;
  receipt_html: string | null;
  printed_at: Date | null;
}

class InvoiceGeneratorError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'InvoiceGeneratorError';
  }
}

function getLocalStorageDeviceId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    return storedValue && storedValue.trim() ? storedValue : null;
  } catch (error: unknown) {
    logger.warn('Failed to read device ID from localStorage.', { error });
    return null;
  }
}

function setLocalStorageDeviceId(deviceId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
  } catch (error: unknown) {
    logger.warn('Failed to persist device ID to localStorage.', { error });
  }
}

function buildInvoicePrefix(deviceId: string): string {
  return `OFFLINE-${deviceId}`;
}

async function ensureDeviceConfig(deviceId: string): Promise<DevicePoolConfig> {
  const existingConfig = await db.device_config.get(deviceId);
  if (existingConfig) {
    return existingConfig;
  }

  const newConfig: DevicePoolConfig = {
    device_id: deviceId,
    last_invoice_number: 0,
    invoice_prefix: buildInvoicePrefix(deviceId),
    business_info: '',
  };

  await db.device_config.put(newConfig);
  return newConfig;
}

export async function getDeviceId(): Promise<string> {
  try {
    const existingConfig = await db.device_config.orderBy('device_id').first();
    if (existingConfig?.device_id) {
      setLocalStorageDeviceId(existingConfig.device_id);
      return existingConfig.device_id;
    }

    const localStorageDeviceId = getLocalStorageDeviceId();
    if (localStorageDeviceId) {
      await ensureDeviceConfig(localStorageDeviceId);
      return localStorageDeviceId;
    }

    const newDeviceId = uuidv7();
    setLocalStorageDeviceId(newDeviceId);
    await ensureDeviceConfig(newDeviceId);
    return newDeviceId;
  } catch (error: unknown) {
    logger.error('Failed to resolve POS device ID.', { error });
    throw new InvoiceGeneratorError('Failed to resolve POS device ID.', error);
  }
}

export async function generateLocalInvoice(saleData: LocalSaleData): Promise<GeneratedOfflineInvoice> {
  try {
    let createdInvoice: GeneratedOfflineInvoice | null = null;

    await db.transaction('rw', db.device_config, db.offline_invoices, async () => {
      const deviceId = await getDeviceId();
      await ensureDeviceConfig(deviceId);

      let nextInvoiceNumber: number | null = null;
      let invoicePrefix = buildInvoicePrefix(deviceId);

      const updatedRows = await db.device_config
        .where('device_id')
        .equals(deviceId)
        .modify((config) => {
          const currentInvoiceNumber = Number.isFinite(config.last_invoice_number)
            ? config.last_invoice_number
            : 0;

          const nextNumber = currentInvoiceNumber + 1;
          config.last_invoice_number = nextNumber;
          config.invoice_prefix = config.invoice_prefix || buildInvoicePrefix(deviceId);

          nextInvoiceNumber = nextNumber;
          invoicePrefix = config.invoice_prefix;
        });

      if (updatedRows === 0 || nextInvoiceNumber === null) {
        throw new InvoiceGeneratorError('Unable to increment local invoice counter.');
      }

      const localInvoiceNumber = `${invoicePrefix}-${String(nextInvoiceNumber).padStart(5, '0')}`;
      const createdAt = new Date();

      const invoiceRecord: Omit<GeneratedOfflineInvoice, 'id'> = {
        local_invoice_number: localInvoiceNumber,
        status: 'pending_sync',
        receipt_printed: false,
        synced_at: null,
        created_at: createdAt,
        source_entry_id: saleData.source_entry_id ?? null,
        erpnext_invoice_id: null,
        items: saleData.items,
        total: saleData.total,
        payment_method: saleData.payment_method,
        customer_name: saleData.customer_name ?? 'Walk-in Customer',
        sync_attempts: 0,
        last_sync_attempt: null,
        sync_error: null,
        receipt_html: null,
        printed_at: null,
      };

      const invoiceId = await db.offline_invoices.add(invoiceRecord);
      createdInvoice = {
        ...invoiceRecord,
        id: Number(invoiceId),
      };
    });

    if (!createdInvoice) {
      throw new InvoiceGeneratorError('Local invoice generation failed with no result.');
    }

    return createdInvoice;
  } catch (error: unknown) {
    logger.error('Failed to generate local offline invoice.', { error });
    if (error instanceof InvoiceGeneratorError) {
      throw error;
    }
    throw new InvoiceGeneratorError('Failed to generate local offline invoice.', error);
  }
}

