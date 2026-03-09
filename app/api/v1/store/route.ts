/**
 * GET /api/v1/store
 * 
 * Returns public store information for the tenant.
 * Used by storefronts to display store name, logo, contact info.
 */

import { NextResponse } from 'next/server'
import { withApiAuth } from '@/lib/api-auth'

export const GET = withApiAuth(async (_req, ctx) => {
    return NextResponse.json({
        store: {
            name: ctx.tenantSettings.storeName,
            address: ctx.tenantSettings.storeAddress,
            phone: ctx.tenantSettings.storePhone,
            email: ctx.tenantSettings.storeEmail,
            logoUrl: ctx.tenantSettings.storeLogoUrl,
            currency: ctx.tenantSettings.currency,
            currencySymbol: ctx.tenantSettings.currencySymbol,
            taxRate: ctx.tenantSettings.taxRate,
            taxLabel: ctx.tenantSettings.taxLabel,
        },
    })
})

export const OPTIONS = withApiAuth(async () => {
    return new NextResponse(null, { status: 204 })
})
