"use server"

import { revalidatePath } from 'next/cache'
import { getTenantContext, createSupabaseServerClient } from '@/lib/tenant'

export interface Customer {
    id: string
    name: string
    phone: string
    email: string | null
    address: string | null
    credit_limit: number
    current_balance: number
    total_sales: number
    total_payments: number
    notes: string | null
    is_active?: boolean
    pan_number?: string | null
    created_at: string
    updated_at: string
}

export interface CustomerTransaction {
    id: string
    customer_id: string
    type: 'sale' | 'payment'
    amount: number
    reference_id: string | null
    reference_type: 'invoice' | 'receipt' | null
    notes: string | null
    created_at: string
}

export interface StorefrontCustomer {
    id: string
    email: string
    full_name: string
    phone: string | null
    address: string | null
    is_active: boolean
    last_login: string | null
    created_at: string
    updated_at: string
}

// --- Get All Customers ----------------------------------------------------------

export async function getCustomers(search?: string): Promise<Customer[]> {
    try {
        const { tenantId } = await getTenantContext()
        const supabase = await createSupabaseServerClient()

        if (!tenantId) return []

        let query = supabase
            .from('customers')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name')

        if (search) {
            query = query.or('name.ilike.%'+search+'%,phone.ilike.%'+search+'%')
        }

        const { data, error } = await query
        if (error) throw error

        return data || []
    } catch (err) {
        console.error('[Get Customers]', err)
        return []
    }
}

// --- Get Single Customer --------------------------------------------------------

export async function getCustomer(id: string): Promise<Customer | null> {
    try {
        const { tenantId } = await getTenantContext()
        const supabase = await createSupabaseServerClient()

        if (!tenantId) return null

        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .single()

        if (error) {
            if (error.code === 'PGRST116') return null // Not found
            throw error
        }

        return data
    } catch (err) {
        console.error('[Get Customer]', err)
        return null
    }
}

// --- Create Customer ------------------------------------------------------------

export async function createCustomer(input: {
    name: string
    phone: string
    email?: string | null
    address?: string | null
    credit_limit?: number
    notes?: string | null
    pan_number?: string | null
    is_active?: boolean
}): Promise<{ success?: boolean, error?: string, data?: Customer }> {
    try {
        const { tenantId } = await getTenantContext()
        const supabase = await createSupabaseServerClient()

        if (!tenantId) return { error: 'Unauthorized' }

        // Basic validation
        if (!input.name?.trim()) return { error: 'Name is required' }
        if (!input.phone?.trim()) return { error: 'Phone is required' }

        // Check unique phone within tenant
        const { data: existing } = await supabase
            .from('customers')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('phone', input.phone.trim())
            .maybeSingle()

        if (existing) {
            return { error: 'A customer with this phone number already exists' }
        }

        const { data, error } = await supabase
            .from('customers')
            .insert({
                tenant_id: tenantId,
                name: input.name.trim(),
                phone: input.phone.trim(),
                email: input.email?.trim() || null,
                address: input.address?.trim() || null,
                credit_limit: input.credit_limit || 0,
                notes: input.notes?.trim() || null,
                pan_number: input.pan_number?.trim() || null,
                is_active: input.is_active ?? true
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/customers')
        return { success: true, data }
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error("[SYNC_ERROR]", { action: 'createCustomer', error: error.message })
        return { error: error.message || 'Failed to create customer' }
    }
}

// --- Update Customer ------------------------------------------------------------

export async function updateCustomer(id: string, updates: {
    name?: string
    phone?: string
    email?: string | null
    address?: string | null
    credit_limit?: number
    notes?: string | null
    pan_number?: string | null
    is_active?: boolean
}): Promise<{ success?: boolean, error?: string, data?: Customer }> {
    try {
        const { tenantId } = await getTenantContext()
        const supabase = await createSupabaseServerClient()

        if (!tenantId) return { error: 'Unauthorized' }

        // If updating phone, check uniqueness
        if (updates.phone) {
            const { data: existing } = await supabase
                .from('customers')
                .select('id')
                .eq('tenant_id', tenantId)
                .eq('phone', updates.phone.trim())
                .neq('id', id)
                .maybeSingle()

            if (existing) {
                return { error: 'A customer with this phone number already exists' }
            }
        }

        const cleanUpdates = {
            ...(updates.name !== undefined && { name: updates.name.trim() }),
            ...(updates.phone !== undefined && { phone: updates.phone.trim() }),
            ...(updates.email !== undefined && { email: updates.email?.trim() || null }),
            ...(updates.address !== undefined && { address: updates.address?.trim() || null }),
            ...(updates.credit_limit !== undefined && { credit_limit: updates.credit_limit }),
            ...(updates.notes !== undefined && { notes: updates.notes?.trim() || null }),
            ...(updates.pan_number !== undefined && { pan_number: updates.pan_number?.trim() || null }),
            ...(updates.is_active !== undefined && { is_active: updates.is_active }),
            updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('customers')
            .update(cleanUpdates)
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .select()
            .single()

        if (error) throw error

        revalidatePath('/customers')
        return { success: true, data }
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error("[SYNC_ERROR]", { action: 'updateCustomer', error: error.message })
        return { error: error.message || 'Failed to update customer' }
    }
}

// --- Delete Customer (Soft constraints usually, but leaving basic DB delete) ----

export async function deleteCustomer(id: string) {
    try {
        const { tenantId } = await getTenantContext()
        const supabase = await createSupabaseServerClient()

        if (!tenantId) return { error: 'Unauthorized' }

        // Should not allow deleting if balance > 0, handled by DB constraints or explicit check
        const { data: customer } = await supabase
            .from('customers')
            .select('current_balance')
            .eq('id', id)
            .eq('tenant_id', tenantId)
            .single()

        if (customer && customer.current_balance > 0) {
            return { error: 'Cannot delete customer with outstanding balance' }
        }

        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id)
            .eq('tenant_id', tenantId)

        if (error) throw error

        revalidatePath('/customers')
        return { success: true }
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error("[SYNC_ERROR]", { action: 'deleteCustomer', error: error.message })
        return { error: 'Failed to delete customer' }
    }
}

// --- Get Customer Transactions (Khata Ledger) ------------------------------------

export async function getCustomerTransactions(
    customerId: string,
    limit = 50
): Promise<CustomerTransaction[]> {
    try {
        const { tenantId } = await getTenantContext()
        const supabase = await createSupabaseServerClient()

        if (!tenantId) return []

        const { data, error } = await supabase
            .from('customer_transactions')
            .select('*')
            .eq('customer_id', customerId)
            // Relies on RLS for tenant isolation if table doesn't have tenant_id directly,
            // Assuming customer_id inherently belongs to tenant
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        return data || []
    } catch (err) {
        console.error('[Get Customer Transactions]', err)
        return []
    }
}

// --- Record Payment (Settle Khata) ----------------------------------------------
export async function recordPayment(input: {
    customer_id: string
    amount: number
    notes?: string | null
    reference_id?: string | null
}) {
    try {
        const { tenantId } = await getTenantContext()
        const supabase = await createSupabaseServerClient()

        if (!tenantId) return { error: 'Unauthorized' }
        if (!input.amount || input.amount <= 0) return { error: 'Valid amount required' }

        // Get current balance
        const { data: customer, error: fetchErr } = await supabase
            .from('customers')
            .select('current_balance, total_payments')
            .eq('id', input.customer_id)
            .eq('tenant_id', tenantId)
            .single()

        if (fetchErr) throw fetchErr

        const newBalance = customer.current_balance - input.amount
        const newTotalPayments = customer.total_payments + input.amount

        // Create transaction record
        const { error: txErr } = await supabase
            .from('customer_transactions')
            .insert({
                customer_id: input.customer_id,
                type: 'payment',
                amount: input.amount,
                notes: input.notes,
                reference_id: input.reference_id,
                reference_type: 'receipt'
            })

        if (txErr) throw txErr

        // Update customer balances
        const { data, error: updateErr } = await supabase
            .from('customers')
            .update({
                current_balance: newBalance,
                total_payments: newTotalPayments,
                updated_at: new Date().toISOString()
            })
            .eq('id', input.customer_id)
            .eq('tenant_id', tenantId)
            .select()
            .single()

        if (updateErr) throw updateErr

        revalidatePath('/customers')
        return { success: true, data }

    } catch (err: unknown) {
         const error = err instanceof Error ? err : new Error(String(err))
         console.error("[SYNC_ERROR]", { action: 'recordPayment', error: error.message })
         return { error: 'Failed to record payment' }
    }
}

// --- Record Credit Sale (From POS) ----------------------------------------------
export async function recordCreditSale(input: {
    customer_id: string
    amount: number
    invoice_id: string
}) {
    try {
        const { tenantId } = await getTenantContext()
        const supabase = await createSupabaseServerClient()

        if (!tenantId) return { error: 'Unauthorized' }

        const { data: customer, error: fetchErr } = await supabase
            .from('customers')
            .select('current_balance, credit_limit, total_sales')
            .eq('id', input.customer_id)
            .eq('tenant_id', tenantId)
            .single()

        if (fetchErr) throw fetchErr

        if (customer.credit_limit > 0 && customer.current_balance + input.amount > customer.credit_limit) {
            return { error: 'Credit limit exceeded' }
        }

        const { error: txErr } = await supabase
            .from('customer_transactions')
            .insert({
                customer_id: input.customer_id,
                type: 'sale',
                amount: input.amount,
                reference_id: input.invoice_id,
                reference_type: 'invoice'
            })

        if (txErr) throw txErr

        const { data, error: updateErr } = await supabase
            .from('customers')
            .update({
                current_balance: customer.current_balance + input.amount,
                total_sales: customer.total_sales + input.amount,
                updated_at: new Date().toISOString()
            })
            .eq('id', input.customer_id)
            .eq('tenant_id', tenantId)
            .select()
            .single()

        if (updateErr) throw updateErr
        revalidatePath('/', 'layout')
        return { success: true, data }
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error("[SYNC_ERROR]", { action: 'recordCreditSale', error: error.message })
        return { error: "Failed to record credit sale" }
    }
}

// %%% Storefront Customers (B2C) %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

export async function getStorefrontCustomers(search?: string): Promise<StorefrontCustomer[]> {
    try {
        const { tenantId } = await getTenantContext();
        if (!tenantId) return [];

        const supabase = await createSupabaseServerClient();
        let query = supabase
            .from('storefront_customers')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data || [];
    } catch (err) {
        console.error('[Get Storefront Customers]', err);
        return [];
    }
}

export async function toggleStorefrontCustomerStatus(id: string, is_active: boolean): Promise<{success?: boolean, error?: string}> {
    try {
        const { tenantId } = await getTenantContext()
        if (!tenantId) return { error: 'Unauthorized' }

        const supabase = await createSupabaseServerClient()
        const { error } = await supabase
            .from('storefront_customers')
            .update({ is_active })
            .eq('id', id)
            .eq('tenant_id', tenantId)

        if (error) throw error
        return { success: true }
    } catch (err: any) {
        console.error('[Toggle Storefront User]', err)
        return { error: err.message || 'Failed to toggle status' }
    }
}
