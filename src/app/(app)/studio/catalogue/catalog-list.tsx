"use client"

import { Copy, Minus, Pencil, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { studioDuplicatePath, studioProductPath } from "@/lib/studio/paths"
import { cn } from "@/lib/utils"

export type CatalogRow = {
  id: number
  title: string
  slug: string
  price: number
  stock: number
  typeName: string
  hasVariants: boolean
  thumb: string | null
}

function StockControl({ row }: { row: CatalogRow }) {
  const [stock, setStock] = useState(row.stock)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  if (row.hasVariants) {
    return (
      <span className="text-sm text-stone-700" title="Somme des variantes">
        {stock} <span className="text-xs text-stone-400">(variantes)</span>
      </span>
    )
  }

  const change = async (delta: number) => {
    setBusy(true)
    setError(false)
    try {
      const res = await fetch(`/api/studio/products/${row.id}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ delta }),
      })
      const data = (await res.json().catch(() => ({}))) as { stockQuantity?: number }
      if (!res.ok || typeof data.stockQuantity !== "number") throw new Error()
      setStock(data.stockQuantity)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => void change(-1)}
        disabled={busy || stock <= 0}
        className="flex size-9 items-center justify-center border border-stone-300 bg-white disabled:opacity-40"
        aria-label={`Retirer 1 au stock de ${row.title}`}
      >
        <Minus className="size-4" />
      </button>
      <span
        className={cn(
          "min-w-10 text-center text-sm font-semibold tabular-nums",
          stock === 0 ? "text-red-600" : "text-stone-900",
          error && "text-red-600 underline decoration-dotted",
        )}
        title={error ? "Échec — réessayez" : undefined}
      >
        {stock}
      </span>
      <button
        type="button"
        onClick={() => void change(1)}
        disabled={busy}
        className="flex size-9 items-center justify-center border border-stone-300 bg-white disabled:opacity-40"
        aria-label={`Ajouter 1 au stock de ${row.title}`}
      >
        <Plus className="size-4" />
      </button>
    </div>
  )
}

export function CatalogList({ rows }: { rows: CatalogRow[] }) {
  if (rows.length === 0) {
    return <p className="border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">Aucun produit.</p>
  }
  return (
    <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
          <Link href={studioProductPath(row.id)} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="size-14 shrink-0 overflow-hidden bg-stone-100">
              {row.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element -- storage thumbnail
                <img src={row.thumb} alt="" className="size-full object-cover" loading="lazy" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-stone-900">{row.title}</span>
              <span className="mt-0.5 block text-xs text-stone-500">
                {row.typeName}
                {row.hasVariants ? " · tailles/couleurs" : ""} · {row.price} DH
              </span>
            </span>
          </Link>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <StockControl row={row} />
            <div className="flex gap-1">
              <Link
                href={studioDuplicatePath(row.id)}
                className="flex size-9 items-center justify-center border border-stone-300 bg-white text-stone-700"
                aria-label={`Dupliquer ${row.title}`}
                title="Dupliquer"
              >
                <Copy className="size-4" />
              </Link>
              <Link
                href={studioProductPath(row.id)}
                className="flex size-9 items-center justify-center border border-stone-300 bg-white text-stone-700"
                aria-label={`Modifier ${row.title}`}
                title="Modifier"
              >
                <Pencil className="size-4" />
              </Link>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
