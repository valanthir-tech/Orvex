"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

export function RealtimePosProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) return

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Listen to changes on tenant items & pos sessions to instantly refresh POS cache and UI
    const channel = supabase
      .channel('pos_dashboard_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tenant_items' },
        () => {
          router.refresh() // Invalidate Server Components automatically
          // When React Query cache invalidation is added, trigger it here too.
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales_invoices' },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  return <>{children}</>
}