import type { EditorOption } from "@/lib/catalog/editor-types"
import { cn } from "@/lib/utils"

/** Shared look of the Studio product editor (mobile-first: 16px inputs avoid iOS zoom). */
export const inputClass =
  "w-full rounded-none border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 outline-none focus:border-stone-900 sm:text-sm"
export const labelClass = "block text-xs font-medium text-stone-600"
export const cardClass = "border border-stone-200 bg-white p-4 sm:p-5"
export const cardTitleClass = "text-[11px] font-semibold tracking-[0.16em] text-stone-500 uppercase"

export function toggleId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
}

export function Chips({
  options,
  selected,
  onToggle,
  empty,
}: {
  options: (EditorOption & { hex?: string })[]
  selected: number[]
  onToggle: (id: number) => void
  empty: string
}) {
  if (options.length === 0) return <p className="text-xs text-stone-400">{empty}</p>
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            aria-pressed={on}
            className={cn(
              "inline-flex min-h-9 items-center gap-2 border px-3 py-1.5 text-sm transition-colors",
              on ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500",
            )}
          >
            {o.hex ? (
              <span className="size-4 rounded-full border border-black/15" style={{ backgroundColor: o.hex }} aria-hidden />
            ) : null}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
