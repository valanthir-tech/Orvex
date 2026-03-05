'use client';

import { useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { mockProducts } from '@/lib/mock-data';

/**
 * Seeds mock products into Dexie on first load.
 * Only runs once — checks if items already exist.
 */
export function useSeedProducts() {
    const seeded = useRef(false);

    useEffect(() => {
        if (seeded.current) return;
        seeded.current = true;

        async function seed() {
            const count = await db.items.count();
            if (count > 0) return; // Already seeded

            const items = mockProducts
                .filter((p) => p.isActive)
                .map((p) => ({
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    price: p.price,
                    cost: p.cost,
                    stock: p.stock,
                    minStock: p.minStock,
                    category: p.category,
                    barcode: p.barcode,
                    image: p.image,
                    isActive: p.isActive,
                    isSynced: true,
                    updatedAt: new Date(),
                }));

            await db.items.bulkAdd(items);
            console.log(`[Seed] Loaded ${items.length} products into Dexie`);
        }

        seed().catch(console.error);
    }, []);
}
