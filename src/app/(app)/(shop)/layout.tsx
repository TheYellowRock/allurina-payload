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
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {/* The sticky offer bar sits over the bottom of the screen: pad below the footer (in
          the footer's colour) so the copyright line isn't hidden behind it. */}
      <CartOfferBarScrollPadding className="flex-none bg-stone-50">
        <SiteFooter />
      </CartOfferBarScrollPadding>
    </>
  )
}
