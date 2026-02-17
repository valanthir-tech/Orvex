"use server"

import { revalidatePath } from "next/cache"
import { createItemSchema, updateItemSchema, CreateItemInput, UpdateItemInput } from "@/types/item"

// ERPNext API Configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL || 'http://localhost:8080'
const API_KEY = process.env.ERPNEXT_API_KEY
const API_SECRET = process.env.ERPNEXT_API_SECRET

// Helper function to make authenticated ERPNext API calls
async function erpnextFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T | null> {
    try {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        // Add API key authentication if available
        if (API_KEY && API_SECRET) {
            headers['Authorization'] = `token ${API_KEY}:${API_SECRET}`
        }

        const response = await fetch(`${ERPNEXT_URL}${endpoint}`, {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        })

        if (!response.ok) {
            console.error('ERPNext API error:', response.statusText)
            return null
        }

        const data = await response.json()
        return data.data || data.message || data
    } catch (error) {
        console.error('ERPNext fetch error:', error)
        return null
    }
}

// Type for ERPNext Item
interface ERPNextItem {
    name: string
    item_name: string
    item_code: string
    item_group: string
    stock_uom: string
    standard_rate: number
    valuation_rate?: number
    description?: string
    image?: string
    is_stock_item: 0 | 1
    has_batch_no: 0 | 1
    disabled: 0 | 1
}

// Type for ERPNext Item Group
interface ERPNextItemGroup {
    name: string
    parent_item_group?: string
    is_group: 0 | 1
}

// Transform ERPNext Item to our app format
function transformItem(erpItem: ERPNextItem) {
    return {
        id: erpItem.name,
        name: erpItem.item_name,
        itemCode: erpItem.item_code,
        description: erpItem.description || '',
        itemGroupId: erpItem.item_group,
        itemGroup: { id: erpItem.item_group, name: erpItem.item_group },
        stockUom: erpItem.stock_uom,
        standardRate: erpItem.standard_rate,
        valuationRate: erpItem.valuation_rate || 0,
        currentStock: 0, // Will be fetched separately from Stock Ledger
        minStockLevel: 0,
        isStockItem: erpItem.is_stock_item === 1,
        hasBatchNo: erpItem.has_batch_no === 1,
        image: erpItem.image,
        barcodes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
    }
}

// Create a new item
export async function createItem(data: CreateItemInput) {
    const validatedFields = createItemSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            success: false,
            error: "Validation failed. Please check your inputs.",
            issues: validatedFields.error.issues,
        }
    }

    const {
        name,
        itemCode,
        description,
        itemGroupId,
        stockUom,
        standardRate,
        valuationRate,
        barcode,
        isStockItem,
        hasBatchNo,
    } = validatedFields.data

    try {
        const erpItem = await erpnextFetch<ERPNextItem>('/api/resource/Item', {
            method: 'POST',
            body: JSON.stringify({
                item_code: itemCode,
                item_name: name,
                item_group: itemGroupId || 'All Item Groups',
                stock_uom: stockUom || 'Nos',
                standard_rate: standardRate,
                valuation_rate: valuationRate || standardRate,
                description: description,
                is_stock_item: isStockItem ? 1 : 0,
                has_batch_no: hasBatchNo ? 1 : 0,
                barcodes: barcode ? [{ barcode: barcode }] : [],
            }),
        })

        if (!erpItem) {
            return { success: false, error: "Failed to create item in ERPNext." }
        }

        revalidatePath("/items")
        return { success: true, item: transformItem(erpItem) }
    } catch (error) {
        console.error("Create item error:", error)
        return { success: false, error: "Failed to create item." }
    }
}

// Update an existing item
export async function updateItem(data: UpdateItemInput) {
    const validatedFields = updateItemSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            success: false,
            error: "Validation failed.",
            issues: validatedFields.error.issues,
        }
    }

    const { id, ...updateData } = validatedFields.data

    try {
        const erpItem = await erpnextFetch<{ data: ERPNextItem }>(
            `/api/resource/Item/${encodeURIComponent(id)}`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    item_name: updateData.name,
                    item_group: updateData.itemGroupId || undefined,
                    stock_uom: updateData.stockUom,
                    standard_rate: updateData.standardRate,
                    valuation_rate: updateData.valuationRate,
                    description: updateData.description,
                    is_stock_item: updateData.isStockItem ? 1 : 0,
                    has_batch_no: updateData.hasBatchNo ? 1 : 0,
                }),
            }
        )

        if (!erpItem) {
            return { success: false, error: "Failed to update item in ERPNext." }
        }

        revalidatePath("/items")
        revalidatePath(`/items/${id}`)
        return { success: true, item: transformItem(erpItem.data) }
    } catch (error) {
        console.error("Update item error:", error)
        return { success: false, error: "Failed to update item." }
    }
}

// Delete (disable) an item
export async function deleteItem(id: string) {
    try {
        // ERPNext doesn't delete items, it disables them
        await erpnextFetch(`/api/resource/Item/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify({ disabled: 1 }),
        })

        revalidatePath("/items")
        return { success: true }
    } catch (error) {
        console.error("Delete item error:", error)
        return { success: false, error: "Failed to delete item." }
    }
}

// Get single item
export async function getItem(id: string) {
    const result = await erpnextFetch<ERPNextItem>(
        `/api/resource/Item/${encodeURIComponent(id)}`
    )

    if (!result) return null
    return transformItem(result)
}

// Get all items with optional filters
export async function getItems(options?: {
    search?: string
    categoryId?: string
    status?: "all" | "in-stock" | "low-stock" | "out-of-stock"
}) {
    try {
        // Build filters
        const filters: [string, string, unknown][] = [
            ['disabled', '=', 0]
        ]

        if (options?.search) {
            filters.push(['item_name', 'like', `%${options.search}%`])
        }

        if (options?.categoryId) {
            filters.push(['item_group', '=', options.categoryId])
        }

        const params = new URLSearchParams({
            filters: JSON.stringify(filters),
            fields: JSON.stringify([
                'name', 'item_name', 'item_code', 'item_group',
                'stock_uom', 'standard_rate', 'valuation_rate',
                'description', 'image', 'is_stock_item', 'has_batch_no', 'disabled'
            ]),
            limit_page_length: '0', // Get all
        })

        const result = await erpnextFetch<ERPNextItem[]>(
            `/api/resource/Item?${params.toString()}`
        )

        if (!result) return []

        return result.map(transformItem)
    } catch (error) {
        console.error("Get items error:", error)
        return []
    }
}

// Get all categories (Item Groups)
export async function getCategories() {
    try {
        const params = new URLSearchParams({
            fields: JSON.stringify(['name', 'parent_item_group', 'is_group']),
            limit_page_length: '0',
        })

        const result = await erpnextFetch<ERPNextItemGroup[]>(
            `/api/resource/Item Group?${params.toString()}`
        )

        if (!result) return []

        return result.map(group => ({
            id: group.name,
            name: group.name,
            parentId: group.parent_item_group,
            isGroup: group.is_group === 1,
        }))
    } catch (error) {
        console.error("Get categories error:", error)
        return []
    }
}

// Create a category (Item Group)
export async function createCategory(name: string) {
    try {
        const result = await erpnextFetch<{ data: ERPNextItemGroup }>(
            '/api/resource/Item Group',
            {
                method: 'POST',
                body: JSON.stringify({
                    item_group_name: name,
                    parent_item_group: 'All Item Groups',
                }),
            }
        )

        if (!result) {
            return { success: false, error: "Failed to create category." }
        }

        revalidatePath("/items")
        return {
            success: true,
            category: {
                id: result.data.name,
                name: result.data.name,
            }
        }
    } catch (error) {
        console.error("Create category error:", error)
        return { success: false, error: "Failed to create category." }
    }
}

// Seed default categories - not needed for ERPNext as it has built-in item groups
export async function seedDefaultCategories() {
    // ERPNext already has default item groups
    return { success: true }
}
