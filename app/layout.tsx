import type { Metadata } from "next"
import { Rubik, Nunito_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import SyncWorker from "@/components/sync/SyncWorker"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Inventory POS",
    template: "%s | Inventory POS",
  },
  description: "Modern Inventory & POS System for Nepal",
  keywords: ["inventory", "pos", "nepal", "stock management", "point of sale"],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${rubik.variable} ${nunitoSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SyncWorker />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
