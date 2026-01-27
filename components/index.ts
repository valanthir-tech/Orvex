/**
 * Components Index
 * 
 * This file provides a central export point for all custom components.
 * Import from here for cleaner imports across the application.
 * 
 * Usage:
 * import { StatCard, PageHeader, ThemeToggle } from "@/components"
 * 
 * Structure:
 * - /ui          - shadcn/ui primitives (Button, Card, Input, etc.)
 * - /common      - Shared layout/utility components
 * - /dashboard   - Dashboard-specific components
 * - /providers   - React context providers
 */

// Common components (layouts, utilities)
export * from "./common"

// Dashboard components
export * from "./dashboard"

// Providers
export * from "./providers"

// App-level components
export { AppSidebar } from "./app-sidebar"
