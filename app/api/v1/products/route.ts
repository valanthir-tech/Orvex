/**
 * GET /api/v1/products
 * 
 * List products for the storefront. Supports:
 *   ?search=keyword       - Search by name
 *   ?category=Shirts      - Filter by Item Group
 *   ?page=1&limit=20      - Pagination
 *   ?sort=price_asc       - Sort (price_asc, price_desc, name_asc, newest)
 * 
 * Responses are cached for 5 minutes per tenant to reduce ERPNext load.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { cachedFetch, invalidateCache } from '@/lib/product-cache'

interface ERPNextItem {
    name: string
    item_name: string
    item_code: string
    item_group: string
    stock_uom: string
    standard_rate: number
    description?: string
    image?: string
}

export const GET = withApiAuth(async (req, ctx) => {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const sort = searchParams.get('sort') || 'name_asc'

    // Build cache key from query params
    const cacheKey = `products:${search}:${category}:${sort}`

    // Fetch all matching products (cached)
    const allProducts = await cachedFetch(
        ctx.tenantId,
        cacheKey,
        async () => {
            const filters: [string, string, unknown][] = [
                ['disabled', '=', 0],
                ['is_stock_item', '=', 1],
            ]

            if (search) {
                filters.push(['item_name', 'like', `%${search}%`])
            }
            if (category) {
                filters.push(['item_group', '=', category])
            }

            // Map sort param to ERPNext order_by
            const orderByMap: Record<string, string> = {
                price_asc: 'standard_rate asc',
                price_desc: 'standard_rate desc',
                name_asc: 'item_name asc',
                newest: 'creation desc',
            }

            const items = await ctx.erpnextClient.getList<ERPNextItem>('Item', {
                filters,
                fields: [
                    'name', 'item_name', 'item_code', 'item_group',
                    'stock_uom', 'standard_rate', 'description', 'image',
                ],
                orderBy: orderByMap[sort] || 'item_name asc',
                limit: 0, // Get all, paginate in-memory for cache efficiency
            })

            return items.map(item => ({
                id: item.name,
                name: item.item_name,
                itemCode: item.item_code,
                category: item.item_group,
                price: item.standard_rate,
                description: item.description || '',
                image: item.image || null,
                unit: item.stock_uom,
            }))
        },
        5 * 60 * 1000 // 5 min TTL
    )

    // Paginate
    const offset = (page - 1) * limit
    const pageProducts = allProducts.slice(offset, offset + limit)

    return NextResponse.json({
        products: pageProducts,
        pagination: {
            page,
            limit,
            total: allProducts.length,
            totalPages: Math.ceil(allProducts.length / limit),
            hasMore: offset + limit < allProducts.length,
        },
    })
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
