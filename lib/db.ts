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
  }
}

export const db = new OrvexPOSDB();
