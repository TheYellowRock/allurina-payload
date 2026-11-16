import { Plus } from "lucide-react"
import Link from "next/link"
import { getPayload } from "payload"
import type { Where } from "payload"

import config from "@payload-config"
import { mediaUrl } from "@/lib/catalog/editor-data"
import { firstParam, STUDIO_PATHS } from "@/lib/studio/paths"

import { CatalogList, type CatalogRow } from "./catalog-list"

type SearchParams = Record<string, string | string[] | undefined>

const LIST_LIMIT = 300

function relId(value: unknown): number | null {
  if (typeof value === "number") return value
  if (value && typeof value === "object" && "id" in value) return relId((value as { id: unknown }).id)
  return null
}

function toRow(d: unknown, typeName: Map<number, string>): CatalogRow {
  const doc = d as Record<string, unknown>
  const tId = relId(doc.productType)
  return {
    id: Number(doc.id),
    title: String(doc.title ?? ""),
    slug: String(doc.slug ?? ""),
    price: Number(doc.price ?? 0),
    stock: Number(doc.stockQuantity ?? 0),
    typeName: tId ? (typeName.get(tId) ?? "") : "",
    hasVariants: doc.hasVariants === true,
    thumb: mediaUrl(doc.featuredImage, true),
  }
}

/** Catalogue page — product list with search, type filter, quick stock and links to the quick editor. */
export async function CatalogTab({ searchParams }: { searchParams: SearchParams }) {
  const q = (firstParam(searchParams.q) ?? "").trim().slice(0, 80)
  const typeParam = firstParam(searchParams.type)
  const typeId = typeParam && /^\d+$/.test(typeParam) ? Number(typeParam) : null

  const payload = await getPayload({ config: await config })
  const types = await payload.find({
    collection: "product-types",
    sort: "navOrder",
    depth: 0,
    limit: 100,
    pagination: false,
    overrideAccess: true,
  })
  const typeName = new Map(types.docs.map((t) => [Number(t.id), String(t.name ?? "")]))

  const filters: Where[] = []
  if (q) filters.push({ title: { like: q } })
  if (typeId) filters.push({ productType: { equals: typeId } })
  // Out-of-stock products never show in the main list — they only live in the
  // "Produits en rupture" collapsible below, fed separately by statsRes.
  filters.push({ stockQuantity: { greater_than: 0 } })

  const selectFields = {
    title: true,
    slug: true,
    price: true,
    stockQuantity: true,
    productType: true,
    hasVariants: true,
    featuredImage: true,
  } as const

  const [res, statsRes] = await Promise.all([
    payload.find({
      collection: "scarves",
      where: filters.length ? { and: filters } : undefined,
      depth: 0, // featuredImage is still hydrated by the collection's afterRead hook
      limit: LIST_LIMIT,
      sort: "-updatedAt",
      select: selectFields,
      overrideAccess: true,
    }),
    // Unfiltered — the stock-by-category cards and the out-of-stock list below
    // always reflect the whole catalogue, independent of the search/type filter above.
    payload.find({
      collection: "scarves",
      depth: 0,
      limit: LIST_LIMIT,
      pagination: false,
      select: selectFields,
      overrideAccess: true,
    }),
  ])

  const rows: CatalogRow[] = res.docs.map((d) => toRow(d, typeName))
  const statsRows: CatalogRow[] = statsRes.docs.map((d) => toRow(d, typeName))

  const stockByType = new Map<string, { stock: number; count: number }>()
  for (const row of statsRows) {
    const entry = stockByType.get(row.typeName) ?? { stock: 0, count: 0 }
    entry.stock += row.stock
    // Count only products actually in stock — out-of-stock ones are tracked separately.
    if (row.stock > 0) entry.count += 1
    stockByType.set(row.typeName, entry)
  }

  const outOfStockRows = statsRows
    .filter((row) => row.stock === 0)
    .sort((a, b) => a.title.localeCompare(b.title))

  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center border px-3 text-sm ${
      active ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700"
    }`
  const typeHref = (id: number | null) => {
    const p = new URLSearchParams()
    if (q) p.set("q", q)
    if (id) p.set("type", String(id))
    const qs = p.toString()
    return qs ? `${STUDIO_PATHS.catalog}?${qs}` : STUDIO_PATHS.catalog
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {types.docs.map((t) => {
          const name = String(t.name ?? "")
          const entry = stockByType.get(name) ?? { stock: 0, count: 0 }
          return (
            <div key={String(t.id)} className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
              <p className="text-sm text-stone-500">Stock restant — {name}</p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">{entry.stock}</p>
              <p className="mt-1 text-xs text-stone-500">
                {entry.count} produit{entry.count > 1 ? "s" : ""}
              </p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {res.totalDocs} produit{res.totalDocs > 1 ? "s" : ""}
        </p>
        <Link
          href={STUDIO_PATHS.newProduct}
          className="inline-flex min-h-10 items-center gap-1.5 bg-stone-900 px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-4" aria-hidden /> Nouveau produit
        </Link>
      </div>

      <form action={STUDIO_PATHS.catalog} className="flex gap-2">
        {typeId ? <input type="hidden" name="type" value={typeId} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un produit…"
          className="min-h-10 flex-1 border border-stone-300 bg-white px-3 text-base outline-none focus:border-stone-900 sm:text-sm"
        />
        <button type="submit" className="min-h-10 border border-stone-400 bg-white px-4 text-sm font-medium">
          OK
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <Link href={typeHref(null)} className={chip(!typeId)}>
          Tous
        </Link>
        {types.docs.map((t) => (
          <Link key={String(t.id)} href={typeHref(Number(t.id))} className={chip(typeId === Number(t.id))}>
            {String(t.name ?? "")}
          </Link>
        ))}
      </div>

      <CatalogList rows={rows} />
      {res.totalDocs > LIST_LIMIT ? (
        <p className="text-xs text-stone-500">
          {LIST_LIMIT} produits affichés sur {res.totalDocs} — affinez avec la recherche.
        </p>
      ) : null}

      {outOfStockRows.length > 0 ? (
        <details className="border border-stone-300 bg-white">
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-stone-900">
            Produits en rupture ({outOfStockRows.length})
          </summary>
          <div className="border-t border-stone-200 p-3">
            <CatalogList rows={outOfStockRows} />
          </div>
        </details>
      ) : null}
    </div>
  )
}
