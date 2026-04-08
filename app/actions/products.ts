"use server"

import { revalidatePath } from "next/cache"
import { createProductSchema, updateProductSchema, CreateProductInput, UpdateProductInput } from "@/types/product"
import { getTenantClient, getTenantContext, createSupabaseServerClient } from "@/lib/tenant"

// 
// MULTI-TENANT REFACTOR
// All actions now use getTenantClient() to resolve headers dynamically
// 

// Type for CoreEngine Item
interface CoreEngineItem {
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
    barcodes?: { barcode: string }[]
}

// Type for CoreEngine Item Group
interface CoreEngineItemGroup {
    name: string
    item_group_name?: string
    parent_item_group?: string
    is_group: 0 | 1
}

// Transform CoreEngine Item to our app format
function transformProduct(CoreEngineItem: CoreEngineItem, custom?: any) {
    return {
        id: CoreEngineItem.name,
        name: custom?.display_name || CoreEngineItem.item_name || CoreEngineItem.name,
        productCode: CoreEngineItem.item_code,
        description: CoreEngineItem.description || '',
        productGroupId: CoreEngineItem.item_group,
        productGroup: { id: CoreEngineItem.item_group, name: CoreEngineItem.item_group },
        stockUom: CoreEngineItem.stock_uom,
        standardRate: custom?.price || CoreEngineItem.standard_rate,
        valuationRate: CoreEngineItem.valuation_rate || 0,
        currentStock: 0, // Will be fetched separately from Stock Ledger
        minStockLevel: 0,
        isStockProduct: CoreEngineItem.is_stock_item === 1,
        hasBatchNo: CoreEngineItem.has_batch_no === 1,
        image: custom?.image || CoreEngineItem.image,
        barcodes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        active: custom?.active !== false,
        storefrontStatus: custom?.storefront_status || 'visible',
        metafields: custom?.metafields || [],
        mediaUrls: custom?.media_urls || [],
        taxOverride: custom?.tax_override,
        shippingOverride: custom?.shipping_override,
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
        image,
        storefrontStatus,
        metafields,
        mediaUrls,
        taxOverride,
        shippingOverride,
    } = validatedFields.data

    try {
        const { client, tenantId } = await getTenantContext();
        const supabase = await createSupabaseServerClient();

        const CoreEngineItem = await client.createDoc<CoreEngineItem>('Item', {
            item_code: productCode,
            item_name: name,
            item_group: productGroupId || 'All Item Groups',
            stock_uom: stockUom || 'Nos',
            standard_rate: standardRate,
            valuation_rate: valuationRate || standardRate,
            description: description,
            image: image,
            is_stock_item: isStockProduct ? 1 : 0,
            has_batch_no: hasBatchNo ? 1 : 0,
            barcodes: barcode ? [{ barcode: barcode }] : [],
        })

        if (!CoreEngineItem) {
            return { success: false, error: "Failed to create item in CoreEngine." }
        }

        const { error: insertError } = await supabase
            .from('tenant_items')
            .insert({
                tenant_id: tenantId,
                item_code: productCode,
                display_name: name,
                image: image,
                price: standardRate,
                active: true,
                storefront_status: storefrontStatus,
                metafields: metafields,
                media_urls: mediaUrls,
                tax_override: taxOverride,
                shipping_override: shippingOverride,
            });

        if (insertError) {
            console.error("Failed to insert tenant_item in Supabase:", insertError);
            // Optionally decide whether to fail or just log
        }

        revalidatePath('/', 'layout')
        revalidatePath('/', 'layout')
        revalidatePath('/', 'layout')
        return { success: true, item: transformProduct(CoreEngineItem) }
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
        const { client, tenantId } = await getTenantContext();
        const supabase = await createSupabaseServerClient();

        const CoreEngineItem = await client.updateDoc<CoreEngineItem>('Item', id, {
            item_name: updateData.name,
            item_group: updateData.productGroupId || undefined,
            stock_uom: updateData.stockUom,
            standard_rate: updateData.standardRate,
            valuation_rate: updateData.valuationRate,
            description: updateData.description,
            image: updateData.image,
            is_stock_item: updateData.isStockProduct ? 1 : 0,
            has_batch_no: updateData.hasBatchNo ? 1 : 0,
        });

        if (!CoreEngineItem) {
            return { success: false, error: "Failed to update item in CoreEngine." }
        }

        // Sync tenant items
        await supabase
            .from('tenant_items')
            .upsert({
                tenant_id: tenantId,
                item_code: id,
                display_name: updateData.name,
                image: updateData.image,
                price: updateData.standardRate,
                active: true,
                storefront_status: updateData.storefrontStatus,
                metafields: updateData.metafields,
                media_urls: updateData.mediaUrls,
                tax_override: updateData.taxOverride,
                shipping_override: updateData.shippingOverride,
            }, { onConflict: 'tenant_id, item_code' });

        revalidatePath('/', 'layout')
        revalidatePath('/', 'layout')
        return { success: true, item: transformProduct(CoreEngineItem) }
    } catch (error) {
        console.error("Update item error:", error)
        return { success: false, error: "Failed to update item." }
    }
}

// Delete (disable) an item
export async function deleteProduct(id: string) {
    try {
        const client = await getTenantClient();

        // CoreEngine doesn't delete items, it disables them
        const result = await client.updateDoc('Item', id, { disabled: 1 });

        revalidatePath('/', 'layout')
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
        const result = await client.getDoc<CoreEngineItem>('Item', id);

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
    isStockItem?: boolean
}) {
    try {
        const { client, tenantId } = await getTenantContext();
        const supabase = await createSupabaseServerClient();

        // 1. Fetch tenant allowed/customized items (optional metadata)
        const { data: tenantItems, error: tbError } = await supabase
            .from('tenant_items')
            .select('item_code, display_name, price, image, active, matrix_pricing')
            .eq('tenant_id', tenantId)
            .eq('active', true);

        const customMap = new Map((tenantItems || []).map((ti: any) => [ti.item_code, ti]));

        // Build filters
        const filters: [string, string, unknown][] = [
            ['disabled', '=', 0]
        ]
        
        if (options?.isStockItem !== undefined) {
            filters.push(['is_stock_item', '=', options.isStockItem ? 1 : 0])
        }

        if (options?.search) {
            filters.push(['item_name', 'like', `%${options.search}%`])
        }

        if (options?.categoryId) {
            filters.push(['item_group', '=', options.categoryId])
        }

        // We use the raw client.getList here for advanced filtering
        // But our wrapper simplifies this.
        const result = await client.getList<CoreEngineItem>('Item', {
            filters,
            fields: [
                'name', 'item_name', 'item_code', 'item_group',
                'stock_uom', 'standard_rate', 'valuation_rate',
                'description', 'image', 'is_stock_item', 'has_batch_no', 'disabled'
            ],
            limit: 0
        });

        // 2. Fetch stock levels from 'Bin' for the tenant's warehouse
        const { warehouseName } = await getTenantContext();
        let stockMap = new Map<string, number>();

        try {
            const bins = await client.getList<{ item_code: string; actual_qty: number }>('Bin', {
                fields: ['item_code', 'actual_qty'],
                limit: 0
            });
            for (const bin of bins) {
                // If you want warehouse-specific filtering, add it to filters or filter here
                stockMap.set(bin.item_code, (stockMap.get(bin.item_code) || 0) + bin.actual_qty);
            }
        } catch (e) {
            console.error("Failed to fetch bins for products route", e);
        }

        return result.map(item => {
            const transformed = transformProduct(item, customMap.get(item.item_code));
            transformed.currentStock = stockMap.get(item.item_code) || 0;
            return transformed;
        });
    } catch (error) {
        console.error("Get items error:", error)
        return []
    }
}

// Get all categories (Item Groups)
export async function getCategories() {
    try {
        const client = await getTenantClient();

        const result = await client.getList<CoreEngineItemGroup>('Item Group', {
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

        const result = await client.createDoc<CoreEngineItemGroup>('Item Group', {
            item_group_name: name, // CoreEngine expects this field name for ID generation sometimes, but name works too
            parent_item_group: 'All Item Groups',
            is_group: 0
        });

        if (!result) {
            return { success: false, error: "Failed to create category." }
        }

        revalidatePath('/', 'layout')
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

// Seed default categories - not needed for CoreEngine as it has built-in item groups
export async function seedDefaultCategories() {
    // CoreEngine already has default item groups
    return { success: true }
}

export async function updateCategory(id: string, name: string): Promise<{success: boolean; error?: string}> {
    try {
        const client = await getTenantClient();
        const result = await client.updateDoc<CoreEngineItemGroup>('Item Group', id, { item_group_name: name });
        if (!result) return { success: false, error: "Failed to update category" };
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error("[SYNC_ERROR]", { action: 'updateCategory', error: error.message });
        return { success: false, error: "Error updating category" };
    }
}

export async function deleteCategory(id: string): Promise<{success: boolean; error?: string}> {
    try {
        const client = await getTenantClient();
        const result = await client.deleteDoc('Item Group', id);
        if (!result) return { success: false, error: "Failed to delete category" };
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err))
        console.error("[SYNC_ERROR]", { action: 'deleteCategory', error: error.message });
        return { success: false, error: "Error deleting category" };
    }
}
