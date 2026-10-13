import { DocStatus } from './types';

export interface Item {
  name: string;
  item_code: string;
  item_name: string;
  category: string;
  stock_qty: number;
  standard_rate: number;
  valuation_rate: number;
  barcode: string;
  uom: string;
}

export interface Customer {
  name: string;
  customer_name: string;
  phone: string;
  pan_no: string;
  email: string;
  address: string;
}

export interface Supplier {
  name: string;
  supplier_name: string;
  phone: string;
  pan_no: string;
  email: string;
  address: string;
}

export interface InvoiceItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  discount: number;
  amount: number;
}

export interface SalesInvoice {
  name: string;
  customer: string;
  posting_date: string;
  due_date: string;
  items: InvoiceItem[];
  net_total: number;
  vat_amount: number;
  grand_total: number;
  docstatus: DocStatus;
}

export interface PurchaseBillItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface PurchaseBill {
  name: string;
  supplier: string;
  posting_date: string;
  bill_no: string;
  items: PurchaseBillItem[];
  net_total: number;
  vat_amount: number;
  grand_total: number;
  docstatus: DocStatus;
}

export interface StockCountItem {
  item_code: string;
  item_name: string;
  system_qty: number;
  counted_qty: number;
  difference: number;
}

export interface StockCount {
  name: string;
  count_date: string;
  items: StockCountItem[];
  remarks: string;
  docstatus: DocStatus;
}

export interface StockLedgerEntry {
  name: string;
  posting_date: string;
  item_code: string;
  voucher_type: string;
  voucher_no: string;
  actual_qty: number; // positive = IN, negative = OUT
  running_qty: number;
}

export interface JournalAccountLine {
  account: string;
  debit: number;
  credit: number;
  remarks: string;
}

export interface JournalEntry {
  name: string;
  posting_date: string;
  accounts: JournalAccountLine[];
  total_debit: number;
  total_credit: number;
  difference: number;
  docstatus: DocStatus;
}

export interface OnlineOrder {
  name: string;
  customer_name: string;
  channel: 'Website' | 'Instagram' | 'Facebook' | 'WhatsApp';
  phone: string;
  address: string;
  items_summary: string;
  grand_total: number;
  payment_status: 'Paid' | 'Unpaid' | 'Pending';
  fulfillment_status: 'Unfulfilled' | 'Packed' | 'Shipped';
  delivery_status: 'Processing' | 'Out for Delivery' | 'Delivered';
  courier?: 'Upaya' | 'Pathao';
  tracking_id?: string;
  created_at: string;
}

export interface AccountNode {
  name: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
  parent_account: string | null;
  balance: number;
}

// Initial Mock Datasets
export const initialItems: Item[] = [
  { name: 'ITEM-001', item_code: 'ITEM-001', item_name: 'Wai Wai Noodles (Pack of 30)', category: 'Grocery', stock_qty: 120, standard_rate: 750, valuation_rate: 620, barcode: '8901234567890', uom: 'Box' },
  { name: 'ITEM-002', item_code: 'ITEM-002', item_name: 'Mustang Organic Apples 1kg', category: 'Fruits', stock_qty: 45, standard_rate: 280, valuation_rate: 220, barcode: '8901234567891', uom: 'Kg' },
  { name: 'ITEM-003', item_code: 'ITEM-003', item_name: 'Ilam Black Orthodox Tea 250g', category: 'Beverages', stock_qty: 85, standard_rate: 450, valuation_rate: 340, barcode: '8901234567892', uom: 'Pack' },
  { name: 'ITEM-004', item_code: 'ITEM-004', item_name: 'Himalayan Yak Cheese 500g', category: 'Dairy', stock_qty: 24, standard_rate: 980, valuation_rate: 800, barcode: '8901234567893', uom: 'Pcs' },
  { name: 'ITEM-005', item_code: 'ITEM-005', item_name: 'Dhaka Topi Traditional Premium', category: 'Clothing', stock_qty: 60, standard_rate: 1200, valuation_rate: 850, barcode: '8901234567894', uom: 'Pcs' },
  { name: 'ITEM-006', item_code: 'ITEM-006', item_name: 'Gorkha Khukuri Knife Decorative', category: 'Crafts', stock_qty: 18, standard_rate: 3500, valuation_rate: 2600, barcode: '8901234567895', uom: 'Pcs' },
];

export const initialCustomers: Customer[] = [
  { name: 'CUST-001', customer_name: 'Ramesh Adhikari', phone: '9841234567', pan_no: '601234567', email: 'ramesh@adhikari.com.np', address: 'Baluwatar, Kathmandu' },
  { name: 'CUST-002', customer_name: 'Sunita Shakya', phone: '9851098765', pan_no: '609876543', email: 'sunita@shakya.com.np', address: 'Patan Durbar, Lalitpur' },
  { name: 'CUST-003', customer_name: 'Himalayan Mart Pvt. Ltd.', phone: '9801122334', pan_no: '304567890', email: 'purchase@himalayanmart.np', address: 'Lakeside, Pokhara' },
];

export const initialSuppliers: Supplier[] = [
  { name: 'SUPP-001', supplier_name: 'Chaudhary Group Distribution', phone: '01-5522334', pan_no: '300123456', email: 'orders@cgcorpnepal.com', address: 'Sanepa, Lalitpur' },
  { name: 'SUPP-002', supplier_name: 'Himalayan Organic Producers Ltd.', phone: '061-523456', pan_no: '300987654', email: 'supply@himalayanproducers.com', address: 'Bagar, Pokhara' },
];

export const initialSalesInvoices: SalesInvoice[] = [
  {
    name: 'SINV-2081-0001',
    customer: 'Ramesh Adhikari',
    posting_date: '2026-04-10',
    due_date: '2026-04-25',
    items: [
      { item_code: 'ITEM-001', item_name: 'Wai Wai Noodles (Pack of 30)', qty: 2, rate: 750, discount: 0, amount: 1500 },
      { item_code: 'ITEM-003', item_name: 'Ilam Black Orthodox Tea 250g', qty: 1, rate: 450, discount: 50, amount: 400 },
    ],
    net_total: 1900,
    vat_amount: 247,
    grand_total: 2147,
    docstatus: 1, // Submitted
  },
  {
    name: 'SINV-2081-0002',
    customer: 'Sunita Shakya',
    posting_date: '2026-04-12',
    due_date: '2026-04-20',
    items: [
      { item_code: 'ITEM-005', item_name: 'Dhaka Topi Traditional Premium', qty: 1, rate: 1200, discount: 0, amount: 1200 },
    ],
    net_total: 1200,
    vat_amount: 156,
    grand_total: 1356,
    docstatus: 0, // Draft
  },
];

export const initialPurchaseBills: PurchaseBill[] = [
  {
    name: 'PINV-2081-0001',
    supplier: 'Chaudhary Group Distribution',
    posting_date: '2026-04-05',
    bill_no: 'CG-9874',
    items: [
      { item_code: 'ITEM-001', item_name: 'Wai Wai Noodles (Pack of 30)', qty: 50, rate: 620, amount: 31000 },
    ],
    net_total: 31000,
    vat_amount: 4030,
    grand_total: 35030,
    docstatus: 1,
  },
];

export const initialStockLedger: StockLedgerEntry[] = [
  { name: 'SLE-001', posting_date: '2026-04-05', item_code: 'ITEM-001', voucher_type: 'Purchase Invoice', voucher_no: 'PINV-2081-0001', actual_qty: 50, running_qty: 122 },
  { name: 'SLE-002', posting_date: '2026-04-10', item_code: 'ITEM-001', voucher_type: 'Sales Invoice', voucher_no: 'SINV-2081-0001', actual_qty: -2, running_qty: 120 },
];

export const initialStockCounts: StockCount[] = [
  {
    name: 'SC-2081-001',
    count_date: '2026-04-11',
    items: [
      { item_code: 'ITEM-001', item_name: 'Wai Wai Noodles (Pack of 30)', system_qty: 122, counted_qty: 120, difference: -2 },
      { item_code: 'ITEM-002', item_name: 'Mustang Organic Apples 1kg', system_qty: 40, counted_qty: 45, difference: 5 },
    ],
    remarks: 'Pre-New Year Physical Audit',
    docstatus: 1,
  },
];

export const initialJournalEntries: JournalEntry[] = [
  {
    name: 'JV-2081-0001',
    posting_date: '2026-04-01',
    accounts: [
      { account: 'Cash in Hand (Nabil Bank)', debit: 50000, credit: 0, remarks: 'Opening Cash Infusion' },
      { account: "Owner's Capital", debit: 0, credit: 50000, remarks: 'Capital Contribution' },
    ],
    total_debit: 50000,
    total_credit: 50000,
    difference: 0,
    docstatus: 1,
  },
];

export const initialOnlineOrders: OnlineOrder[] = [
  {
    name: 'ORD-9842',
    customer_name: 'Kripa Shrestha',
    channel: 'Instagram',
    phone: '9841887766',
    address: 'Jhamsikhel, Lalitpur (Near St. Marys)',
    items_summary: '2x Dhaka Topi Premium, 1x Orthodox Tea',
    grand_total: 2850,
    payment_status: 'Paid',
    fulfillment_status: 'Packed',
    delivery_status: 'Processing',
    courier: 'Pathao',
    tracking_id: 'PTH-778899',
    created_at: '2026-04-12 10:30',
  },
  {
    name: 'ORD-9843',
    customer_name: 'Bibek Thapa',
    channel: 'Website',
    phone: '9861002233',
    address: 'Maharajgunj, Chakrapath, Kathmandu',
    items_summary: '1x Gorkha Khukuri Knife Decorative',
    grand_total: 3955,
    payment_status: 'Paid',
    fulfillment_status: 'Shipped',
    delivery_status: 'Out for Delivery',
    courier: 'Upaya',
    tracking_id: 'UPY-445511',
    created_at: '2026-04-12 11:15',
  },
  {
    name: 'ORD-9844',
    customer_name: 'Anjali Gurung',
    channel: 'WhatsApp',
    phone: '9803112244',
    address: 'Bhatbhateni, Naxal, Kathmandu',
    items_summary: '1x Yak Cheese 500g, 2x Apples 1kg',
    grand_total: 1740,
    payment_status: 'Pending',
    fulfillment_status: 'Unfulfilled',
    delivery_status: 'Processing',
    created_at: '2026-04-12 14:00',
  },
];

export const initialAccountsTree: AccountNode[] = [
  { name: '1000', account_name: 'Application of Funds (Assets)', account_type: 'Asset', parent_account: null, balance: 1450000 },
  { name: '1100', account_name: 'Current Assets', account_type: 'Asset', parent_account: '1000', balance: 950000 },
  { name: '1110', account_name: 'Cash and Bank Balances', account_type: 'Asset', parent_account: '1100', balance: 520000 },
  { name: '1111', account_name: 'Nabil Bank Current A/C', account_type: 'Asset', parent_account: '1110', balance: 410000 },
  { name: '1112', account_name: 'Cash in Hand (Store Counter)', account_type: 'Asset', parent_account: '1110', balance: 110000 },
  { name: '1120', account_name: 'Stock in Hand (Inventory)', account_type: 'Asset', parent_account: '1100', balance: 430000 },
  { name: '2000', account_name: 'Sources of Funds (Liabilities)', account_type: 'Liability', parent_account: null, balance: 450000 },
  { name: '2100', account_name: 'Current Liabilities', account_type: 'Liability', parent_account: '2000', balance: 450000 },
  { name: '2110', account_name: 'Duties and Taxes (VAT 13% Payable)', account_type: 'Liability', parent_account: '2100', balance: 45200 },
  { name: '3000', account_name: 'Income', account_type: 'Income', parent_account: null, balance: 820000 },
  { name: '3100', account_name: 'Direct Income (Sales of Goods)', account_type: 'Income', parent_account: '3000', balance: 820000 },
  { name: '4000', account_name: 'Expenses', account_type: 'Expense', parent_account: null, balance: 340000 },
  { name: '4100', account_name: 'Cost of Goods Sold (COGS)', account_type: 'Expense', parent_account: '4000', balance: 280000 },
  { name: '4200', account_name: 'Store Operating Expenses', account_type: 'Expense', parent_account: '4000', balance: 60000 },
];
