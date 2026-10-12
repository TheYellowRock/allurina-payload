import type { Metadata } from "next"

import { duplicateValues, emptyValues, loadEditorOptions, loadProductForEditor } from "@/lib/catalog/editor-data"
import { requireStaffUser } from "@/lib/studio/getStaffUser"

import { ProductEditor } from "../product-editor"

export const metadata: Metadata = { title: "Nouveau produit" }

type SearchParams = Record<string, string | string[] | undefined>

/** New product — or a copy of `?from=<id>` ("Dupliquer"). */
export default async function NewProductPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  const from = typeof sp.from === "string" && /^\d+$/.test(sp.from) ? Number(sp.from) : null
  const { payload } = await requireStaffUser(
    from ? `/studio/catalogue/nouveau?from=${from}` : "/studio/catalogue/nouveau",
  )

  const options = await loadEditorOptions(payload)
  const source = from ? await loadProductForEditor(payload, from) : null
  const defaultTypeId = options.productTypes.find((t) => t.slug === "chales")?.id ?? options.productTypes[0]?.id ?? null
  const initial = source ? duplicateValues(source.values) : emptyValues(defaultTypeId)

  return (
    <ProductEditor
      key={from ?? "new"}
      productId={null}
      slug={null}
      initial={initial}
      options={options}
    />
  )
}
