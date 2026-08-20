"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { ScarfCard } from "@/components/storefront/scarf-card"
import { Button } from "@/components/ui/button"
import { mapDocToStorefrontScarf } from "@/lib/mapStorefrontScarf"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"
import { cn } from "@/lib/utils"

const BATCH_SIZE = 12
/** Fires the observer callback while the sentinel is still ~400px below the viewport. */
const SENTINEL_ROOT_MARGIN = "0px 0px 400px 0px"

type ScarvesPage = {
  scarves: StorefrontScarf[]
  hasNextPage: boolean
}

/**
 * Hits Payload's existing auto-generated REST endpoint for the `scarves` collection
 * directly (`/api/scarves`) — no new route, no new Payload query, no new DB access path.
 * `where[stockQuantity][greater_than]=0` mirrors the out-of-stock filter already applied
 * to every other storefront listing (`getScarvesStorefront.ts`); omitting it here would
 * reintroduce out-of-stock products into this one surface.
 */
async function fetchScarvesPage(page: number): Promise<ScarvesPage> {
  const params = new URLSearchParams()
  params.set("limit", String(BATCH_SIZE))
  params.set("page", String(page))
  params.set("depth", "1")
  params.set("sort", "-updatedAt")
  params.set("where[stockQuantity][greater_than]", "0")

  const res = await fetch(`/api/scarves?${params.toString()}`)
  if (!res.ok) throw new Error(`Failed to fetch scarves (${res.status})`)

  const data = (await res.json()) as { docs?: unknown[]; hasNextPage?: boolean }
  const docs = Array.isArray(data.docs) ? data.docs : []

  return {
    scarves: docs.map((doc) => mapDocToStorefrontScarf(doc as Record<string, unknown>)),
    hasNextPage: Boolean(data.hasNextPage),
  }
}

/** Same box dimensions as `ScarfCard`'s image + text stack, so a batch swapping in causes no shift. */
function ScarfCardSkeleton() {
  return (
    <div className="min-w-0 animate-pulse">
      <div className="aspect-4/5 w-full bg-stone-200 sm:aspect-3/4 lg:aspect-3/5" />
      <div className="mt-2.5 space-y-2">
        <div className="h-3.5 w-3/4 bg-stone-200" />
        <div className="h-3 w-1/3 bg-stone-200" />
        <div className="h-9 w-full bg-stone-100" />
      </div>
    </div>
  )
}

export function AllScarvesGrid({ className }: { className?: string }) {
  const [scarves, setScarves] = useState<StorefrontScarf[]>([])
  const [page, setPage] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // Ref, not just state: the IntersectionObserver callback and the mount effect both need
  // to check/set this synchronously, before any state update lands, or a fast double-fire
  // (StrictMode remount, IO firing twice in a row) launches two overlapping requests.
  const loadingRef = useRef(false)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadNextPage = useCallback(() => {
    if (loadingRef.current || !hasNextPage) return
    loadingRef.current = true
    setLoading(true)
    setError(false)

    const requestedPage = page + 1
    fetchScarvesPage(requestedPage)
      .then((result) => {
        const fresh = result.scarves.filter((s) => !seenIdsRef.current.has(String(s.id)))
        for (const s of fresh) seenIdsRef.current.add(String(s.id))
        setScarves((prev) => [...prev, ...fresh])
        setHasNextPage(result.hasNextPage)
        setPage(requestedPage)
      })
      .catch(() => {
        setError(true)
      })
      .finally(() => {
        loadingRef.current = false
        setLoading(false)
      })
  }, [page, hasNextPage])

  const loadNextPageRef = useRef(loadNextPage)
  useEffect(() => {
    loadNextPageRef.current = loadNextPage
  }, [loadNextPage])

  // First batch, fetched on mount.
  useEffect(() => {
    loadNextPageRef.current()
  }, [])

  // Subsequent batches, via the sentinel below the grid.
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPageRef.current()
        }
      },
      { rootMargin: SENTINEL_ROOT_MARGIN },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage])

  return (
    <section
      className={cn("border-b border-stone-200/80 bg-[#faf9f7] py-12 md:py-16", className)}
      aria-label="Toutes les pièces"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-6">
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
          Toutes les pièces
        </h2>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {scarves.map((scarf, i) => (
            <li key={String(scarf.id)} className="min-w-0">
              {/* cardIndex keeps counting across batches, so only the first row ever gets
                  `priority` — everything from index 4 on (including every later batch)
                  loads lazily, protecting LCP. */}
              <ScarfCard scarf={scarf} cardIndex={i} />
            </li>
          ))}
          {loading
            ? Array.from({ length: BATCH_SIZE }).map((_, i) => (
                <li key={`skeleton-${i}`} className="min-w-0">
                  <ScarfCardSkeleton />
                </li>
              ))
            : null}
        </ul>

        {error ? (
          <p className="mt-8 text-center text-sm text-red-700">
            Impossible de charger plus de pièces pour le moment.
          </p>
        ) : null}

        {/* Sentinel: IntersectionObserver triggers the next batch ~400px before this is reached. */}
        <div ref={sentinelRef} aria-hidden className="h-px" />

        <div className="mt-8 text-center">
          {hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={loadNextPage}
              className="rounded-none border-stone-400 font-light"
            >
              {loading ? "Chargement…" : "Charger plus"}
            </Button>
          ) : (
            <p className="text-sm text-stone-500">Vous avez tout vu</p>
          )}
        </div>
      </div>
    </section>
  )
}
