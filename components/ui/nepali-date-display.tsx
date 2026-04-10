"use client"

import { useEffect, useState } from "react"
import { CalendarDays } from "lucide-react"
import { getCurrentBikramSambat } from "@/lib/nepali-date"

export function NepaliDateDisplay() {
  const [bsDate, setBsDate] = useState<string>("")

  useEffect(() => {
    // Client-side only rendering to prevent SSR hydration mismatch for dates
    setBsDate(getCurrentBikramSambat())
  }, [])

  if (!bsDate) return null // hide during SSR to avoid flicker

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border">
      <CalendarDays className="h-4 w-4 text-primary" />
      <span className="font-medium">{bsDate}</span>
      <span className="text-[10px] uppercase font-bold tracking-wider ml-1 opacity-70">BS</span>
    </div>
  )
}
