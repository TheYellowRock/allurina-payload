"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import type { RangeKey, ResolvedRange } from "@/lib/orders-manager/date-range"
import { cn } from "@/lib/utils"

const PRESETS: Array<{ key: Exclude<RangeKey, "custom">; label: string }> = [
  { key: "this_month", label: "Ce mois-ci" },
  { key: "last_month", label: "Mois dernier" },
  { key: "last_7", label: "7 derniers jours" },
  { key: "last_30", label: "30 derniers jours" },
]

/** Shared by the Métriques and Produits tabs — both read/write the same `range`/`from`/`to` URL params. */
export function DateRangePicker({ tab, range }: { tab: "metrics" | "products"; range: ResolvedRange }) {
  const router = useRouter()
  const pathname = usePathname()
  const [fromDraft, setFromDraft] = useState(range.key === "custom" ? range.startYmd : "")
  const [toDraft, setToDraft] = useState(range.key === "custom" ? range.endYmd : "")

  const presetHref = (key: RangeKey) => `${pathname}?tab=${tab}&range=${key}`

  const applyCustom = () => {
    if (!fromDraft || !toDraft) return
    router.push(`${pathname}?tab=${tab}&range=custom&from=${fromDraft}&to=${toDraft}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Link
            key={p.key}
            href={presetHref(p.key)}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors",
              range.key === p.key
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-500",
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={fromDraft}
          max={toDraft || undefined}
          onChange={(e) => setFromDraft(e.target.value)}
          className="h-9 border border-stone-400 bg-white px-2 text-xs text-stone-900"
          aria-label="Début de la période personnalisée"
        />
        <span className="text-xs text-stone-500">→</span>
        <input
          type="date"
          value={toDraft}
          min={fromDraft || undefined}
          onChange={(e) => setToDraft(e.target.value)}
          className="h-9 border border-stone-400 bg-white px-2 text-xs text-stone-900"
          aria-label="Fin de la période personnalisée"
        />
        <button
          type="button"
          onClick={applyCustom}
          disabled={!fromDraft || !toDraft}
          className={cn(
            "rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
            range.key === "custom"
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white text-stone-700 hover:border-stone-500",
          )}
        >
          Période personnalisée
        </button>
      </div>
    </div>
  )
}
