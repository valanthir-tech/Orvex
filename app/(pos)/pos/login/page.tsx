"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function POSLoginPage() {
  const router = useRouter()

  useEffect(() => {
    // POS PIN requirement removed: redirect directly to POS register
    router.replace('/pos')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-950">
      <div className="w-8 h-8 border-4 border-[#3255f1] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
