"use client"

import { useEffect, useRef, useState, type RefObject } from "react"

import { ALL_FILTER_KEY, type FilterChip } from "@/lib/catalog/filter-chips"
import { cn } from "@/lib/utils"

/** Height of the sticky site header, kept up to date (it changes between phone and desktop). */
function useHeaderHeight(): number {
  const [height, setHeight] = useState(0)
  useEffect(() => {
    const header = document.querySelector("header")
    if (!header) return
    const update = () => setHeight(Math.round(header.getBoundingClientRect().height))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(header)
    return () => ro.disconnect()
  }, [])
  return height
}

/** Writes `?filtre=` without a navigation, so a shared link opens on the same selection. */
function syncUrl(key: string) {
  try {
    const url = new URL(window.location.href)
    if (key === ALL_FILTER_KEY) url.searchParams.delete("filtre")
    else url.searchParams.set("filtre", key)
    window.history.replaceState(window.history.state, "", url)
  } catch {
    // URL sync is a nicety; filtering works without it.
  }
}

export function useChipSelection(chips: FilterChip[], initialKey: string | undefined) {
  const valid = chips.some((c) => c.key === initialKey) ? initialKey! : ALL_FILTER_KEY
  const [activeKey, setActiveKey] = useState(valid)
  const activeChip = chips.find((c) => c.key === activeKey) ?? null
  return { activeKey, activeChip, setActiveKey }
}

/**
 * Sticky filter row (Tous · Unis · À motifs · Lin · Crêpe…), pinned under the site header
 * while the grid scrolls. Horizontal swipe on phones. Picking a chip brings the top of
 * the grid back under the bar so results start from the first product.
 */
export function CatalogFilterBar({
  chips,
  activeKey,
  onSelect,
  totalCount,
  scrollAnchorRef,
  className,
}: {
  chips: FilterChip[]
  activeKey: string
  onSelect: (key: string) => void
  /** Shown on "Tous" when known. */
  totalCount?: number
  /** Element scrolled back into view when the selection changes. */
  scrollAnchorRef?: RefObject<HTMLElement | null>
  className?: string
}) {
  const headerHeight = useHeaderHeight()
  const barRef = useRef<HTMLDivElement>(null)

  if (chips.length === 0) return null

  const all: Pick<FilterChip, "key" | "label"> & { count?: number } = {
    key: ALL_FILTER_KEY,
    label: "Tous",
    count: totalCount,
  }
  const items = [all, ...chips]

  const select = (key: string, button: HTMLButtonElement) => {
    if (key !== activeKey) {
      onSelect(key)
      syncUrl(key)
    }
    button.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    const anchor = scrollAnchorRef?.current
    const bar = barRef.current
    if (anchor && bar) {
      const anchorTop = anchor.getBoundingClientRect().top
      const barBottom = headerHeight + bar.offsetHeight
      // Only when the grid has already scrolled under the bar.
      if (anchorTop < barBottom) {
        window.scrollTo({ top: window.scrollY + anchorTop - barBottom - 8, behavior: "smooth" })
      }
    }
  }

  return (
    <div
      ref={barRef}
      style={{ top: headerHeight }}
      className={cn("sticky z-30 border-b border-stone-200/70 bg-[#faf9f7]/95 backdrop-blur-md", className)}
    >
      <div
        role="tablist"
        aria-label="Filtrer"
        className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:gap-2 sm:px-5 md:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((chip) => {
          const active = chip.key === activeKey
          return (
            <button
              key={chip.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={(e) => select(chip.key, e.currentTarget)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1 rounded-full border px-3.5 text-[11px] tracking-[0.12em] whitespace-nowrap uppercase transition-colors",
                active
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-900 hover:text-stone-900",
              )}
            >
              {chip.label}
              {typeof chip.count === "number" ? (
                <sup className={cn("text-[9px] tracking-normal", active ? "text-white/70" : "text-stone-400")}>
                  {chip.count}
                </sup>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
