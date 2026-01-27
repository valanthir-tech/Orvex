
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

// Use a specific valid shape for the sync payload
// We only accept minimal data required to reconstruct the order
const SyncOrderSchema = z.object({
    connectionId: z.string().optional(), // For debug/tracking
    orders: z.array(z.object({
        uuid: z.string().uuid(),
        orderNumber: z.string().optional(), // If generated offline
        status: z.enum(['COMPLETED', 'Cancelled']),
        customerName: z.string().optional(),
        customerPan: z.string().optional(),
        subTotal: z.number(),
        taxTotal: z.number(),
        grandTotal: z.number(),
        paymentMode: z.enum(['CASH', 'CARD', 'QR', 'CREDIT']),
        items: z.array(z.object({
            itemId: z.string(), // We assume this is the UUID from DB
            name: z.string(),
            price: z.number(),
            quantity: z.number(),
            total: z.number()
        })),
        createdAt: z.string().datetime() // Generic ISO string
    }))
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const result = SyncOrderSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid payload', details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { orders } = result.data;
        const syncedIds: string[] = [];
        const errors: any[] = [];

        // Process sequentially to handle dependent inventory updates
        // In a high-volume scenario, we might use a queue
        for (const orderData of orders) {
            try {
                // Idempotency Check: Check if order already exists
                const existing = await prisma.order.findUnique({
                    where: { id: orderData.uuid }
                });

                if (existing) {
                    syncedIds.push(orderData.uuid);
                    continue;
                }

                // Transaction: Create Order + Items
                // TODO: Decrement Stock (Separate Step or Trigger?)
                await prisma.order.create({
                    data: {
                        id: orderData.uuid,
                        status: 'SYNCED', // Mark as synced
                        orderNumber: orderData.orderNumber || `OFF-${orderData.uuid.slice(0, 8)}`,
                        customerName: orderData.customerName,
                        customerPan: orderData.customerPan,
                        subTotal: orderData.subTotal,
                        taxTotal: orderData.taxTotal,
                        discountTotal: 0, // TODO: Add discount support
                        grandTotal: orderData.grandTotal,
                        paymentMode: orderData.paymentMode as any, // Cast to enum
                        organizationId: 'default-org', // TODO: Get from Auth Context
                        syncedAt: new Date(),
                        createdAt: new Date(orderData.createdAt),
                        items: {
                            create: orderData.items.map(item => ({
                                itemId: item.itemId,
                                name: item.name,
                                price: item.price,
                                quantity: item.quantity,
                                total: item.total
                            }))
                        }
                    }
                });

                syncedIds.push(orderData.uuid);

            } catch (err: any) {
                console.error(`Failed to sync order ${orderData.uuid}:`, err);
                errors.push({ id: orderData.uuid, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            syncedCount: syncedIds.length,
            syncedIds,
            errors
        });

    } catch (error) {
        console.error('Sync API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
