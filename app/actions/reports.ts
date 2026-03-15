"use server"

import { getTenantClient } from "@/lib/tenant"

export interface DailySalesData {
    date: string
    totalSales: number
    invoiceCount: number
    totalTax: number
}

export interface TopSellingItem {
    itemCode: string
    itemName: string
    totalQty: number
    totalAmount: number
}

export interface PaymentBreakdown {
    mode: string
    count: number
    amount: number
}

export interface SalesSummary {
    todaySales: number
    todayInvoices: number
    todayTax: number
    weekSales: number
    weekInvoices: number
    monthSales: number
    monthInvoices: number
}

// Get sales summary (today, this week, this month)
export async function getSalesSummary(): Promise<SalesSummary> {
    try {
        const client = await getTenantClient()
        const today = new Date().toISOString().split("T")[0]

        // Get start of week (Sunday)
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekStartStr = weekStart.toISOString().split("T")[0]

        // Get start of month
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`

        // Fetch today's invoices
        const todayInvoices = await client.getList<{
            grand_total: number
            total_taxes_and_charges: number
        }>("Sales Invoice", {
            filters: [
                ["posting_date", "=", today],
                ["docstatus", "=", 1],
            ],
            fields: ["grand_total", "total_taxes_and_charges"],
            limit: 0,
        })

        // Fetch this week's invoices
        const weekInvoices = await client.getList<{
            grand_total: number
        }>("Sales Invoice", {
            filters: [
                ["posting_date", ">=", weekStartStr],
                ["posting_date", "<=", today],
                ["docstatus", "=", 1],
            ],
            fields: ["grand_total"],
            limit: 0,
        })

        // Fetch this month's invoices
        const monthInvoices = await client.getList<{
            grand_total: number
        }>("Sales Invoice", {
            filters: [
                ["posting_date", ">=", monthStart],
                ["posting_date", "<=", today],
                ["docstatus", "=", 1],
            ],
            fields: ["grand_total"],
            limit: 0,
        })

        return {
            todaySales: todayInvoices.reduce((s, i) => s + i.grand_total, 0),
            todayInvoices: todayInvoices.length,
            todayTax: todayInvoices.reduce(
                (s, i) => s + (i.total_taxes_and_charges || 0),
                0
            ),
            weekSales: weekInvoices.reduce((s, i) => s + i.grand_total, 0),
            weekInvoices: weekInvoices.length,
            monthSales: monthInvoices.reduce((s, i) => s + i.grand_total, 0),
            monthInvoices: monthInvoices.length,
        }
    } catch (error) {
        console.error("Get sales summary error:", error)
        return {
            todaySales: 0,
            todayInvoices: 0,
            todayTax: 0,
            weekSales: 0,
            weekInvoices: 0,
            monthSales: 0,
            monthInvoices: 0,
        }
    }
}

// Get daily sales for a date range
export async function getDailySales(
    days: number = 7
): Promise<DailySalesData[]> {
    try {
        const client = await getTenantClient()
        const today = new Date()
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - days + 1)
        const startStr = startDate.toISOString().split("T")[0]
        const todayStr = today.toISOString().split("T")[0]

        const invoices = await client.getList<{
            posting_date: string
            grand_total: number
            total_taxes_and_charges: number
        }>("Sales Invoice", {
            filters: [
                ["posting_date", ">=", startStr],
                ["posting_date", "<=", todayStr],
                ["docstatus", "=", 1],
            ],
            fields: [
                "posting_date",
                "grand_total",
                "total_taxes_and_charges",
            ],
            limit: 0,
        })

        // Group by date
        const byDate = new Map<
            string,
            { totalSales: number; invoiceCount: number; totalTax: number }
        >()

        // Initialize all dates in range
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split("T")[0]
            byDate.set(dateStr, {
                totalSales: 0,
                invoiceCount: 0,
                totalTax: 0,
            })
        }

        for (const inv of invoices) {
            const existing = byDate.get(inv.posting_date) || {
                totalSales: 0,
                invoiceCount: 0,
                totalTax: 0,
            }
            existing.totalSales += inv.grand_total
            existing.invoiceCount += 1
            existing.totalTax += inv.total_taxes_and_charges || 0
            byDate.set(inv.posting_date, existing)
        }

        return Array.from(byDate.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, data]) => ({ date, ...data }))
    } catch (error) {
        console.error("Get daily sales error:", error)
        return []
    }
}

// Get top selling items
export async function getTopSellingItems(
    limit: number = 10
): Promise<TopSellingItem[]> {
    try {
        const client = await getTenantClient()

        // Get this month's start
        const now = new Date()
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`
        const today = now.toISOString().split("T")[0]

        // Fetch submitted invoices for this month, then aggregate items via getDoc
        const invoices = await client.getList<{
            name: string
        }>("Sales Invoice", {
            filters: [
                ["posting_date", ">=", monthStart],
                ["posting_date", "<=", today],
                ["docstatus", "=", 1],
            ],
            fields: ["name"],
            limit: 100,
        })

        const itemMap = new Map<
            string,
            {
                itemCode: string
                itemName: string
                totalQty: number
                totalAmount: number
            }
        >()

        for (const inv of invoices) {
            try {
                const doc = await client.getDoc<{
                    items: Array<{
                        item_code: string
                        item_name: string
                        qty: number
                        amount: number
                    }>
                }>("Sales Invoice", inv.name)

                if (doc?.items) {
                    for (const item of doc.items) {
                        const existing = itemMap.get(item.item_code) || {
                            itemCode: item.item_code,
                            itemName: item.item_name,
                            totalQty: 0,
                            totalAmount: 0,
                        }
                        existing.totalQty += item.qty
                        existing.totalAmount += item.amount
                        itemMap.set(item.item_code, existing)
                    }
                }
            } catch {
                // Skip failed individual fetches
            }
        }

        return Array.from(itemMap.values())
            .sort((a, b) => b.totalAmount - a.totalAmount)
            .slice(0, limit)
    } catch (error) {
        console.error("Get top selling items error:", error)
        return []
    }
}

// Get payment mode breakdown for today
export async function getPaymentBreakdown(): Promise<PaymentBreakdown[]> {
    try {
        const client = await getTenantClient()
        const today = new Date().toISOString().split("T")[0]

        const invoices = await client.getList<{
            name: string
        }>("Sales Invoice", {
            filters: [
                ["posting_date", "=", today],
                ["docstatus", "=", 1],
            ],
            fields: ["name"],
            limit: 0,
        })

        const modeMap = new Map<
            string,
            { count: number; amount: number }
        >()

        for (const inv of invoices) {
            try {
                const doc = await client.getDoc<{
                    payments: Array<{
                        mode_of_payment: string
                        amount: number
                    }>
                }>("Sales Invoice", inv.name)

                if (doc?.payments) {
                    for (const p of doc.payments) {
                        const existing = modeMap.get(p.mode_of_payment) || {
                            count: 0,
                            amount: 0,
                        }
                        existing.count += 1
                        existing.amount += p.amount
                        modeMap.set(p.mode_of_payment, existing)
                    }
                }
            } catch {
                // Skip failed individual fetches
            }
        }

        return Array.from(modeMap.entries()).map(([mode, data]) => ({
            mode,
            ...data,
        }))
    } catch (error) {
        console.error("Get payment breakdown error:", error)
        return []
    }
}
