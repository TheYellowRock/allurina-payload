import { MobileCartScrollPadding } from "@/components/storefront/cart/mobile-cart-scroll-padding"
import { SiteFooter } from "@/components/storefront/site-footer"
import { SiteHeader } from "@/components/storefront/site-header"
import { getStorefrontCategories } from "@/lib/getStorefrontCategories"
import { getStorefrontCollections } from "@/lib/getStorefrontCollections"

export default async function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [collections, categories] = await Promise.all([
    getStorefrontCollections(),
    getStorefrontCategories(),
  ])

  return (
    <>
      <SiteHeader collections={collections} categories={categories} />
      <MobileCartScrollPadding>{children}</MobileCartScrollPadding>
      <SiteFooter />
    </>
  )
}
