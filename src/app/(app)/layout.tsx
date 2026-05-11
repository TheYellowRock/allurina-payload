import type { Metadata, Viewport } from "next";
import { GoogleTagManager } from "@next/third-parties/google";
import { Geist, Geist_Mono } from "next/font/google";

import { MobileCartScrollPadding } from "@/components/storefront/cart/mobile-cart-scroll-padding";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { StorefrontProviders } from "@/components/storefront/storefront-providers";
import { getStorefrontCategories } from "@/lib/getStorefrontCategories";
import { getStorefrontCollections } from "@/lib/getStorefrontCollections";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "AllurinaScarf — Châles & foulards",
  description:
    "Châles en fil de lin, crêpe et mousseline. Boutique en ligne inspirée de l’élégance modeste.",
};

const GTM_ID = (process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MLPCW62M").trim()

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [collections, categories] = await Promise.all([
    getStorefrontCollections(),
    getStorefrontCategories(),
  ]);

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col font-sans"
        suppressHydrationWarning
      >
        {GTM_ID ? <GoogleTagManager gtmId={GTM_ID} /> : null}
        <StorefrontProviders>
          <SiteHeader collections={collections} categories={categories} />
          <MobileCartScrollPadding>{children}</MobileCartScrollPadding>
          <SiteFooter />
        </StorefrontProviders>
      </body>
    </html>
  );
}
