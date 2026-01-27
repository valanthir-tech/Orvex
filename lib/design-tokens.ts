/**
 * ========================================
 * INVENTORY POS - DESIGN TOKENS
 * ========================================
 * 
 * This file contains all design tokens for the application.
 * To change colors, update ONLY this file and globals.css.
 * 
 * Color Palette: Modern Professional (Slate/Stone + Teal/Amber)
 * Inspired by: Samparka.co, Linear, Stripe
 * 
 * NO GREEN ALLOWED (#22C55E, emerald, green-500, etc.)
 * 
 * SEMANTIC COLORS:
 * - success: Teal (#0D9488) - professional alternative
 * - warning: Amber (#D97706)
 * - error: Rose (#E11D48)
 * - info: Sky blue (#0284C7)
 */

export const designTokens = {
    // ===== BRAND COLORS =====
    brand: {
        primary: '#1C1917',        // Stone 900 - Main actions, buttons
        secondary: '#44403C',      // Stone 700 - Secondary text
        accent: '#D97706',         // Amber 600 - Accent/CTA
    },

    // ===== SEMANTIC COLORS (NO GREEN) =====
    semantic: {
        success: '#0D9488',        // Teal 600 - Positive indicators
        warning: '#D97706',        // Amber 600 - Warnings, alerts
        error: '#E11D48',          // Rose 600 - Errors, destructive
        info: '#0284C7',           // Sky 600 - Informational
    },

    // ===== CHART/DATA COLORS =====
    chart: {
        1: '#0D9488',              // Teal 600
        2: '#0284C7',              // Sky 600
        3: '#D97706',              // Amber 600
        4: '#7C3AED',              // Violet 600
        5: '#DC2626',              // Red 600
    },

    // ===== STAT CARD COLORS =====
    statCards: {
        revenue: {
            color: 'teal',
            gradient: 'from-teal-500 to-teal-600',
            glow: 'shadow-teal-500/20',
        },
        orders: {
            color: 'sky',
            gradient: 'from-sky-500 to-sky-600',
            glow: 'shadow-sky-500/20',
        },
        items: {
            color: 'amber',
            gradient: 'from-amber-500 to-amber-600',
            glow: 'shadow-amber-500/20',
        },
        alert: {
            color: 'rose',
            gradient: 'from-rose-500 to-rose-600',
            glow: 'shadow-rose-500/20',
        },
    },

    // ===== NEUTRAL PALETTE (Stone) =====
    neutral: {
        50: '#FAFAF9',
        100: '#F5F5F4',
        200: '#E7E5E4',
        300: '#D6D3D1',
        400: '#A8A29E',
        500: '#78716C',
        600: '#57534E',
        700: '#44403C',
        800: '#292524',
        900: '#1C1917',
        950: '#0C0A09',
    },
} as const

/**
 * FORBIDDEN COLORS:
 * - #22C55E (green-500/emerald-500)
 * - #4ADE80 (green-400)
 * - #16A34A (green-600)
 * - Any emerald-* colors
 * - Any green-* colors
 * 
 * USE INSTEAD:
 * - Teal for success/positive: #0D9488 (teal-600)
 * - Sky for information: #0284C7 (sky-600)
 */
