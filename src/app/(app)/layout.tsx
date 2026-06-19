import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import { GoogleTagManager } from "@next/third-parties/google"
import { Geist, Geist_Mono } from "next/font/google"

import { MetaPixelScript } from "@/components/MetaPixelScript"
import { PixelPageView } from "@/components/PixelPageView"
import { StorefrontProviders } from "@/components/storefront/storefront-providers"

import "../globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "AllurinaScarf — Châles & foulards",
  description:
    "Châles en fil de lin, crêpe et mousseline. Boutique en ligne inspirée de l'élégance modeste.",
}

const GTM_ID = (process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MLPCW62M").trim()

/** Shell shared by storefront `(shop)` and staff `/orders_manager` (no shop chrome here). */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID?.trim()

  if (!pixelId) {
    console.error(
      "[Meta Pixel] NEXT_PUBLIC_FACEBOOK_PIXEL_ID is not set — pixel will not load",
    )
  }

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {GTM_ID ? <GoogleTagManager gtmId={GTM_ID} /> : null}
        {pixelId ? <MetaPixelScript pixelId={pixelId} /> : null}
        {pixelId ? (
          <Suspense fallback={null}>
            <PixelPageView />
          </Suspense>
        ) : null}
        <StorefrontProviders>{children}</StorefrontProviders>
      </body>
    </html>
  )
}
