import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import { GoogleTagManager } from "@next/third-parties/google"
import { Geist, Geist_Mono } from "next/font/google"

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
    "Châles en fil de lin, crêpe et mousseline. Boutique en ligne inspirée de l’élégance modeste.",
}

const GTM_ID = (process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MLPCW62M").trim()

/** Shell shared by storefront `(shop)` and staff `/orders_manager` (no shop chrome here). */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Evaluated inside the function so it’s read fresh on every server render
  // and failures are observable in server logs rather than silently rendering null.
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
      <head>
        {pixelId ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                console.log(‘[Meta Pixel] Pixel ID:’, ‘${pixelId}’);
                !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
                n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version=’2.0’;
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window,document,’script’,
                ‘https://connect.facebook.net/en_US/fbevents.js’);
                fbq(‘init’,’${pixelId}’);
                fbq(‘track’,’PageView’);
              `,
            }}
          />
        ) : null}
      </head>
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {GTM_ID ? <GoogleTagManager gtmId={GTM_ID} /> : null}
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
