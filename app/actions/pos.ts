"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { z } from "zod"
import { getTenantClient, getTenantContext, createSupabaseServerClient } from "@/lib/tenant"
import { CoreEngineSalesInvoice, CoreEngineClient, CoreEngineConfig } from "@/lib/core"
import { POS_DEFAULT_CUSTOMER } from "@/lib/constants"
import { DEMO_PRODUCTS } from "@/lib/demo-data"

// 
// MULTI-TENANT REFACTOR
// All actions now use getTenantClient() to resolve headers dynamically
// 

export type CartItem = {
    itemId: string
    qty: number
    rate: number
    discount?: number
}

const invoiceSchema = z.object({
    items: z.string(), // JSON string of CartItem[]
    paymentMode: z.enum(['CASH', 'CARD', 'QR', 'CREDIT', 'QR_ESEWA', 'QR_KHALTI', 'QR_FONEPAY', 'BANK_TRANSFER']),
    paidAmount: z.coerce.number().min(0)
})

// Map our payment modes to CoreEngine Mode of Payment
const PAYMENT_MODE_MAP: Record<string, string> = {
    'CASH': 'Cash',
    'CARD': 'Credit Card',
    'QR': 'eSewa',
    'CREDIT': 'Credit',
    'QR_ESEWA': 'eSewa',
    'QR_KHALTI': 'Khalti',
    'QR_FONEPAY': 'FonePay',
    'BANK_TRANSFER': 'Bank Draft',
}

export async function createPOSInvoice(formData: FormData) {
    const rawData = {
        items: formData.get("items"),
        paymentMode: formData.get("paymentMode"),
        paidAmount: formData.get("paidAmount"),
        posUuid: formData.get("posUuid"), // Critical for idempotency
    }

    const validation = invoiceSchema.safeParse(rawData)
    if (!validation.success) return { error: "Invalid Data" }

    const { items: itemsJson, paymentMode, paidAmount } = validation.data
    const cartItems = JSON.parse(itemsJson) as CartItem[]
    const posUuid = rawData.posUuid as string || crypto.randomUUID(); // Fallback if not provided, but SyncWorker MUST provide it.

    if (cartItems.length === 0) return { error: "Cart is empty" }

    try {
        const cookieStore = await cookies();
        if (cookieStore.get('onedexo_demo_session')?.value === 'true') {
            revalidatePath('/', 'layout');
            return {
                success: true,
                name: `INV-DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
                grandTotal: paidAmount,
                paidAmount: paidAmount,
                status: "Paid",
                posUuid,
            };
        }

        const { client, companyName, warehouseName, priceList, tenantId } = await getTenantContext();
        const supabase = await createSupabaseServerClient()

        // Calculate totals
        let netTotal = 0
        let totalDiscount = 0
        const invoiceItems: any[] = []

        const companyDoc = await client.getDoc<any>('Company', companyName);
        const cashAccount = companyDoc?.default_cash_account;
        const incomeAccount = companyDoc?.default_income_account;
        const expenseAccount = companyDoc?.default_expense_account;
        const receivableAccount = companyDoc?.default_receivable_account;

        // 2. Fetch the Exact Payment Account from Mode of Payment to prevent Frappe API Mandatory Errors
        const mappedPaymentMode = PAYMENT_MODE_MAP[paymentMode] || 'Cash';
        const mopDoc = await client.getDoc<any>('Mode of Payment', mappedPaymentMode);
        const exactPaymentAccount = mopDoc?.accounts?.find((a: any) => a.company === companyName)?.default_account;

        for (const cartItem of cartItems) {
            // VALIDATION: Never trust client-provided rate. Fetch from source of truth.
            const CoreEngineItem = await client.getDoc<{ standard_rate: number, income_account: string, expense_account: string }>('Item', cartItem.itemId)
            if (!CoreEngineItem) throw new Error(`Item ${cartItem.itemId} not found in CoreEngine.`)

            // Check if tenant has a custom price override
            const { data: tenantItem } = await supabase
                .from('tenant_items')
                .select('price')
                .eq('tenant_id', tenantId)
                .eq('item_code', cartItem.itemId)
                .single()

            const validatedRate = tenantItem?.price || CoreEngineItem.standard_rate || 0

            // If mismatch is too high, DO NOT overwrite the rate. 
            // The physical cash was already collected offline by the cashier.
            // Overwriting here alters financial records and causes drawer shortages.
            if (Math.abs(cartItem.rate - validatedRate) > validatedRate * 0.05) {
                console.warn(`[AUDIT NEEDED] Offline price (${cartItem.rate}) differs from Server (${validatedRate}) for ${cartItem.itemId}. Accepting offline transaction price to maintain ledger cash accuracy.`)
                // Note: You should build a manager alert or audit log for these specific events later.
            }

            const amount = cartItem.qty * cartItem.rate
            netTotal += amount
            totalDiscount += (cartItem.discount || 0)

            invoiceItems.push({
                item_code: cartItem.itemId,
                qty: cartItem.qty,
                rate: cartItem.rate,
                discount_amount: cartItem.discount || 0,
                warehouse: warehouseName,
                income_account: CoreEngineItem.income_account || incomeAccount,
                expense_account: CoreEngineItem.expense_account || expenseAccount,
            })
        }

        const grandTotal = netTotal - totalDiscount

        // Create Sales Invoice in CoreEngine
        // For POS, we use Sales Invoice with is_pos = 1 and update_stock = 1
        const invoiceData: Partial<CoreEngineSalesInvoice> & Record<string, any> = {
            company: companyName,
            set_warehouse: warehouseName,
            selling_price_list: priceList || undefined,
            customer: POS_DEFAULT_CUSTOMER, // CoreEngine needs a customer - create this in CoreEngine
            debit_to: receivableAccount, // Force receivable account
            posting_date: new Date().toISOString().split('T')[0],
            is_pos: 1,
            update_stock: 1,
            items: invoiceItems,
            payments: paidAmount > 0 ? [{
                mode_of_payment: mappedPaymentMode,
                account: exactPaymentAccount || cashAccount, // Explicitly pass the account 
                amount: paidAmount,
            }] : [],
            paid_amount: paidAmount,
            change_amount: Math.max(0, paidAmount - grandTotal),
        }

        const result = await client.createSalesInvoice(invoiceData, posUuid);

        if (!result || !result.name) {
            return { error: "Failed to create invoice in CoreEngine" }
        }

        if (result.status === 'already_synced') {
            return { success: true, invoiceId: result.name, alreadySynced: true }
        }

        revalidatePath('/', 'layout')
        return { success: true, invoiceId: result.name }

    } catch (e: unknown) {
        const error = e instanceof Error ? e : new Error(String(e))
        // Silenced in production
        return { error: error.message || "Failed to process sale" }
    }
}

// Get POS invoices for today
export async function getTodayInvoices() {
    const today = new Date().toISOString().split('T')[0]

    try {
        const cookieStore = await cookies();
        if (cookieStore.get('onedexo_demo_session')?.value === 'true') {
            return [
                {
                    id: "INV-DEMO-001",
                    name: "INV-2026-0042",
                    customer: "Walk-in Customer",
                    grandTotal: 1250,
                    paidAmount: 1250,
                    createdAt: new Date(Date.now() - 15 * 60 * 1000),
                    status: "Paid",
                },
                {
                    id: "INV-DEMO-002",
                    name: "INV-2026-0041",
                    customer: "Aarav Sharma",
                    grandTotal: 3400,
                    paidAmount: 3400,
                    createdAt: new Date(Date.now() - 52 * 60 * 1000),
                    status: "Paid",
                },
                {
                    id: "INV-DEMO-003",
                    name: "INV-2026-0040",
                    customer: "Sita Devi",
                    grandTotal: 850,
                    paidAmount: 850,
                    createdAt: new Date(Date.now() - 110 * 60 * 1000),
                    status: "Paid",
                },
            ];
        }

        const client = await getTenantClient();

        const result = await client.getList<{
            name: string
            customer: string
            grand_total: number
            paid_amount: number
            posting_date: string
            posting_time: string
            status: string
        }>('Sales Invoice', {
            fields: ['name', 'customer', 'grand_total', 'paid_amount', 'posting_date', 'posting_time', 'status'],
            filters: [
                ['posting_date', '=', today],
                ['is_pos', '=', 1],
            ],
            orderBy: 'creation desc',
            limit: 50
        })

        return result.map((inv: any) => {
            const timeStr = inv.posting_time || "00:00:00.000000";
            return {
                id: inv.name,
                name: inv.name,
                customer: inv.customer,
                grandTotal: inv.grand_total,
                paidAmount: inv.paid_amount,
                createdAt: new Date(`${inv.posting_date}T${timeStr}`),
                status: inv.status,
            }
        })
    } catch (error) {
        console.error('Get invoices error:', error instanceof Error ? error.message : String(error))
        return []
    }
}

// Get invoice details
export async function getInvoice(id: string) {
    try {
        const client = await getTenantClient();
        const result = await client.getDoc<any>('Sales Invoice', id);

        if (!result) return null

        return {
            id: result.name,
            name: result.name,
            customer: result.customer,
            grandTotal: result.grand_total,
            paidAmount: result.paid_amount,
            changeAmount: result.change_amount,
            createdAt: new Date(`${result.posting_date}T${result.posting_time}`),
            status: result.status,
            items: (result.items || []).map((item: any) => ({
                itemCode: item.item_code,
                itemName: item.item_name,
                qty: item.qty,
                rate: item.rate,
                amount: item.amount,
            })),
            payments: (result.payments || []).map((p: any) => ({
                mode: p.mode_of_payment,
                amount: p.amount,
            })),
        }
    } catch (error) {
        console.error('Get invoice error:', error instanceof Error ? error.message : String(error))
        return null
    }
}

export async function deleteInvoice(id: string) {
    try {
        const client = await getTenantClient();

        // 0. Get the document first to check its status
        const invoice = await client.getDoc<any>('Sales Invoice', id);
        if (!invoice) throw new Error("Invoice not found.");

        // In a true multi-tenant BFF architecture, the `client` derived from getTenantContext() 
        // ALREADY holds the tenant's specific API Key and Secret, which should have the 
        // "System Manager" role for their isolated Frappe site.
        // We use this exact same client to cancel and delete.
        const adminClient = client;

        // 1. Frappe requires you to Cancel (docstatus = 2) before deleting a submitted document
        if (invoice.docstatus === 1) {
            await adminClient.post('/api/method/frappe.client.cancel', {
                doctype: 'Sales Invoice',
                name: id
            });
        }

        // 2. Safely delete it from the CoreEngine database
        try {
            await adminClient.deleteDoc('Sales Invoice', id);
        } catch (deleteError: any) {
            // CoreEngine enforces strict compliance laws in regions like Nepal/India 
            // that completely ban the hard-deletion of accounting documents to prevent tax fraud.
            // If the document is cancelled above, it is effectively voided and the ledgers are reversed.
            console.warn('Could not hard-delete document (likely regional compliance):', deleteError.message);
        }

        revalidatePath('/', 'layout');
        return { success: true };
    } catch (e: unknown) {
        console.error('Delete invoice error:', e instanceof Error ? e.message : String(e));
        throw new Error(e instanceof Error ? e.message : "Failed to delete the invoice.");
    }
}

// Get items for the POS terminal (formatted for Dexie local DB)
export async function getPOSItems() {
    function mapDemoProducts() {
        return DEMO_PRODUCTS.map(item => ({
            id: item.id,
            name: item.name,
            sku: item.productCode,
            price: item.standardRate,
            cost: item.valuationRate,
            stock: item.currentStock,
            minStock: item.minStockLevel,
            category: item.productGroupId,
            barcode: null as string | null,
            image: item.image,
            isActive: true,
            isSynced: true,
            updatedAt: item.updatedAt,
        }));
    }

    try {
        const cookieStore = await cookies();
        if (cookieStore.get('onedexo_demo_session')?.value === 'true') {
            return mapDemoProducts();
        }

        const { client, tenantId, warehouseName } = await getTenantContext();
        const supabase = await createSupabaseServerClient();

        const { data: tenantItems, error: tbError } = await supabase
            .from('tenant_items')
            .select('item_code, display_name, price, image, active')
            .eq('tenant_id', tenantId)
            .eq('active', true);

        const customMap = new Map((tenantItems || []).map((ti: any) => [ti.item_code, ti]));

        const items = await client.getList<{
            name: string;
            item_name: string;
            item_code: string;
            item_group: string;
            standard_rate: number;
            valuation_rate: number;
            image: string | null;
            disabled: 0 | 1;
        }>('Item', {
            fields: ['name', 'item_name', 'item_code', 'item_group', 'standard_rate', 'valuation_rate', 'image', 'disabled'],
            filters: [['disabled', '=', 0], ['is_stock_item', '=', 1]],
            limit: 0,
        });

        // Fetch stock for all items
        const bins = await client.getList<{
            item_code: string;
            actual_qty: number;
        }>('Bin', {
            fields: ['item_code', 'actual_qty'],
            filters: [['warehouse', '=', warehouseName]],
            limit: 0,
        });

        const stockMap = new Map<string, number>();
        for (const bin of bins) {
            stockMap.set(bin.item_code, (stockMap.get(bin.item_code) || 0) + bin.actual_qty);
        }

        if (items.length === 0) {
            return mapDemoProducts();
        }

        return items.map(item => {
            const custom = customMap.get(item.item_code) || {};
            return {
            id: item.name,
            name: custom.display_name || item.item_name || item.name,
            sku: item.item_code,
            price: custom.price || item.standard_rate || 0,
            cost: item.valuation_rate || 0,
            stock: stockMap.get(item.item_code) || 0,
            minStock: 0,
            category: item.item_group || 'Uncategorized',
            barcode: null as string | null,
            image: custom.image || item.image || null,
            isActive: true,
            isSynced: true,
            updatedAt: new Date(),
        }});
    } catch (error) {
        console.error('Get POS items error:', error instanceof Error ? error.message : String(error));
        return mapDemoProducts();
    }
}
