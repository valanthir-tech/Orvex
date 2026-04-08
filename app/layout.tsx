import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

import { RealtimePosProvider } from "@/components/providers/realtime-pos-provider"
import { QueryProvider } from "@/components/providers/query-provider"
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
    default: "Orvex | Orvex by valanthir tech",
    template: "%s | Orvex by valanthir tech",
  },
  description: "Orvex is an inventory management and POS workspace for store teams handling products, orders, and day-to-day operations.",
  keywords: ["inventory", "pos", "nepal", "stock management", "point of sale", "erp", "store operations", "orvex", "valanthir tech"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
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
          <QueryProvider>
            <RealtimePosProvider>
              <SyncWorker />
              {children}
              <Toaster />
              <CookieConsent />
            </RealtimePosProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
