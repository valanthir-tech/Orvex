/**
 * CoreEngine API Client
 * 
 * This module provides a client for interacting with the CoreEngine/Frappe REST API.
 * It handles authentication, request formatting, and response parsing.
 * 
 * REFACTORED FOR MULTI-TENANCY
 */

import pLimit from 'p-limit';

// Rate limiting: 5 concurrent requests shared globally for this instance
// In a real serverless environment, this limit is per-lambda. 
// For better global rate limiting, use Redis. For MVP, this protects the single node process.
const limit = pLimit(5);

interface FrappeResponse<T = unknown> {
    message?: T;
    data?: T; // Sometimes Frappe returns { data: ... } instead of message
    exc?: string;
    exc_type?: string;
    _server_messages?: string;
}

interface FrappeListResponse<T> {
    data: T[];
}

export class CoreEngineAPIError extends Error {
    constructor(message: string, public statusCode: number) {
        super(message);
        this.name = 'CoreEngineAPIError';
    }
}

export interface CoreEngineConfig {
    url: string;
    apiKey: string;
    apiSecret: string;
}

export class CoreEngineClient {
    private config: CoreEngineConfig;

    constructor(config: CoreEngineConfig) {
        this.config = config;
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
        return limit(async () => {
            try {
                // Ensure no trailing slash in URL and leading slash in endpoint
                let rawUrl = this.config.url || '';
                // Check if they supplied fallback config variables directly if using .env
                if (!rawUrl && process.env.NEXT_PUBLIC_ERPNEXT_URL) {
                    rawUrl = process.env.NEXT_PUBLIC_ERPNEXT_URL;
                }
                if (!rawUrl) {
                    throw new Error('CoreEngine URL is not defined in configuration.');
                }
                const baseUrl = rawUrl.replace(/\/$/, '');
                const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

                const url = `${baseUrl}${path}`;

                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `token ${this.config.apiKey}:${this.config.apiSecret}`
                };

                const response = await fetch(url, {
                    ...options,
                    headers: {
                        ...headers,
                        ...options.headers,
                    },
                    cache: 'no-store' // Important for transactional data
                });

                if (!response.ok) {
                    const errorText = await response.text();

                    // For write operations, throw with the actual CoreEngine error so callers can surface it
                    if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
                        let message = `CoreEngine ${response.status} error`;
                        try {
                            const parsed = JSON.parse(errorText);
                            if (parsed._server_messages) {
                                const msgs = JSON.parse(parsed._server_messages);
                                const parsedMsgs = msgs.map((m: any) => typeof m === 'string' ? JSON.parse(m) : m);
                                const errorMsg = parsedMsgs.find((m: any) => m.raise_exception === 1 || m.indicator === 'red') || parsedMsgs[parsedMsgs.length - 1];
                                message = errorMsg.message || message;
                            } else if (parsed.exception) {
                                message = parsed.exception.split(':').pop()?.trim() || message;
                            }
                        } catch { /* use default message */ }
                        throw new CoreEngineAPIError(message, response.status);
                    }

                    return null;
                }

                const data: FrappeResponse<T> = await response.json();

                // Normalizing Frappe's inconsistent responses
                if (data.data) return data.data;
                if (data.message) return data.message;

                // Sometimes it just returns the object directly (rare but happens)
                return data as T;

            } catch (error) {
                // Re-throw intentional CoreEngine API errors from write operations
                if (error instanceof CoreEngineAPIError) {
                    throw error;
                }
                console.error('CoreEngine Network Error:', error instanceof Error ? error.message : String(error));
                throw new Error(`Network/Connection failure: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
    }

    /**
     * Make authenticated GET request
     */
    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
        const queryParams = new URLSearchParams(params).toString();
        const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
        return this.fetch<T>(url, { method: 'GET' });
    }

    /**
     * Make authenticated POST request
     */
    async post<T>(endpoint: string, body?: unknown): Promise<T | null> {
        return this.fetch<T>(endpoint, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        });
    }

    // ============================================================
    // DOCUMENT CRUD OPERATIONS (Frappe DocType API)
    // ============================================================

    /**
     * Get a list of documents from a DocType
     */
    async getList<T>(
        doctype: string,
        options?: {
            fields?: string[];
            filters?: any;
            limit?: number;
            offset?: number;
            orderBy?: string;
        }
    ): Promise<T[]> {
        const params: Record<string, string> = {};

        if (options?.fields) params.fields = JSON.stringify(options.fields);
        if (options?.filters) params.filters = JSON.stringify(options.filters);
        if (options?.limit) params.limit_page_length = options.limit.toString();
        if (options?.offset) params.limit_start = options.offset.toString();
        if (options?.orderBy) params.order_by = options.orderBy;

        // Frappe standard list endpoint
        const result = await this.get<T | T[]>(`/api/resource/${doctype}`, params);

        // Ensure we always return an array
        return Array.isArray(result) ? result : [];
    }

    /**
     * Get a single document by name
     */
    async getDoc<T>(doctype: string, name: string): Promise<T | null> {
        return this.get<T>(`/api/resource/${doctype}/${encodeURIComponent(name)}`);
    }

    /**
     * Create a new document
     */
    async createDoc<T>(doctype: string, doc: Partial<T>): Promise<T | null> {
        return this.post<T>(`/api/resource/${doctype}`, doc);
    }

    /**
     * Update an existing document
     */
    async updateDoc<T>(doctype: string, name: string, updates: Partial<T>): Promise<T | null> {
        return this.fetch<T>(`/api/resource/${doctype}/${encodeURIComponent(name)}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    /**
     * Delete a document
     */
    async deleteDoc(doctype: string, name: string): Promise<boolean> {
        const result = await this.fetch(`/api/resource/${doctype}/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });
        return result !== null;
    }

    // ============================================================
    // CoreEngine SPECIFIC METHODS
    // ============================================================

    /**
     * Get all Items (Products)
     */
    async getItems(filters?: Record<string, unknown>) {
        return this.getList<CoreEngineItem>('Item', {
            fields: ['name', 'item_name', 'item_code', 'standard_rate', 'stock_uom', 'item_group', 'image', 'description'],
            filters,
            limit: 0 // Get all
        });
    }

    /**
     * Create a Sales Invoice
     * IDEMPOTENCY: Pass a UUID field (custom_pos_uuid) to check for duplicates
     */
    async createSalesInvoice(invoice: Partial<CoreEngineSalesInvoice>, posUuid?: string): Promise<{ name: string; status?: string } | null> {
        // 1. Check for Idempotency if UUID provided
        if (posUuid) {
            // Check if Invoice exists with this matching UUID
            const existing = await this.getList<{ name: string }>('Sales Invoice', {
                filters: [['custom_pos_uuid', '=', posUuid]],
                limit: 1,
                fields: ['name']
            });

            if (existing && existing.length > 0) {

                return { name: existing[0].name, status: 'already_synced' };
            }
        }

        // 2. Create if not exists
        const result = await this.createDoc<CoreEngineSalesInvoice>('Sales Invoice', {
            ...invoice,
            custom_pos_uuid: posUuid, // Ensure we save this for future checks
            is_pos: 1,
            update_stock: 1,
            docstatus: 1, // Instantly submit to trigger stock deductions
        } as Partial<CoreEngineSalesInvoice> & { docstatus?: number });
        return result?.name ? { name: result.name } : null;
    }
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface CoreEngineItem {
    name: string;
    item_name: string;
    item_code: string;
    standard_rate: number;
    stock_uom: string;
    item_group: string;
    image?: string;
    description?: string;
}

export interface CoreEngineItemGroup {
    name: string;
    parent_item_group?: string;
    is_group: boolean;
}

export interface CoreEngineSalesInvoiceItem {
    item_code: string;
    qty: number;
    rate: number;
    amount: number;
}

export interface CoreEngineSalesInvoice {
    name?: string;
    company: string;
    set_warehouse: string;
    selling_price_list: string;
    customer: string;
    posting_date: string;
    is_pos: number;
    update_stock: number;
    items: CoreEngineSalesInvoiceItem[];
    payments?: {
        mode_of_payment: string;
        account?: string;
        amount: number;
    }[];
    total: number;
    grand_total: number;
    paid_amount?: number;
    change_amount?: number;
    custom_pos_uuid?: string; // Critical for idempotency
}

export interface CoreEngineCustomer {
    name: string;
    customer_name: string;
    customer_group: string;
    customer_type: string;
    territory: string;
    company?: string;
    default_price_list?: string;
}
