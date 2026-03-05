/**
 * ERPNext API Client
 * 
 * This module provides a client for interacting with the ERPNext/Frappe REST API.
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

export interface ERPNextConfig {
    url: string;
    apiKey: string;
    apiSecret: string;
}

export class ERPNextClient {
    private config: ERPNextConfig;

    constructor(config: ERPNextConfig) {
        this.config = config;
    }

    private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
        return limit(async () => {
            try {
                // Ensure no trailing slash in URL and leading slash in endpoint
                const baseUrl = this.config.url.replace(/\/$/, '');
                const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
                
                const url = `${baseUrl}${path}`;
                
                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
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
                    console.error(`ERPNext Error [${response.status}]:`, errorText);
                    return null;
                }

                const data: FrappeResponse<T> = await response.json();
                
                // Normalizing Frappe's inconsistent responses
                if (data.data) return data.data;
                if (data.message) return data.message;
                
                // Sometimes it just returns the object directly (rare but happens)
                return data as T;

            } catch (error) {
                console.error('ERPNext Network Error:', error);
                return null;
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
    // ERPNext SPECIFIC METHODS
    // ============================================================

    /**
     * Get all Items (Products)
     */
    async getItems(filters?: Record<string, unknown>) {
        return this.getList<ERPNextItem>('Item', {
            fields: ['name', 'item_name', 'item_code', 'standard_rate', 'stock_uom', 'item_group', 'image', 'description'],
            filters,
            limit: 0 // Get all
        });
    }

    /**
     * Create a Sales Invoice
     * IDEMPOTENCY: Pass a UUID field (custom_pos_uuid) to check for duplicates
     */
    async createSalesInvoice(invoice: Partial<ERPNextSalesInvoice>, posUuid?: string) {
        // 1. Check for Idempotency if UUID provided
        if (posUuid) {
            // Check if Invoice exists with this matching UUID
            const existing = await this.getList<{ name: string }>('Sales Invoice', {
                filters: [['custom_pos_uuid', '=', posUuid]],
                limit: 1,
                fields: ['name']
            });

            if (existing && existing.length > 0) {
                console.log(`[Idempotency] Invoice for POS UUID ${posUuid} already exists: ${existing[0].name}`);
                return { name: existing[0].name, status: 'already_synced' };
            }
        }

        // 2. Create if not exists
        return this.createDoc<ERPNextSalesInvoice>('Sales Invoice', {
            ...invoice,
            custom_pos_uuid: posUuid, // Ensure we save this for future checks
            is_pos: 1,
            update_stock: 1,
        });
    }
}

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface ERPNextItem {
    name: string;
    item_name: string;
    item_code: string;
    standard_rate: number;
    stock_uom: string;
    item_group: string;
    image?: string;
    description?: string;
}

export interface ERPNextItemGroup {
    name: string;
    parent_item_group?: string;
    is_group: boolean;
}

export interface ERPNextSalesInvoiceItem {
    item_code: string;
    qty: number;
    rate: number;
    amount: number;
}

export interface ERPNextSalesInvoice {
    name?: string;
    customer: string;
    posting_date: string;
    is_pos: number;
    update_stock: number;
    items: ERPNextSalesInvoiceItem[];
    payments?: {
        mode_of_payment: string;
        amount: number;
    }[];
    total: number;
    grand_total: number;
    paid_amount?: number;
    change_amount?: number;
    custom_pos_uuid?: string; // Critical for idempotency
}
