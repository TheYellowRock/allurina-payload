"use client"

import { Plus } from "lucide-react"
import { useState } from "react"

import { variantKey, type EditorColor, type EditorSize } from "@/lib/catalog/editor-types"
import { cn } from "@/lib/utils"

import { cardClass, cardTitleClass, Chips, inputClass, labelClass, toggleId } from "./ui"

/**
 * Sizes × colours for products with variants: pick sizes and colours as chips, then type
 * the stock of each combination in the grid (rows = sizes, columns = colours).
 */
export function VariantSection({
  sizes,
  colors,
  sizeIds,
  colorIds,
  stock,
  onSizeIds,
  onColorIds,
  onStock,
  onColorCreated,
}: {
  /** Sizes offered for the chosen product type, smallest first. */
  sizes: EditorSize[]
  colors: EditorColor[]
  sizeIds: number[]
  colorIds: number[]
  stock: Record<string, string>
  onSizeIds: (ids: number[]) => void
  onColorIds: (ids: number[]) => void
  onStock: (stock: Record<string, string>) => void
  onColorCreated: (color: EditorColor) => void
}) {
  const [fillAll, setFillAll] = useState("")
  const [newColorOpen, setNewColorOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newHex, setNewHex] = useState("#1f1f1f")
  const [colorError, setColorError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  // Keep rows in size order and columns in the order colours were picked.
  const rows = sizes.filter((s) => sizeIds.includes(s.id))
  const cols = colorIds.map((id) => colors.find((c) => c.id === id)).filter((c): c is EditorColor => Boolean(c))
  const total = rows.reduce(
    (sum, s) => sum + cols.reduce((acc, c) => acc + (Number(stock[variantKey(s.id, c.id)]) || 0), 0),
    0,
  )

  const setCell = (sizeId: number, colorId: number, value: string) =>
    onStock({ ...stock, [variantKey(sizeId, colorId)]: value.replace(/[^\d]/g, "") })

  const applyAll = () => {
    if (fillAll === "") return
    const next = { ...stock }
    for (const s of rows) for (const c of cols) next[variantKey(s.id, c.id)] = fillAll
    onStock(next)
  }

  const createColor = async () => {
    setColorError(null)
    setCreating(true)
    try {
      const res = await fetch("/api/studio/colors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName, hex: newHex }),
      })
      const data = (await res.json().catch(() => ({}))) as Partial<EditorColor> & { error?: string }
      if (!res.ok || typeof data.id !== "number") {
        setColorError(data.error ?? "Création impossible.")
        return
      }
      onColorCreated({ id: data.id, label: String(data.label), hex: String(data.hex) })
      setNewName("")
      setNewColorOpen(false)
    } catch {
      setColorError("Réseau indisponible.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className={cn(cardClass, "space-y-5")}>
      <h2 className={cardTitleClass}>Tailles & couleurs</h2>

      <div>
        <span className={labelClass}>Tailles</span>
        <div className="mt-2">
          <Chips
            options={sizes}
            selected={sizeIds}
            onToggle={(id) => onSizeIds(toggleId(sizeIds, id))}
            empty="Aucune taille pour ce type — ajoutez-en dans Payload (Tailles)."
          />
        </div>
      </div>

      <div>
        <span className={labelClass}>Couleurs</span>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Chips
            options={colors.map((c) => ({ id: c.id, label: c.label, hex: c.hex }))}
            selected={colorIds}
            onToggle={(id) => onColorIds(toggleId(colorIds, id))}
            empty=""
          />
          <button
            type="button"
            onClick={() => setNewColorOpen((o) => !o)}
            className="inline-flex min-h-9 items-center gap-1 border border-dashed border-stone-400 px-3 text-sm text-stone-700"
          >
            <Plus className="size-4" aria-hidden /> Couleur
          </button>
        </div>
        {newColorOpen ? (
          <div className="mt-3 flex flex-wrap items-end gap-2 border border-stone-200 bg-stone-50 p-3">
            <label className="min-w-40 flex-1">
              <span className={labelClass}>Nom</span>
              <input
                className={cn(inputClass, "mt-1")}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex. Beige sable"
              />
            </label>
            <label>
              <span className={labelClass}>Teinte</span>
              <input
                type="color"
                value={newHex}
                onChange={(e) => setNewHex(e.target.value)}
                className="mt-1 block h-11 w-14 cursor-pointer border border-stone-300 bg-white p-1"
              />
            </label>
            <button
              type="button"
              onClick={() => void createColor()}
              disabled={creating || newName.trim().length < 2}
              className="min-h-11 bg-stone-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              Créer la couleur
            </button>
            {colorError ? <p className="w-full text-xs text-red-700">{colorError}</p> : null}
          </div>
        ) : null}
      </div>

      {rows.length > 0 && cols.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <label>
              <span className={labelClass}>Tout mettre à</span>
              <input
                className={cn(inputClass, "mt-1 w-24 text-center")}
                value={fillAll}
                onChange={(e) => setFillAll(e.target.value.replace(/[^\d]/g, ""))}
                inputMode="numeric"
                placeholder="0"
              />
            </label>
            <button
              type="button"
              onClick={applyAll}
              className="min-h-11 border border-stone-400 bg-white px-4 text-sm font-medium"
            >
              Appliquer
            </button>
            <p className="ml-auto text-sm text-stone-600">
              Stock total : <span className="font-semibold text-stone-900">{total}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-16 p-1 text-left text-xs font-medium text-stone-500">Taille</th>
                  {cols.map((c) => (
                    <th key={c.id} className="p-1 text-xs font-medium text-stone-700">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="size-3.5 rounded-full border border-black/15"
                          style={{ backgroundColor: c.hex }}
                          aria-hidden
                        />
                        {c.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <th className="p-1 text-left text-sm font-medium text-stone-800">{s.label}</th>
                    {cols.map((c) => (
                      <td key={c.id} className="p-1">
                        <input
                          className={cn(inputClass, "min-w-16 px-2 text-center")}
                          value={stock[variantKey(s.id, c.id)] ?? ""}
                          onChange={(e) => setCell(s.id, c.id, e.target.value)}
                          inputMode="numeric"
                          placeholder="0"
                          aria-label={`Stock ${s.label} ${c.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-stone-500">
            Case vide = 0 (la taille s’affiche « épuisée » dans cette couleur).
          </p>
        </div>
      ) : (
        <p className="text-xs text-stone-500">Choisissez au moins une taille et une couleur pour remplir le stock.</p>
      )}
    </section>
  )
}
