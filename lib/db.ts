import Dexie, { Table } from 'dexie';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

export interface Item {
  id: string; // SKU or UUID from Supabase
  name: string;
  price: number;
  stock: number;
  categoryId?: string;
  barcode?: string;
  image?: string;
  // Sync Status
  isSynced: boolean; 
  updatedAt: Date;
}

export interface CartItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
}

export interface Order {
  id?: number; // Local auto-increment ID
  uuid: string; // Global UUID
  status: 'draft' | 'held' | 'completed' | 'synced';
  
  // Customer Info
  customerName?: string;
  customerPan?: string;
  
  // Financials
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  discountTotal: number;
  
  // Data
  items: CartItem[];
  paymentMode: 'CASH' | 'CARD' | 'QR' | 'CREDIT';
  
  // Meta
  createdAt: Date;
  syncedAt?: Date;
}

export interface PosSession {
  id?: number;
  status: 'OPEN' | 'CLOSED';
  openingBalance: number;
  closingBalance?: number;
  openedAt: Date;
  closedAt?: Date;
  openedBy: string; // User ID
}

// ----------------------------------------------------------------------
// DATABASE CLASS
// ----------------------------------------------------------------------

export class ValanthirConnectDB extends Dexie {
  items!: Table<Item>;
  orders!: Table<Order>;
  sessions!: Table<PosSession>;

  constructor() {
    super('ValanthirConnectDB');
    
    // Define Schema
    // ++id = auto-increment
    // & = unique index
    // * = multi-entry index
    this.version(1).stores({
      items: '&id, name, categoryId, barcode', 
      orders: '++id, &uuid, status, createdAt',
      sessions: '++id, status, openedBy'
    });
  }
}

export const db = new ValanthirConnectDB();
