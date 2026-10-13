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
    default: "Onedexo | Modern ERP & Retail OS",
    template: "%s | Onedexo",
  },
  description: "Onedexo is an inventory management and POS workspace for store teams handling products, orders, and day-to-day operations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Onedexo POS",
  },
  keywords: ["inventory", "pos", "nepal", "stock management", "point of sale", "erp", "store operations", "onedexo"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f4f4f5", // matches bg-zinc-100
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
