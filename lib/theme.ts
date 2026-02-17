/**
 * 🎨 THEME CONFIGURATION
 * 
 * This file contains all the semantic color definitions for your app.
 * Change these values to easily customize your theme across the entire UI.
 * 
 * Usage in components:
 * - Import: import { colors, cardStyles, badgeStyles } from '@/lib/theme'
 * - Use: className={colors.success.badge} or className={cardStyles.teal.classes}
 */

// =============================================================================
// COLOR DEFINITIONS
// =============================================================================

// Base color tokens - Tailwind class fragments
const colorTokens = {
    teal: {
        base: 'teal',
        gradient: 'from-teal-500 to-teal-600',
        shadow: 'shadow-teal-500/30',
        hoverShadow: 'hover:shadow-teal-500/20',
        overlay: 'from-teal-500/5 via-teal-500/5',
        ring: 'ring-teal-500',
        badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
        text: 'text-teal-700 dark:text-teal-400',
    },
    sky: {
        base: 'sky',
        gradient: 'from-sky-500 to-sky-600',
        shadow: 'shadow-sky-500/30',
        hoverShadow: 'hover:shadow-sky-500/20',
        overlay: 'from-sky-500/5 via-sky-500/5',
        ring: 'ring-sky-500',
        badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
        text: 'text-sky-700 dark:text-sky-400',
    },
    emerald: {
        base: 'emerald',
        gradient: 'from-emerald-500 to-emerald-600',
        shadow: 'shadow-emerald-500/30',
        hoverShadow: 'hover:shadow-emerald-500/20',
        overlay: 'from-emerald-500/5 via-emerald-500/5',
        ring: 'ring-emerald-500',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        text: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
        base: 'amber',
        gradient: 'from-amber-500 to-amber-600',
        shadow: 'shadow-amber-500/30',
        hoverShadow: 'hover:shadow-amber-500/20',
        overlay: 'from-amber-500/5 via-amber-500/5',
        ring: 'ring-amber-500',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        text: 'text-amber-600 dark:text-amber-400',
    },
    rose: {
        base: 'rose',
        gradient: 'from-rose-500 to-rose-600',
        shadow: 'shadow-rose-500/30',
        hoverShadow: 'hover:shadow-rose-500/20',
        overlay: 'from-rose-500/5 via-rose-500/5',
        ring: 'ring-rose-500',
        badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        text: 'text-rose-600 dark:text-rose-400',
    },
    violet: {
        base: 'violet',
        gradient: 'from-violet-500 to-violet-600',
        shadow: 'shadow-violet-500/30',
        hoverShadow: 'hover:shadow-violet-500/20',
        overlay: 'from-violet-500/5 via-violet-500/5',
        ring: 'ring-violet-500',
        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
        text: 'text-violet-700 dark:text-violet-400',
    },
} as const

// =============================================================================
// SEMANTIC COLORS (for status indicators)
// =============================================================================

export const colors = {
    // Success - In stock, completed, positive states
    success: colorTokens.emerald,
    // Warning - Low stock, pending, needs attention
    warning: colorTokens.amber,
    // Danger - Out of stock, errors, critical
    danger: colorTokens.rose,
    // Info - Neutral information, totals
    info: colorTokens.sky,
    // Primary accent
    teal: colorTokens.teal,
    // Secondary accent
    violet: colorTokens.violet,
} as const

// =============================================================================
// STAT CARD STYLES (Dashboard cards with colored icons)
// =============================================================================

export const cardStyles = {
    teal: {
        icon: `h-10 w-10 rounded-2xl bg-gradient-to-br ${colorTokens.teal.gradient} flex items-center justify-center shadow-lg ${colorTokens.teal.shadow} transition-transform duration-300 group-hover:scale-110`,
        card: `group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl ${colorTokens.teal.hoverShadow} hover:-translate-y-1 card-float`,
        overlay: `absolute inset-0 bg-gradient-to-br ${colorTokens.teal.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`,
        ring: `ring-2 ${colorTokens.teal.ring}`,
    },
    sky: {
        icon: `h-10 w-10 rounded-2xl bg-gradient-to-br ${colorTokens.sky.gradient} flex items-center justify-center shadow-lg ${colorTokens.sky.shadow} transition-transform duration-300 group-hover:scale-110`,
        card: `group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl ${colorTokens.sky.hoverShadow} hover:-translate-y-1 card-float`,
        overlay: `absolute inset-0 bg-gradient-to-br ${colorTokens.sky.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`,
        ring: `ring-2 ${colorTokens.sky.ring}`,
    },
    emerald: {
        icon: `h-10 w-10 rounded-2xl bg-gradient-to-br ${colorTokens.emerald.gradient} flex items-center justify-center shadow-lg ${colorTokens.emerald.shadow} transition-transform duration-300 group-hover:scale-110`,
        card: `group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl ${colorTokens.emerald.hoverShadow} hover:-translate-y-1 card-float`,
        overlay: `absolute inset-0 bg-gradient-to-br ${colorTokens.emerald.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`,
        ring: `ring-2 ${colorTokens.emerald.ring}`,
    },
    amber: {
        icon: `h-10 w-10 rounded-2xl bg-gradient-to-br ${colorTokens.amber.gradient} flex items-center justify-center shadow-lg ${colorTokens.amber.shadow} transition-transform duration-300 group-hover:scale-110`,
        card: `group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl ${colorTokens.amber.hoverShadow} hover:-translate-y-1 card-float`,
        overlay: `absolute inset-0 bg-gradient-to-br ${colorTokens.amber.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`,
        ring: `ring-2 ${colorTokens.amber.ring}`,
    },
    rose: {
        icon: `h-10 w-10 rounded-2xl bg-gradient-to-br ${colorTokens.rose.gradient} flex items-center justify-center shadow-lg ${colorTokens.rose.shadow} transition-transform duration-300 group-hover:scale-110`,
        card: `group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl ${colorTokens.rose.hoverShadow} hover:-translate-y-1 card-float`,
        overlay: `absolute inset-0 bg-gradient-to-br ${colorTokens.rose.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`,
        ring: `ring-2 ${colorTokens.rose.ring}`,
    },
    violet: {
        icon: `h-10 w-10 rounded-2xl bg-gradient-to-br ${colorTokens.violet.gradient} flex items-center justify-center shadow-lg ${colorTokens.violet.shadow} transition-transform duration-300 group-hover:scale-110`,
        card: `group relative overflow-hidden border-0 rounded-2xl transition-all duration-300 hover:shadow-xl ${colorTokens.violet.hoverShadow} hover:-translate-y-1 card-float`,
        overlay: `absolute inset-0 bg-gradient-to-br ${colorTokens.violet.overlay} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`,
        ring: `ring-2 ${colorTokens.violet.ring}`,
    },
} as const

// =============================================================================
// BADGE STYLES (for status labels, rankings, etc.)
// =============================================================================

export const badgeStyles = {
    success: colorTokens.emerald.badge,
    warning: colorTokens.amber.badge,
    danger: colorTokens.rose.badge,
    info: colorTokens.sky.badge,
    teal: colorTokens.teal.badge,
    violet: colorTokens.violet.badge,
} as const

// =============================================================================
// STOCK STATUS HELPERS
// =============================================================================

export type StockStatusType = 'in-stock' | 'low-stock' | 'out-of-stock'

// Card style type - union of all possible card styles
export type CardStyle = (typeof cardStyles)[keyof typeof cardStyles]

export interface StockStatusResult {
    status: StockStatusType
    label: string
    badge: string
    text: string
    cardStyle: CardStyle
    colorKey: 'emerald' | 'amber' | 'rose'
}

/**
 * Get complete stock status info including styling
 */
export function getStockStatusInfo(currentStock: number, minStockLevel: number = 0): StockStatusResult {
    if (currentStock <= 0) {
        return {
            status: 'out-of-stock',
            label: 'Out of Stock',
            badge: badgeStyles.danger,
            text: colorTokens.rose.text,
            cardStyle: cardStyles.rose,
            colorKey: 'rose',
        }
    }
    if (currentStock <= minStockLevel) {
        return {
            status: 'low-stock',
            label: 'Low Stock',
            badge: badgeStyles.warning,
            text: colorTokens.amber.text,
            cardStyle: cardStyles.amber,
            colorKey: 'amber',
        }
    }
    return {
        status: 'in-stock',
        label: 'In Stock',
        badge: badgeStyles.success,
        text: colorTokens.emerald.text,
        cardStyle: cardStyles.emerald,
        colorKey: 'emerald',
    }
}

// =============================================================================
// DASHBOARD HELPERS
// =============================================================================

// Stat card color order for dashboard
export const dashboardCardOrder = ['teal', 'sky', 'amber', 'rose'] as const

// Top items ranking colors (for leaderboards)
export const rankingColors = ['teal', 'sky', 'amber', 'violet'] as const

/**
 * Get card style by index (cycles through colors)
 */
export function getCardStyleByIndex(index: number) {
    const colorKeys = Object.keys(cardStyles) as (keyof typeof cardStyles)[]
    return cardStyles[colorKeys[index % colorKeys.length]]
}

/**
 * Get badge style by index (for rankings)
 */
export function getBadgeByIndex(index: number) {
    const keys = rankingColors
    return colorTokens[keys[index % keys.length]].badge
}

/**
 * Get progress bar color by index
 */
export function getProgressBarColor(index: number) {
    const barColors = ['bg-teal-500', 'bg-sky-500', 'bg-amber-500', 'bg-violet-500']
    return barColors[index % barColors.length]
}

// =============================================================================
// CHART COLORS (for data visualization)
// =============================================================================

export const chartColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
] as const

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type ColorKey = keyof typeof colors
export type CardStyleKey = keyof typeof cardStyles
export type BadgeStyleKey = keyof typeof badgeStyles
