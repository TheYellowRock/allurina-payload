import Link from "next/link"

import { ProductGrid } from "@/components/storefront/product-grid"
import { NOUVEAUTES_PATH, TOUTES_LES_PIECES_PATH } from "@/lib/routes"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

export type CatalogCrumb = { label: string; href?: string }

export function CollectionPageIntro({
  title,
  description,
  breadcrumbs,
}: {
  title: string
  description: string | null
  breadcrumbs: CatalogCrumb[]
}) {
  return (
    <div className="bg-[#faf9f7] px-4 pt-8 pb-5 sm:px-5 md:px-6 md:pt-12 md:pb-8">
      <div className="mx-auto max-w-6xl">
        <nav className="text-[11px] tracking-[0.14em] text-stone-500 uppercase">
          {breadcrumbs.map((c, i) => (
            <span key={`${c.label}-${i}`}>
              {i > 0 ? <span className="mx-2 text-stone-400">/</span> : null}
              {c.href ? (
                <Link href={c.href} className="hover:text-stone-900">
                  {c.label}
                </Link>
              ) : (
                <span className="text-stone-900">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <h1 className="mt-5 text-balance font-sans text-2xl font-medium tracking-[0.18em] text-stone-900 uppercase md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-pretty text-sm leading-relaxed text-stone-500 md:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  )
}

const defaultFooterLinks = [
  { href: TOUTES_LES_PIECES_PATH, label: "Toutes les pièces" },
  { href: NOUVEAUTES_PATH, label: "Nouveautés" },
] as const

export function CollectionProductGrid({
  scarves,
  footerLinks,
}: {
  scarves: StorefrontScarf[]
  footerLinks?: { href: string; label: string }[]
}) {
  const links = footerLinks ?? [...defaultFooterLinks]

  return (
    <div className="border-t border-stone-200/80 bg-[#faf9f7] pb-16 pt-8 md:pb-20 md:pt-10">
      <div className="mx-auto max-w-6xl px-3 sm:px-5 md:px-6">
        <p className="px-0.5 text-[11px] tracking-[0.16em] text-stone-500 uppercase">
          {scarves.length} pièce{scarves.length !== 1 ? "s" : ""}
        </p>

        <ProductGrid scarves={scarves} className="mt-6" />

        <p className="mt-12 text-center text-sm text-stone-500">
          {links.map((link, i) => (
            <span key={link.href}>
              {i > 0 ? " · " : null}
              <Link
                href={link.href}
                className="underline underline-offset-4 hover:text-stone-800"
              >
                {link.label}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </div>
  )
}
