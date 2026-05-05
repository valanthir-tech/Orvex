import Dexie, { Table } from 'dexie';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  category: string;
  barcode: string | null;
  image: string | null;
  isActive: boolean;
  isSynced: boolean;
  updatedAt: Date;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  discount: number;
}

export interface Order {
  id?: number;
  uuid: string;
  status: 'draft' | 'held' | 'completed' | 'synced' | 'sync_failed';
  customerName: string;
  customerPan: string;
  subTotal: number;
  taxRate: number;
  taxTotal: number;
  grandTotal: number;
  discountTotal: number;
  products: CartItem[];
  paymentMode: 'CASH' | 'CARD' | 'QR' | 'CREDIT';
  paidAmount: number;
  changeAmount: number;
  createdAt: Date;
  syncedAt?: Date;
  syncError?: string;
  syncRetries: number;
}

export interface PosSession {
  id?: number;
  status: 'OPEN' | 'CLOSED';
  openingBalance: number;
  closingBalance?: number;
  openedAt: Date;
  closedAt?: Date;
  openedBy: string;
}

export interface SyncLog {
  id?: number;
  orderUuid: string;
  action: 'sync_attempt' | 'sync_success' | 'sync_failed' | 'sale_canceled' | 'item_removed';
  errorMessage?: string;
  timestamp: Date;
  responseData?: string;
}

export interface StaffProfile {
  id: string;
  tenant_id: string;
  role: string;
  full_name: string;
  pin_code: string;
  permissions: any;
}

export interface DeviceConfig {
  key: string;
  value: string;
}

export interface DevicePoolConfig {
  device_id: string;
  last_invoice_number: number;
  invoice_prefix: string;
  business_info: string;
}

export type OfflineInvoiceStatus =
  | 'pending_sync'
  | 'syncing'
  | 'synced'
  | 'failed'
  | 'conflict'
  | 'cancelled';

export interface OfflineInvoiceItem {
  item_code: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface OfflineInvoice {
  id?: number;
  local_invoice_number: string;
  status: OfflineInvoiceStatus;
  receipt_printed: boolean;
  synced_at: Date | null;
  created_at: Date;
  source_entry_id: string | null;
  erpnext_invoice_id?: string | null;
  items?: OfflineInvoiceItem[];
  total?: number;
  payment_method?: string;
  customer_name?: string;
  sync_attempts?: number;
  last_sync_attempt?: Date | null;
  sync_error?: string | null;
  receipt_html?: string | null;
  printed_at?: Date | null;
}

export interface TransactionLog {
  id?: number;
  entry_id: string;
  action: string;
  status: 'pending' | 'complete' | 'recovered' | 'failed';
  timestamp: Date;
  source_entry_id: string | null;
}

export interface CartBackup {
  id: string;
  items: CartItem[];
  timestamp: Date;
}

export interface PendingSMS {
  id?: number;
  invoice_id: number;
  phone: string;
  created_at: Date;
  status: 'pending' | 'sent' | 'failed';
}

// ----------------------------------------------------------------------
// DATABASE CLASS
// ----------------------------------------------------------------------

export class OrvexPOSDB extends Dexie {
  products!: Table<Product>;
  orders!: Table<Order>;
  failedOrders!: Table<Order>;
  sessions!: Table<PosSession>;
  syncLogs!: Table<SyncLog>;
  staffProfiles!: Table<StaffProfile>;
  configStore!: Table<DeviceConfig>;
  device_config!: Table<DevicePoolConfig, string>;
  offline_invoices!: Table<OfflineInvoice>;
  transaction_log!: Table<TransactionLog>;
  cart_backup!: Table<CartBackup, string>;
  pending_sms!: Table<PendingSMS>;

  constructor() {
    super('OrvexPOSDB');

    this.version(1).stores({
      products: '&id, name, sku, category, barcode, isActive',
      orders: '++id, &uuid, status, createdAt, paymentMode',
      sessions: '++id, status, openedBy',
      syncLogs: '++id, orderUuid, action, timestamp',
    });
    
    this.version(2).stores({
      products: '&id, name, sku, category, barcode, isActive',
      orders: '++id, &uuid, status, createdAt, paymentMode',
      failedOrders: '++id, &uuid, status, createdAt, paymentMode',
      sessions: '++id, status, openedBy',
      syncLogs: '++id, orderUuid, action, timestamp',
    });

    this.version(3).stores({
      products: '&id, name, sku, category, barcode, isActive',
      orders: '++id, &uuid, status, createdAt, paymentMode',
      failedOrders: '++id, &uuid, status, createdAt, paymentMode',
      sessions: '++id, status, openedBy',
      syncLogs: '++id, orderUuid, action, timestamp',
      staffProfiles: '&id, tenant_id, role, pin_code',
      configStore: '&key',
    });

    this.version(4).stores({
      products: '&id, name, sku, category, barcode, isActive',
      orders: '++id, &uuid, status, createdAt, paymentMode',
      failedOrders: '++id, &uuid, status, createdAt, paymentMode',
      sessions: '++id, status, openedBy',
      syncLogs: '++id, orderUuid, action, timestamp',
      staffProfiles: '&id, tenant_id, role, pin_code',
      configStore: '&key',
      device_config: '&device_id, last_invoice_number, invoice_prefix, business_info',
      offline_invoices: '++id, local_invoice_number, status, receipt_printed, synced_at, created_at, source_entry_id',
      transaction_log: '++id, &entry_id, action, status, timestamp, source_entry_id',
      cart_backup: '&id, items, timestamp',
    });

    this.version(5).stores({
      products: '&id, name, sku, category, barcode, isActive',
      orders: '++id, &uuid, status, createdAt, paymentMode',
      failedOrders: '++id, &uuid, status, createdAt, paymentMode',
      sessions: '++id, status, openedBy',
      syncLogs: '++id, orderUuid, action, timestamp',
      staffProfiles: '&id, tenant_id, role, pin_code',
      configStore: '&key',
      device_config: '&device_id, last_invoice_number, invoice_prefix, business_info',
      offline_invoices: '++id, local_invoice_number, status, receipt_printed, synced_at, created_at, source_entry_id',
      transaction_log: '++id, &entry_id, action, status, timestamp, source_entry_id',
      cart_backup: '&id, items, timestamp',
      pending_sms: '++id, invoice_id, phone, created_at, status',
    });
  }
}

export const db = new OrvexPOSDB();
