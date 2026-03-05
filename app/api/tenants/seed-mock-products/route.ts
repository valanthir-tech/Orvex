import { NextResponse } from 'next/server';
import { getTenantClient } from '@/lib/tenant';
import { mockProducts } from '@/lib/mock-data';

export async function POST(req: Request) {
    try {
        const client = await getTenantClient();

        // Ensure an 'Item Group' exists first if needed, though 'All Item Groups' is default
        let createdCount = 0;
        let errors = [];

        for (const product of mockProducts) {
            try {
                // Check if item exists
                const existing = await client.getDoc<any>('Item', product.id);
                if (existing && !existing.exc) {
                    continue; // Skip if exists
                }

                // Create Item
                // In ERPNext, item_code is the primary key for Item
                await client.createDoc('Item', {
                    item_code: product.id,
                    item_name: product.name,
                    item_group: 'All Item Groups',
                    stock_uom: 'Nos',
                    standard_rate: product.price,
                    valuation_rate: product.cost,
                    has_variants: 0,
                    is_stock_item: 0, // Set to 0 so we don't hit "Negative Stock" errors during POS sync testing
                    description: `Category: ${product.category} | SKU: ${product.sku} | Barcode: ${product.barcode}`,
                });

                // Set opening stock (optional, but good for testing POS without stock errors)
                // We'll skip it unless needed, because Stock Entry requires warehouse.
                // In ERPNext v14/v15, if allow_negative_stock is not set, selling fails if no stock.
                // But for now, just creating the item is enough to test if the Sales Invoice passes creation.
                // Sales Invoice with 'update_stock: 1' might fail if no stock, so we'll see!

                createdCount++;
            } catch (err: any) {
                console.warn(`Failed to seed product ${product.id}:`, err);
                errors.push({ id: product.id, error: err.message });
            }
        }

        // Also ensure a POS Profile exists, or at least that Walk-in Customer is there (done in provisioning).
        return NextResponse.json({
            success: true,
            created: createdCount,
            errors,
        });

    } catch (error: any) {
        console.error('Seed Products Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
