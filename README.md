# Onedexo POS System

## Project Overview
A modern, offline-first Stock/Inventory Management and Point of Sale (POS) system for Nepal.
Built with Next.js 15, Supabase, and Tailwind CSS 4.

## Status: Phase 1 (Core Setup)
- [x] Next.js Initialization
- [x] Supabase Project Created
- [x] Design System Implementation (Inter font, Colors)
- [x] Basic Dashboard Layout (Sidebar)

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Backend:** Supabase (Auth, Database, Realtime)
- **State:** Zustand + TanStack Query

## Getting Started

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Ensure `.env.local` is set up with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Run Development Server**
   ```bash
   pnpm dev
   ```

4. **Build**
   ```bash
   pnpm build
   ```

## Documentation
See `/docs` for:
- [Design System](./docs/DESIGN_SYSTEM.md)
- [PRD](./PRD_INVENTORY_POS.md)
