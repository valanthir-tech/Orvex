// Types for Products module
import { z } from "zod"
import { badgeStyles } from "@/lib/theme"

// Validation Schemas
export const createProductSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    productCode: z.string().min(2, "Product Code is required"),
    description: z.string().optional(),
    productGroupId: z.string().optional(),
    stockUom: z.string().default("Nos"),
    standardRate: z.coerce.number().min(0, "Selling price cannot be negative"),
    valuationRate: z.coerce.number().min(0, "Cost price cannot be negative").default(0),
    currentStock: z.coerce.number().int().default(0),
    minStockLevel: z.coerce.number().int().min(0).default(0),
    barcode: z.string().optional(),
    isStockProduct: z.boolean().default(true),
    hasBatchNo: z.boolean().default(false),
})

export const updateProductSchema = createProductSchema.partial().extend({
    id: z.string(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>

// Unit of Measure options
export const UOM_OPTIONS = [
    { value: "Nos", label: "Nos (Pieces)" },
    { value: "Kg", label: "Kg (Kilogram)" },
    { value: "g", label: "g (Gram)" },
    { value: "Ltr", label: "Ltr (Liters)" },
    { value: "ml", label: "ml (Milliliter)" },
    { value: "Box", label: "Box" },
    { value: "Pack", label: "Pack" },
    { value: "Set", label: "Set" },
    { value: "Pair", label: "Pair" },
    { value: "Dozen", label: "Dozen" },
    { value: "Meter", label: "Meter" },
    { value: "Feet", label: "Feet" },
] as const

// Default Product Categories for Nepal retail
export const DEFAULT_CATEGORIES = [
    { name: "Groceries", icon: "🛒" },
    { name: "Beverages", icon: "🥤" },
    { name: "Dairy Products", icon: "🥛" },
    { name: "Snacks", icon: "🍿" },
    { name: "Personal Care", icon: "🧴" },
    { name: "Household", icon: "🏠" },
    { name: "Electronics", icon: "📱" },
    { name: "Clothing", icon: "👕" },
    { name: "Stationery", icon: "📝" },
    { name: "Others", icon: "📦" },
] as const

// Stock status helpers
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock"


export function getStockStatus(currentStock: number, minStockLevel: number): StockStatus {
    if (currentStock <= 0) return "out-of-stock"
    if (currentStock <= minStockLevel) return "low-stock"
    return "in-stock"
}

export function getStockStatusColor(status: StockStatus): string {
    switch (status) {
        case "in-stock": return badgeStyles.success
        case "low-stock": return badgeStyles.warning
        case "out-of-stock": return badgeStyles.danger
    }
}

export function getStockStatusLabel(status: StockStatus): string {
    switch (status) {
        case "in-stock": return "In Stock"
        case "low-stock": return "Low Stock"
        case "out-of-stock": return "Out of Stock"
    }
}

// Format price for Nepal
export function formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount)
}
