"use server"

import { revalidatePath } from "next/cache"
import { createProductSchema, updateProductSchema, CreateProductInput, UpdateProductInput } from "@/types/product"
import { getTenantClient, getTenantContext, createSupabaseServerClient } from "@/lib/tenant"

// 
// MULTI-TENANT REFACTOR
// All actions now use getTenantClient() to resolve headers dynamically
// 

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
    item_group_name?: string
    parent_item_group?: string
    is_group: 0 | 1
}

// Transform ERPNext Item to our app format
function transformProduct(erpItem: ERPNextItem, custom?: any) {
    return {
        id: erpItem.name,
        name: custom?.display_name || erpItem.item_name || erpItem.name,
        productCode: erpItem.item_code,
        description: erpItem.description || '',
        productGroupId: erpItem.item_group,
        productGroup: { id: erpItem.item_group, name: erpItem.item_group },
        stockUom: erpItem.stock_uom,
        standardRate: custom?.price || erpItem.standard_rate,
        valuationRate: erpItem.valuation_rate || 0,
        currentStock: 0, // Will be fetched separately from Stock Ledger
        minStockLevel: 0,
        isStockProduct: erpItem.is_stock_item === 1,
        hasBatchNo: erpItem.has_batch_no === 1,
        image: custom?.image || erpItem.image,
        barcodes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        active: custom?.active !== false
    }
}

// Create a new item
export async function createProduct(data: CreateProductInput) {
    const validatedFields = createProductSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            success: false,
            error: "Validation failed. Please check your inputs.",
            issues: validatedFields.error.issues,
        }
    }

    const {
        name,
        productCode,
        description,
        productGroupId,
        stockUom,
        standardRate,
        valuationRate,
        barcode,
        isStockProduct,
        hasBatchNo,
    } = validatedFields.data

    try {
        const client = await getTenantClient();

        const erpItem = await client.createDoc<ERPNextItem>('Item', {
            item_code: productCode,
            item_name: name,
            item_group: productGroupId || 'All Item Groups',
            stock_uom: stockUom || 'Nos',
            standard_rate: standardRate,
            valuation_rate: valuationRate || standardRate,
            description: description,
            is_stock_item: isStockProduct ? 1 : 0,
            has_batch_no: hasBatchNo ? 1 : 0,
            // @ts-ignore
            barcodes: barcode ? [{ barcode: barcode }] : [],
        })

        if (!erpItem) {
            return { success: false, error: "Failed to create item in ERPNext." }
        }

        revalidatePath("/items")
        return { success: true, item: transformProduct(erpItem) }
    } catch (error) {
        console.error("Create item error:", error)
        return { success: false, error: "Failed to create item." }
    }
}

// Update an existing item
export async function updateProduct(data: UpdateProductInput) {
    const validatedFields = updateProductSchema.safeParse(data)

    if (!validatedFields.success) {
        return {
            success: false,
            error: "Validation failed.",
            issues: validatedFields.error.issues,
        }
    }

    const { id, ...updateData } = validatedFields.data

    try {
        const client = await getTenantClient();

        const erpItem = await client.updateDoc<ERPNextItem>('Item', id, {
            item_name: updateData.name,
            item_group: updateData.productGroupId || undefined,
            stock_uom: updateData.stockUom,
            standard_rate: updateData.standardRate,
            valuation_rate: updateData.valuationRate,
            description: updateData.description,
            is_stock_item: updateData.isStockProduct ? 1 : 0,
            has_batch_no: updateData.hasBatchNo ? 1 : 0,
        });

        if (!erpItem) {
            return { success: false, error: "Failed to update item in ERPNext." }
        }

        revalidatePath("/items")
        revalidatePath(`/items/${id}`)
        return { success: true, item: transformProduct(erpItem) }
    } catch (error) {
        console.error("Update item error:", error)
        return { success: false, error: "Failed to update item." }
    }
}

// Delete (disable) an item
export async function deleteProduct(id: string) {
    try {
        const client = await getTenantClient();

        // ERPNext doesn't delete items, it disables them
        const result = await client.updateDoc('Item', id, { disabled: 1 });

        revalidatePath("/items")
        return { success: !!result }
    } catch (error) {
        console.error("Delete item error:", error)
        return { success: false, error: "Failed to delete item." }
    }
}

// Get single item
export async function getProduct(id: string) {
    try {
        const client = await getTenantClient();
        const result = await client.getDoc<ERPNextItem>('Item', id);

        if (!result) return null
        return transformProduct(result)
    } catch (error) {
        console.error("Get item error:", error)
        return null;
    }
}

// Get all items with optional filters
export async function getProducts(options?: {
    search?: string
    categoryId?: string
    status?: "all" | "in-stock" | "low-stock" | "out-of-stock"
}) {
    try {
        const { client, tenantId } = await getTenantContext();
        const supabase = await createSupabaseServerClient();

        // 1. Fetch tenant allowed/customized items
        const { data: tenantItems, error: tbError } = await supabase
            .from('tenant_items')
            .select('item_code, display_name, price, image, active')
            .eq('tenant_id', tenantId)
            .eq('active', true);

        if (tbError || !tenantItems || tenantItems.length === 0) {
            return [];
        }

        const customMap = new Map(tenantItems.map((ti: any) => [ti.item_code, ti]));
        const itemCodes = Array.from(customMap.keys());

        // Build filters
        const filters: [string, string, unknown][] = [
            ['disabled', '=', 0],
            ['name', 'in', itemCodes]
        ]

        if (options?.search) {
            filters.push(['item_name', 'like', `%${options.search}%`])
        }

        if (options?.categoryId) {
            filters.push(['item_group', '=', options.categoryId])
        }

        // We use the raw client.getList here for advanced filtering
        // But our wrapper simplifies this.
        const result = await client.getList<ERPNextItem>('Item', {
            filters,
            fields: [
                'name', 'item_name', 'item_code', 'item_group',
                'stock_uom', 'standard_rate', 'valuation_rate',
                'description', 'image', 'is_stock_item', 'has_batch_no', 'disabled'
            ],
            limit: 0
        });

        return result.map(item => transformProduct(item, customMap.get(item.item_code)))
    } catch (error) {
        console.error("Get items error:", error)
        return []
    }
}

// Get all categories (Item Groups)
export async function getCategories() {
    try {
        const client = await getTenantClient();

        const result = await client.getList<ERPNextItemGroup>('Item Group', {
            fields: ['name', 'parent_item_group', 'is_group'],
            limit: 0
        });

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
        const client = await getTenantClient();

        const result = await client.createDoc<ERPNextItemGroup>('Item Group', {
            item_group_name: name, // ERPNext expects this field name for ID generation sometimes, but name works too
            parent_item_group: 'All Item Groups',
            is_group: 0
        });

        if (!result) {
            return { success: false, error: "Failed to create category." }
        }

        revalidatePath("/items")
        return {
            success: true,
            category: {
                id: result.name,
                name: result.name,
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

export async function updateCategory(id: string, data: any): Promise<{success: boolean; error?: string}> { return { success: true }; }
export async function deleteCategory(id: string): Promise<{success: boolean; error?: string}> { return { success: true }; }
