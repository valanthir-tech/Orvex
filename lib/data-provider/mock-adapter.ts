import { DataProvider, ListOptions, ListResult } from './types';
import {
  initialItems,
  initialCustomers,
  initialSuppliers,
  initialSalesInvoices,
  initialPurchaseBills,
  initialStockLedger,
  initialStockCounts,
  initialJournalEntries,
  initialOnlineOrders,
  initialAccountsTree,
  Item,
  SalesInvoice,
  PurchaseBill,
  StockCount,
  JournalEntry,
} from './mock-store';

class MockERPStore {
  items: Item[] = [...initialItems];
  customers = [...initialCustomers];
  suppliers = [...initialSuppliers];
  salesInvoices: SalesInvoice[] = [...initialSalesInvoices];
  purchaseBills: PurchaseBill[] = [...initialPurchaseBills];
  stockLedger = [...initialStockLedger];
  stockCounts: StockCount[] = [...initialStockCounts];
  journalEntries: JournalEntry[] = [...initialJournalEntries];
  onlineOrders = [...initialOnlineOrders];
  accounts = [...initialAccountsTree];
}

// Global in-memory singleton for the mock adapter
const globalStore = new MockERPStore();

export class MockAdapter implements DataProvider {
  async list<T = any>(doctype: string, options: ListOptions = {}): Promise<ListResult<T>> {
    let data: any[] = [];
    const search = options.search?.toLowerCase();

    switch (doctype) {
      case 'Item':
        data = globalStore.items;
        if (search) {
          data = data.filter((i) => i.item_name.toLowerCase().includes(search) || i.item_code.toLowerCase().includes(search));
        }
        break;
      case 'Customer':
        data = globalStore.customers;
        if (search) {
          data = data.filter((c) => c.customer_name.toLowerCase().includes(search) || c.phone.includes(search));
        }
        break;
      case 'Supplier':
        data = globalStore.suppliers;
        if (search) {
          data = data.filter((s) => s.supplier_name.toLowerCase().includes(search) || s.phone.includes(search));
        }
        break;
      case 'Sales Invoice':
        data = globalStore.salesInvoices;
        if (search) {
          data = data.filter((s) => s.name.toLowerCase().includes(search) || s.customer.toLowerCase().includes(search));
        }
        break;
      case 'Purchase Bill':
      case 'Purchase Invoice':
        data = globalStore.purchaseBills;
        if (search) {
          data = data.filter((b) => b.name.toLowerCase().includes(search) || b.supplier.toLowerCase().includes(search));
        }
        break;
      case 'Stock Count':
        data = globalStore.stockCounts;
        if (search) {
          data = data.filter((sc) => sc.name.toLowerCase().includes(search));
        }
        break;
      case 'Stock Ledger':
        data = globalStore.stockLedger;
        if (search) {
          data = data.filter((l) => l.item_code.toLowerCase().includes(search) || l.voucher_no.toLowerCase().includes(search));
        }
        break;
      case 'Journal Entry':
        data = globalStore.journalEntries;
        if (search) {
          data = data.filter((j) => j.name.toLowerCase().includes(search));
        }
        break;
      case 'Online Order':
        data = globalStore.onlineOrders;
        if (search) {
          data = data.filter((o) => o.name.toLowerCase().includes(search) || o.customer_name.toLowerCase().includes(search));
        }
        break;
      case 'Account':
        data = globalStore.accounts;
        break;
      default:
        data = [];
    }

    const page = options.page || 1;
    const limit = options.limit || 50;
    const start = (page - 1) * limit;
    const paginated = data.slice(start, start + limit);

    return { data: paginated as T[], total: data.length };
  }

  async get<T = any>(doctype: string, name: string): Promise<T | null> {
    const listRes = await this.list<T>(doctype, { limit: 1000 });
    const found = listRes.data.find((item: any) => item.name === name);
    return (found as T) || null;
  }

  async create<T = any>(doctype: string, data: Partial<T>): Promise<T> {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const newDoc: any = {
      name: `${doctype.slice(0, 3).toUpperCase()}-2081-${randomId}`,
      docstatus: 0, // Draft
      ...data,
    };

    switch (doctype) {
      case 'Sales Invoice':
        globalStore.salesInvoices.unshift(newDoc as SalesInvoice);
        break;
      case 'Purchase Bill':
      case 'Purchase Invoice':
        globalStore.purchaseBills.unshift(newDoc as PurchaseBill);
        break;
      case 'Stock Count':
        globalStore.stockCounts.unshift(newDoc as StockCount);
        break;
      case 'Journal Entry':
        globalStore.journalEntries.unshift(newDoc as JournalEntry);
        break;
      case 'Customer':
        globalStore.customers.unshift(newDoc as any);
        break;
      case 'Supplier':
        globalStore.suppliers.unshift(newDoc as any);
        break;
      case 'Item':
        globalStore.items.unshift(newDoc as any);
        break;
      case 'Online Order':
        globalStore.onlineOrders.unshift(newDoc as any);
        break;
    }

    return newDoc as T;
  }

  async update<T = any>(doctype: string, name: string, data: Partial<T>): Promise<T> {
    const doc = await this.get<any>(doctype, name);
    if (!doc) throw new Error(`Document ${name} not found`);
    if (doc.docstatus === 1) throw new Error(`Cannot modify submitted document ${name}`);

    Object.assign(doc, data);
    return doc as T;
  }

  async submit<T = any>(doctype: string, name: string): Promise<T> {
    const doc = await this.get<any>(doctype, name);
    if (!doc) throw new Error(`Document ${name} not found`);
    if (doc.docstatus !== 0) throw new Error(`Document is already submitted or cancelled`);

    // Business rule executions upon submission
    if (doctype === 'Purchase Bill' || doctype === 'Purchase Invoice') {
      const bill = doc as PurchaseBill;
      // Increment stock and log Stock Ledger 'In'
      for (const line of bill.items) {
        const item = globalStore.items.find((i) => i.item_code === line.item_code);
        if (item) {
          item.stock_qty += line.qty;
          globalStore.stockLedger.unshift({
            name: `SLE-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            posting_date: bill.posting_date,
            item_code: item.item_code,
            voucher_type: 'Purchase Invoice',
            voucher_no: bill.name,
            actual_qty: line.qty,
            running_qty: item.stock_qty,
          });
        }
      }
    } else if (doctype === 'Sales Invoice') {
      const invoice = doc as SalesInvoice;
      // Decrement stock and log Stock Ledger 'Out'
      for (const line of invoice.items) {
        const item = globalStore.items.find((i) => i.item_code === line.item_code);
        if (item) {
          item.stock_qty = Math.max(0, item.stock_qty - line.qty);
          globalStore.stockLedger.unshift({
            name: `SLE-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            posting_date: invoice.posting_date,
            item_code: item.item_code,
            voucher_type: 'Sales Invoice',
            voucher_no: invoice.name,
            actual_qty: -line.qty,
            running_qty: item.stock_qty,
          });
        }
      }
    } else if (doctype === 'Stock Count') {
      const sc = doc as StockCount;
      // Post adjustment to stock balance
      for (const line of sc.items) {
        const item = globalStore.items.find((i) => i.item_code === line.item_code);
        if (item) {
          item.stock_qty = line.counted_qty;
          globalStore.stockLedger.unshift({
            name: `SLE-${Date.now()}-${Math.floor(Math.random() * 100)}`,
            posting_date: sc.count_date,
            item_code: item.item_code,
            voucher_type: 'Stock Reconciliation',
            voucher_no: sc.name,
            actual_qty: line.difference,
            running_qty: item.stock_qty,
          });
        }
      }
    } else if (doctype === 'Journal Entry') {
      const jv = doc as JournalEntry;
      if (Math.abs(jv.total_debit - jv.total_credit) > 0.01) {
        throw new Error('Total Debit must strictly equal Total Credit');
      }
    }

    doc.docstatus = 1; // Submitted
    return doc as T;
  }

  async cancel<T = any>(doctype: string, name: string): Promise<T> {
    const doc = await this.get<any>(doctype, name);
    if (!doc) throw new Error(`Document ${name} not found`);
    if (doc.docstatus !== 1) throw new Error(`Only submitted documents can be cancelled`);

    doc.docstatus = 2; // Cancelled
    return doc as T;
  }

  async report<T = any>(reportName: string, filters: Record<string, any> = {}): Promise<T> {
    switch (reportName) {
      case 'sales-summary':
        return {
          title: 'Sales Summary Report',
          columns: ['Invoice #', 'Customer', 'Date', 'Net Total', 'VAT (13%)', 'Grand Total', 'Status'],
          rows: globalStore.salesInvoices.map((s) => [
            s.name,
            s.customer,
            s.posting_date,
            s.net_total,
            s.vat_amount,
            s.grand_total,
            s.docstatus === 1 ? 'Submitted' : 'Draft',
          ]),
          summary: {
            totalSales: globalStore.salesInvoices.reduce((a, b) => a + b.grand_total, 0),
            totalVAT: globalStore.salesInvoices.reduce((a, b) => a + b.vat_amount, 0),
          },
        } as T;

      case 'stock-balance':
        return {
          title: 'Stock Balance & Valuation Report',
          columns: ['Item Code', 'Item Name', 'Category', 'Stock Qty', 'UOM', 'Selling Rate', 'Valuation Rate', 'Total Valuation'],
          rows: globalStore.items.map((i) => [
            i.item_code,
            i.item_name,
            i.category,
            i.stock_qty,
            i.uom,
            i.standard_rate,
            i.valuation_rate,
            i.stock_qty * i.valuation_rate,
          ]),
          summary: {
            totalInventoryValue: globalStore.items.reduce((a, b) => a + b.stock_qty * b.valuation_rate, 0),
          },
        } as T;

      case 'vat-summary':
        const salesVAT = globalStore.salesInvoices.reduce((a, b) => a + b.vat_amount, 0);
        const purchaseVAT = globalStore.purchaseBills.reduce((a, b) => a + b.vat_amount, 0);
        return {
          title: 'Monthly VAT Summary (Nepal IRD Annex 13)',
          columns: ['Particulars', 'Taxable Amount', 'VAT Amount (13%)'],
          rows: [
            ['Sales (Sales Invoices)', globalStore.salesInvoices.reduce((a, b) => a + b.net_total, 0), salesVAT],
            ['Purchases (Purchase Bills)', globalStore.purchaseBills.reduce((a, b) => a + b.net_total, 0), purchaseVAT],
            ['Net VAT Payable / (Refundable)', 0, salesVAT - purchaseVAT],
          ],
          summary: { salesVAT, purchaseVAT, netPayable: salesVAT - purchaseVAT },
        } as T;

      case 'p-and-l':
      case 'profit-and-loss':
        return {
          title: 'Profit and Loss Statement',
          columns: ['Account', 'Type', 'Amount (NPR)'],
          rows: [
            ['Gross Sales Revenue', 'Income', 820000],
            ['Cost of Goods Sold (COGS)', 'Expense', 280000],
            ['Gross Profit', 'Summary', 540000],
            ['Rent & Utilities', 'Expense', 45000],
            ['Staff Salaries', 'Expense', 85000],
            ['Operating Expenses', 'Expense', 15000],
            ['Net Profit Before Tax', 'Summary', 395000],
          ],
        } as T;

      case 'balance-sheet':
        return {
          title: 'Balance Sheet',
          columns: ['Classification', 'Account Head', 'Balance (NPR)'],
          rows: [
            ['Current Assets', 'Cash in Hand (Counter)', 110000],
            ['Current Assets', 'Bank Accounts (Nabil Bank)', 410000],
            ['Current Assets', 'Stock in Hand', 430000],
            ['Total Assets', 'All Assets', 950000],
            ['Current Liabilities', 'VAT Payable', 45200],
            ['Current Liabilities', 'Accounts Payable (Trade)', 210000],
            ['Equity', "Owner's Equity & Retained Earnings", 694800],
            ['Total Liabilities & Equity', 'Balance Check', 950000],
          ],
        } as T;

      default:
        return {
          title: reportName,
          columns: ['Reference', 'Date', 'Description', 'Amount'],
          rows: [
            ['REF-001', '2026-04-10', 'Sample Audit Entry', 15000],
            ['REF-002', '2026-04-11', 'Sample General Ledger Posting', 8400],
          ],
        } as T;
    }
  }
}
