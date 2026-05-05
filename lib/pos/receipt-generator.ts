'use client';

import { db, OfflineInvoice } from '@/lib/db';
import { formatToBikramSambat } from '@/lib/nepali-date';
import { logger } from '@/lib/logger';
import { getDeviceId } from '@/lib/pos/invoice-generator';

interface BusinessInfo {
  business_name?: string;
  address?: string;
  phone?: string;
  pan_number?: string;
}

export interface ReceiptInvoiceItem {
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface ReceiptInvoice {
  id: number;
  local_invoice_number: string;
  status: string;
  created_at: Date;
  items: ReceiptInvoiceItem[];
  total: number;
  payment_method: string;
  customer_name?: string;
}

interface OfflineInvoiceRecord extends OfflineInvoice {
  receipt_html?: string | null;
}

class ReceiptGenerationError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'ReceiptGenerationError';
  }
}

function parseBusinessInfo(raw: string): BusinessInfo {
  if (!raw || !raw.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    const record = parsed as Record<string, unknown>;
    return {
      business_name: typeof record.business_name === 'string' ? record.business_name : undefined,
      address: typeof record.address === 'string' ? record.address : undefined,
      phone: typeof record.phone === 'string' ? record.phone : undefined,
      pan_number: typeof record.pan_number === 'string' ? record.pan_number : undefined,
    };
  } catch (error: unknown) {
    logger.warn('Failed to parse device business_info for receipt.', { error });
    return {};
  }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function padRight(value: string, width: number): string {
  if (value.length >= width) {
    return value.slice(0, width);
  }
  return value + ' '.repeat(width - value.length);
}

function padLeft(value: string, width: number): string {
  if (value.length >= width) {
    return value.slice(0, width);
  }
  return ' '.repeat(width - value.length) + value;
}

function buildReceipt(invoice: ReceiptInvoice, businessInfo: BusinessInfo): string {
  const line = '-'.repeat(40);
  const createdAt = new Date(invoice.created_at);
  const bsDate = formatToBikramSambat(createdAt);
  const time = createdAt.toLocaleTimeString('en-GB', { hour12: false });

  const itemsTotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
  const receiptLines: string[] = [];

  receiptLines.push('        ' + (businessInfo.business_name ?? 'ORVEX POS'));
  if (businessInfo.address) receiptLines.push(`  ${businessInfo.address}`);
  if (businessInfo.phone) receiptLines.push(`  Ph: ${businessInfo.phone}`);
  if (businessInfo.pan_number) receiptLines.push(`  PAN: ${businessInfo.pan_number}`);
  receiptLines.push(line);
  receiptLines.push(`Invoice: ${invoice.local_invoice_number}`);
  receiptLines.push(`Date: ${bsDate}`);
  receiptLines.push(`Time: ${time}`);
  receiptLines.push(`Customer: ${invoice.customer_name ?? 'Walk-in Customer'}`);
  receiptLines.push(line);
  receiptLines.push(`${padRight('Item', 20)}${padLeft('Qty', 5)}${padLeft('Rate', 7)}${padLeft('Amt', 8)}`);
  receiptLines.push(line);

  invoice.items.forEach((item) => {
    const name = padRight(item.item_name, 20);
    const qty = padLeft(String(item.qty), 5);
    const rate = padLeft(formatCurrency(item.rate), 7);
    const amount = padLeft(formatCurrency(item.amount), 8);
    receiptLines.push(`${name}${qty}${rate}${amount}`);
  });

  receiptLines.push(line);
  receiptLines.push(`${padRight('Subtotal:', 32)}${padLeft(formatCurrency(itemsTotal), 8)}`);
  receiptLines.push(`${padRight('Total:', 32)}${padLeft(formatCurrency(invoice.total), 8)}`);
  receiptLines.push(`${padRight('Payment:', 32)}${padLeft(invoice.payment_method, 8)}`);
  receiptLines.push(line);

  if (invoice.status === 'pending_sync') {
    receiptLines.push('** OFFLINE SALE - Will sync automatically **');
    receiptLines.push(line);
  }

  receiptLines.push('Thank you for shopping with us!');
  receiptLines.push('\n\n');

  return receiptLines.join('\n');
}

async function getBusinessInfo(): Promise<BusinessInfo> {
  const deviceId = await getDeviceId();
  const config = await db.device_config.get(deviceId);

  if (config?.business_info) {
    return parseBusinessInfo(config.business_info);
  }

  const fallbackConfig = await db.device_config.orderBy('device_id').first();
  if (fallbackConfig?.business_info) {
    return parseBusinessInfo(fallbackConfig.business_info);
  }

  return {};
}

export async function generateReceiptESCPOS(invoice: ReceiptInvoice): Promise<string> {
  try {
    const businessInfo = await getBusinessInfo();
    const receipt = buildReceipt(invoice, businessInfo);

    const offlineInvoices = db.table<OfflineInvoiceRecord>('offline_invoices');
    await offlineInvoices.update(invoice.id, { receipt_html: receipt });

    return receipt;
  } catch (error: unknown) {
    logger.error('Failed generating/storing offline receipt content.', { error, invoiceId: invoice.id });
    throw new ReceiptGenerationError('Failed to generate receipt content.', error);
  }
}

