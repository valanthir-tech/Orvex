/**
 * GET /api/v1/products/[id]
 * 
 * Get a single product by its ERPNext item name/code.
 * Cached for 5 minutes per tenant.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { cachedFetch } from '@/lib/product-cache'

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
}

export const GET = withApiAuth(async (req, ctx) => {
    const id = req.nextUrl.pathname.split('/').pop()
    if (!id) {
        return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const product = await cachedFetch(
        ctx.tenantId,
        `product:${id}`,
        async () => {
            const item = await ctx.erpnextClient.getDoc<ERPNextItem>('Item', id)
            if (!item) return null

            return {
                id: item.name,
                name: item.item_name,
                itemCode: item.item_code,
                category: item.item_group,
                price: item.standard_rate,
                description: item.description || '',
                image: item.image || null,
                unit: item.stock_uom,
                inStock: item.is_stock_item === 1,
            }
        },
        5 * 60 * 1000
    )

    if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product })
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
