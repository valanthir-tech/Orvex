"use server";

import { z } from "zod";
import prisma from "@/lib/prisma";
import { executeAction } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";

// --- Schemas ---

const CreateCategorySchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    organizationId: z.string().uuid("Organization ID required"),
});

const CreateItemSchema = z.object({
    name: z.string().min(1, "Name is required"),
    price: z.number().min(0),
    costPrice: z.number().min(0).default(0),
    stock: z.number().int().default(0),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    organizationId: z.string().uuid("Organization ID required"),
});

const UpdateStockSchema = z.object({
    itemId: z.string().uuid(),
    quantity: z.number().int(),
    type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    reason: z.string().optional(),
    organizationId: z.string().uuid(),
    profileId: z.string().uuid(),
});

// --- Actions ---

export async function createCategory(data: z.infer<typeof CreateCategorySchema>) {
    return executeAction(CreateCategorySchema, data, async (validated) => {
        const category = await prisma.category.create({
            data: validated,
        });
        revalidatePath("/inventory");
        return category;
    });
}

export async function createItem(data: z.infer<typeof CreateItemSchema>) {
    return executeAction(CreateItemSchema, data, async (validated) => {
        const item = await prisma.item.create({
            data: validated,
        });
        revalidatePath("/inventory");
        return item;
    });
}

export async function getItems(organizationId: string) {
    // Simple fetch, usually called directly in RSC, but useful for client hydration if needed
    if (!organizationId) return [];
    return await prisma.item.findMany({
        where: { organizationId, deletedAt: null },
        include: { category: true },
        orderBy: { name: 'asc' }
    });
}

export async function updateStock(data: z.infer<typeof UpdateStockSchema>) {
    return executeAction(UpdateStockSchema, data, async (validated) => {
        // Transaction to ensure ledger accuracy
        return await prisma.$transaction(async (tx: any) => {
            // 1. Create Stock Entry
            const entry = await tx.stockEntry.create({
                data: {
                    type: validated.type === 'IN' ? 'IN' : validated.type === 'OUT' ? 'OUT' : 'ADJUSTMENT',
                    notes: validated.reason,
                    organizationId: validated.organizationId,
                    profileId: validated.profileId,
                    items: {
                        create: {
                            itemId: validated.itemId,
                            quantity: validated.type === 'OUT' ? -validated.quantity : validated.quantity
                        }
                    }
                }
            });

            // 2. Update Item Stock
            const adjustment = validated.type === 'OUT' ? -validated.quantity : validated.quantity;
            const updatedItem = await tx.item.update({
                where: { id: validated.itemId },
                data: {
                    stock: { increment: adjustment },
                    updatedAt: new Date()
                }
            });

            return { entry, newStock: updatedItem.stock };
        });
    });
}
