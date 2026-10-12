import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { loadEditorOptions, loadProductForEditor } from "@/lib/catalog/editor-data"
import { requireStaffUser } from "@/lib/studio/getStaffUser"

import { ProductEditor } from "../product-editor"

export const metadata: Metadata = { title: "Modifier le produit" }

type Params = Promise<{ id: string }>
type SearchParams = Record<string, string | string[] | undefined>

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const sp = await searchParams
  if (!/^\d+$/.test(id)) notFound()
  const { payload } = await requireStaffUser(`/studio/catalogue/${id}`)

  const [options, product] = await Promise.all([
    loadEditorOptions(payload),
    loadProductForEditor(payload, Number(id)),
  ])
  if (!product) notFound()

  return (
    <ProductEditor
      key={product.id}
      productId={product.id}
      slug={product.slug}
      initial={product.values}
      options={options}
      justSaved={sp.saved === "1"}
    />
  )
}
