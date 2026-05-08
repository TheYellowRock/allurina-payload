import Link from "next/link"

import { ScarfCard } from "@/components/storefront/scarf-card"
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
    <div className="border-b border-stone-200/80 bg-[#faf9f7] px-4 pb-8 pt-10 md:px-6 md:pb-10 md:pt-14">
      <div className="mx-auto max-w-6xl">
        <nav className="text-sm text-stone-600">
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
        <h1 className="mt-6 text-balance font-sans text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl lg:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-stone-600 md:text-lg">
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
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <p className="text-sm text-stone-600">
          {scarves.length} pièce{scarves.length !== 1 ? "s" : ""}
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {scarves.map((scarf) => (
            <li key={String(scarf.id)} className="min-w-0">
              <ScarfCard scarf={scarf} />
            </li>
          ))}
        </ul>

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
