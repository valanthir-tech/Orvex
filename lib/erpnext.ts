/**
 * ERPNext API Client
 * 
 * This module provides a client for interacting with the ERPNext/Frappe REST API.
 * It handles authentication, request formatting, and response parsing.
 */

// Default to local development instance
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || 'http://localhost:8080';

interface FrappeResponse<T = unknown> {
    message?: T;
    exc?: string;
    exc_type?: string;
    _server_messages?: string;
}

interface FrappeListResponse<T> {
    data: T[];
}

interface AuthCredentials {
    usr: string;
    pwd: string;
}

class ERPNextClient {
    private baseUrl: string;
    private sessionCookie: string | null = null;

    constructor(baseUrl: string = ERPNEXT_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Login to ERPNext and store session cookie
     */
    async login(credentials: AuthCredentials): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/method/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
                credentials: 'include',
            });

            if (!response.ok) {
                console.error('Login failed:', response.statusText);
                return false;
            }

            // Store session cookie from response
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                this.sessionCookie = setCookie;
            }

            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    /**
     * Make authenticated GET request
     */
    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T | null> {
        try {
            const url = new URL(`${this.baseUrl}${endpoint}`);
            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    url.searchParams.append(key, value);
                });
            }

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (this.sessionCookie) {
                headers['Cookie'] = this.sessionCookie;
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers,
                credentials: 'include',
            });

            if (!response.ok) {
                console.error('GET request failed:', response.statusText);
                return null;
            }

            const data: FrappeResponse<T> = await response.json();
            return data.message ?? null;
        } catch (error) {
            console.error('GET error:', error);
            return null;
        }
    }

    /**
     * Make authenticated POST request
     */
    async post<T>(endpoint: string, body?: unknown): Promise<T | null> {
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (this.sessionCookie) {
                headers['Cookie'] = this.sessionCookie;
            }

            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers,
                body: body ? JSON.stringify(body) : undefined,
                credentials: 'include',
            });

            if (!response.ok) {
                console.error('POST request failed:', response.statusText);
                return null;
            }

            const data: FrappeResponse<T> = await response.json();
            return data.message ?? null;
        } catch (error) {
            console.error('POST error:', error);
            return null;
        }
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
            filters?: Record<string, unknown>;
            limit?: number;
            offset?: number;
            orderBy?: string;
        }
    ): Promise<T[]> {
        try {
            const params: Record<string, string> = {};

            if (options?.fields) {
                params.fields = JSON.stringify(options.fields);
            }
            if (options?.filters) {
                params.filters = JSON.stringify(options.filters);
            }
            if (options?.limit) {
                params.limit_page_length = options.limit.toString();
            }
            if (options?.offset) {
                params.limit_start = options.offset.toString();
            }
            if (options?.orderBy) {
                params.order_by = options.orderBy;
            }

            const result = await this.get<FrappeListResponse<T>>(
                `/api/resource/${doctype}`,
                params
            );

            return result?.data ?? [];
        } catch (error) {
            console.error(`getList error for ${doctype}:`, error);
            return [];
        }
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
    async updateDoc<T>(
        doctype: string,
        name: string,
        updates: Partial<T>
    ): Promise<T | null> {
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (this.sessionCookie) {
                headers['Cookie'] = this.sessionCookie;
            }

            const response = await fetch(
                `${this.baseUrl}/api/resource/${doctype}/${encodeURIComponent(name)}`,
                {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify(updates),
                    credentials: 'include',
                }
            );

            if (!response.ok) {
                console.error('PUT request failed:', response.statusText);
                return null;
            }

            const data: FrappeResponse<T> = await response.json();
            return data.message ?? null;
        } catch (error) {
            console.error('updateDoc error:', error);
            return null;
        }
    }

    /**
     * Delete a document
     */
    async deleteDoc(doctype: string, name: string): Promise<boolean> {
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };

            if (this.sessionCookie) {
                headers['Cookie'] = this.sessionCookie;
            }

            const response = await fetch(
                `${this.baseUrl}/api/resource/${doctype}/${encodeURIComponent(name)}`,
                {
                    method: 'DELETE',
                    headers,
                    credentials: 'include',
                }
            );

            return response.ok;
        } catch (error) {
            console.error('deleteDoc error:', error);
            return false;
        }
    }

    // ============================================================
    // ERPNext SPECIFIC METHODS
    // ============================================================

    /**
     * Get all Items (Products)
     */
    async getItems(filters?: Record<string, unknown>) {
        return this.getList<ERPNextItem>('Item', {
            fields: ['name', 'item_name', 'item_code', 'standard_rate', 'stock_uom', 'item_group', 'image'],
            filters,
        });
    }

    /**
     * Get Item by code
     */
    async getItem(itemCode: string) {
        return this.getDoc<ERPNextItem>('Item', itemCode);
    }

    /**
     * Get Item Groups (Categories)
     */
    async getItemGroups() {
        return this.getList<ERPNextItemGroup>('Item Group', {
            fields: ['name', 'parent_item_group', 'is_group'],
        });
    }

    /**
     * Create a Sales Invoice (for POS transactions)
     */
    async createSalesInvoice(invoice: Partial<ERPNextSalesInvoice>) {
        return this.createDoc<ERPNextSalesInvoice>('Sales Invoice', {
            ...invoice,
            is_pos: 1,
            update_stock: 1,
        });
    }

    /**
     * Get current stock for an item at a warehouse
     */
    async getStockBalance(itemCode: string, warehouse: string) {
        return this.get<{ qty: number }>(
            '/api/method/erpnext.stock.utils.get_stock_balance',
            {
                item_code: itemCode,
                warehouse,
            }
        );
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
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const erpnext = new ERPNextClient();
export default erpnext;
