import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

import { CookieConsent } from "@/components/legal/cookie-consent"
import { ThemeProvider } from "@/components/providers/theme-provider"
import SyncWorker from "@/components/sync/SyncWorker"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Valanthir IMS",
    template: "%s | Valanthir IMS",
  },
  description: "Valanthir IMS is an inventory management and POS workspace for store teams handling products, orders, and day-to-day operations.",
  keywords: ["inventory", "pos", "nepal", "stock management", "point of sale", "erp", "store operations", "valanthir"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SyncWorker />
          {children}
          <Toaster />
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
