/**
 * GET /api/v1/categories
 * 
 * List product categories (ERPNext Item Groups) for the storefront.
 * Used for navigation, filters, and category pages.
 * Cached for 10 minutes.
 */

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'
import { cachedFetch } from '@/lib/product-cache'

interface ERPNextItemGroup {
    name: string
    parent_item_group?: string
    is_group: 0 | 1
}

export const GET = withApiAuth(async (_req, ctx) => {
    const categories = await cachedFetch(
        ctx.tenantId,
        'categories',
        async () => {
            const groups = await ctx.erpnextClient.getList<ERPNextItemGroup>('Item Group', {
                fields: ['name', 'parent_item_group', 'is_group'],
                limit: 0,
            })

            return groups.map(g => ({
                id: g.name,
                name: g.name,
                parentId: g.parent_item_group || null,
                isGroup: g.is_group === 1,
            }))
        },
        10 * 60 * 1000 // 10 min TTL — categories change rarely
    )

    return NextResponse.json({ categories })
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
