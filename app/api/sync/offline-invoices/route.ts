import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { POS_DEFAULT_CUSTOMER } from '@/lib/constants';
import { CoreEngineSalesInvoice } from '@/lib/core';
import { createSupabaseServerClient, getTenantContext } from '@/lib/tenant';

const offlineInvoiceItemSchema = z.object({
  item_code: z.string().min(1),
  qty: z.number().positive(),
  rate: z.number().nonnegative(),
  amount: z.number().nonnegative(),
});

const offlineInvoicePayloadSchema = z.object({
  local_invoice_number: z.string().min(1),
  pos_uuid: z.string().min(1),
  total: z.number().positive(),
  payment_method: z.string().min(1),
  customer_name: z.string().optional(),
  items: z.array(offlineInvoiceItemSchema).min(1),
});

const requestSchema = z.object({
  invoice: offlineInvoicePayloadSchema,
});

type OfflineInvoicePayload = z.infer<typeof offlineInvoicePayloadSchema>;

const PAYMENT_MODE_MAP: Record<string, string> = {
  CASH: 'Cash',
  CARD: 'Credit Card',
  QR: 'eSewa',
  CREDIT: 'Credit',
  QR_ESEWA: 'eSewa',
  QR_KHALTI: 'Khalti',
  QR_FONEPAY: 'FonePay',
  BANK_TRANSFER: 'Bank Draft',
};

interface StockStatus {
  itemCode: string;
  requiredQty: number;
  actualQty: number;
}

async function fetchStockStatus(
  client: Awaited<ReturnType<typeof getTenantContext>>['client'],
  warehouseName: string,
  itemCode: string,
  requiredQty: number,
): Promise<StockStatus> {
  const bins = await client.getList<{ item_code: string; actual_qty: number }>('Bin', {
    fields: ['item_code', 'actual_qty'],
    filters: [
      ['warehouse', '=', warehouseName],
      ['item_code', '=', itemCode],
    ],
    limit: 1,
  });

  const actualQty = bins[0]?.actual_qty ?? 0;
  return { itemCode, requiredQty, actualQty };
}

async function runPreflightStockCheck(
  client: Awaited<ReturnType<typeof getTenantContext>>['client'],
  warehouseName: string,
  payload: OfflineInvoicePayload,
): Promise<StockStatus[]> {
  const checks = await Promise.all(
    payload.items.map((item) => fetchStockStatus(client, warehouseName, item.item_code, item.qty)),
  );

  return checks.filter((check) => check.actualQty < check.requiredQty);
}

async function runPostCreateNegativeStockCheck(
  client: Awaited<ReturnType<typeof getTenantContext>>['client'],
  warehouseName: string,
  payload: OfflineInvoicePayload,
): Promise<StockStatus[]> {
  const checks = await Promise.all(
    payload.items.map((item) => fetchStockStatus(client, warehouseName, item.item_code, item.qty)),
  );

  return checks.filter((check) => check.actualQty < 0);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: 'retry', reason: 'Unauthorized request.' }, { status: 401 });
  }

  let payload: OfflineInvoicePayload;
  try {
    const body = await request.json();
    const parsed = requestSchema.parse(body);
    payload = parsed.invoice;
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Invalid request payload.';
    return NextResponse.json({ status: 'retry', reason }, { status: 400 });
  }

  try {
    const { client, companyName, warehouseName, priceList } = await getTenantContext();

    // 1. Idempotency-first lookup using custom_pos_uuid.
    const existingInvoice = await client.getList<{ name: string }>('Sales Invoice', {
      fields: ['name'],
      filters: [['custom_pos_uuid', '=', payload.pos_uuid]],
      limit: 1,
    });
    if (existingInvoice.length > 0) {
      return NextResponse.json({ status: 'already_synced', invoiceId: existingInvoice[0].name });
    }

    // 2. Pre-flight stock check before creating the invoice.
    const preflightConflicts = await runPreflightStockCheck(client, warehouseName, payload);
    if (preflightConflicts.length > 0) {
      const reason = preflightConflicts
        .map(
          (conflict) =>
            `${conflict.itemCode} requires ${conflict.requiredQty}, available ${conflict.actualQty}`,
        )
        .join('; ');
      return NextResponse.json({ status: 'conflict', reason }, { status: 409 });
    }

    const companyDoc = await client.getDoc<any>('Company', companyName);
    const defaultCashAccount = companyDoc?.default_cash_account;
    const defaultIncomeAccount = companyDoc?.default_income_account;
    const defaultExpenseAccount = companyDoc?.default_expense_account;
    const receivableAccount = companyDoc?.default_receivable_account;

    const normalizedPaymentMethod = payload.payment_method.trim().toUpperCase();
    const mappedPaymentMode = PAYMENT_MODE_MAP[normalizedPaymentMethod] ?? 'Cash';
    const modeOfPaymentDoc = await client.getDoc<any>('Mode of Payment', mappedPaymentMode);
    const paymentAccount = modeOfPaymentDoc?.accounts?.find((account: any) => account.company === companyName)
      ?.default_account;

    const invoiceItems = await Promise.all(
      payload.items.map(async (item) => {
        const itemDoc = await client.getDoc<{ income_account?: string; expense_account?: string }>(
          'Item',
          item.item_code,
        );
        return {
          item_code: item.item_code,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount,
          warehouse: warehouseName,
          income_account: itemDoc?.income_account ?? defaultIncomeAccount,
          expense_account: itemDoc?.expense_account ?? defaultExpenseAccount,
        };
      }),
    );

    // 3. Invoice creation after idempotency + pre-check passes.
    const result = await client.createSalesInvoice(
      {
        company: companyName,
        set_warehouse: warehouseName,
        selling_price_list: priceList || 'Standard Selling',
        customer: POS_DEFAULT_CUSTOMER,
        debit_to: receivableAccount,
        posting_date: new Date().toISOString().split('T')[0],
        is_pos: 1,
        update_stock: 1,
        items: invoiceItems,
        payments: [
          {
            mode_of_payment: mappedPaymentMode,
            account: paymentAccount || defaultCashAccount,
            amount: payload.total,
          },
        ],
        paid_amount: payload.total,
        change_amount: 0,
      } as Partial<CoreEngineSalesInvoice> & Record<string, unknown>,
      payload.pos_uuid,
    );

    if (!result?.name) {
      return NextResponse.json(
        { status: 'retry', reason: 'Invoice creation returned an empty response.' },
        { status: 503 },
      );
    }

    if (result.status === 'already_synced') {
      return NextResponse.json({ status: 'already_synced', invoiceId: result.name });
    }

    // 4. Post-create verification + compensation cancellation if stock dropped below zero.
    const postCreateConflicts = await runPostCreateNegativeStockCheck(client, warehouseName, payload);
    if (postCreateConflicts.length > 0) {
      // REST API operations are not atomic across stock check + submit invoice.
      // This compensation closes the race window by cancelling immediately on negative stock.
      try {
        await client.post('/api/method/frappe.client.cancel', {
          doctype: 'Sales Invoice',
          name: result.name,
        });
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Invoice cancellation failed.';
        return NextResponse.json(
          {
            status: 'retry',
            invoiceId: result.name,
            reason: `Negative stock detected, but compensation cancel failed: ${reason}`,
          },
          { status: 503 },
        );
      }

      const reason = postCreateConflicts
        .map((conflict) => `${conflict.itemCode} dropped to ${conflict.actualQty}`)
        .join('; ');
      return NextResponse.json(
        {
          status: 'conflict',
          invoiceId: result.name,
          reason: `Invoice was cancelled due to post-create negative stock: ${reason}`,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ status: 'synced', invoiceId: result.name });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Sync processing failed.';
    return NextResponse.json({ status: 'retry', reason }, { status: 503 });
  }
}

