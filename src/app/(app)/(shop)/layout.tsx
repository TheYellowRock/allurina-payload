import { CartOfferBarScrollPadding } from "@/components/storefront/cart/cart-offer-bar-scroll-padding"
import { SiteFooter } from "@/components/storefront/site-footer"
import { SiteHeader } from "@/components/storefront/site-header"
import { getStorefrontCategories } from "@/lib/getStorefrontCategories"
import { getStorefrontCollections } from "@/lib/getStorefrontCollections"
import { getActivePromo } from "@/lib/promotions/active"

export default async function ShopLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [collections, categories, activePromo] = await Promise.all([
    getStorefrontCollections(),
    getStorefrontCategories(),
    getActivePromo(),
  ])

  return (
    <>
      <SiteHeader collections={collections} categories={categories} topBar={activePromo.topBar} />
      <CartOfferBarScrollPadding>{children}</CartOfferBarScrollPadding>
      <SiteFooter />
    </>
  )
}
