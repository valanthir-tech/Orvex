"use client"

import React from "react"

export function POSAuthGuard({ children }: { children: React.ReactNode }) {
    // POS PIN requirement removed: directly render children
    return <>{children}</>
}
