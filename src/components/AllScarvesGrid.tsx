"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
  PRODUCT_GRID_CLASS,
  ProductCardSkeleton,
  productCellClass,
  productLayoutAt,
} from "@/components/storefront/product-grid"
import { ScarfCard } from "@/components/storefront/scarf-card"
import { Button } from "@/components/ui/button"
import { resolveStorefrontAvailability } from "@/lib/availability"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"

const BATCH_SIZE = 12
const MAX_RETRIES = 3
/** Fires the observer callback while the sentinel is still ~400px below the viewport. */
const SENTINEL_ROOT_MARGIN = "0px 0px 400px 0px"

type Status = "idle" | "loading" | "error" | "done"

/** Must match the response shape of `src/app/api/public/scarves/route.ts`. */
type PublicScarfDoc = {
  id: string | number
  slug: string
  title: string
  price: number
  image: { url: string; width: number; height: number; alt: string } | null
  hasVariants?: boolean
  stockQuantity?: number
}

type PublicScarvesResponse = {
  docs?: PublicScarfDoc[]
  hasNextPage?: boolean
}

type ScarvesPage = {
  scarves: StorefrontScarf[]
  hasNextPage: boolean
}

function toStorefrontScarf(doc: PublicScarfDoc): StorefrontScarf {
  // The endpoint only returns products in stock; older responses had no count → "1".
  const stockQuantity = typeof doc.stockQuantity === "number" && doc.stockQuantity > 0 ? doc.stockQuantity : 1
  return {
    id: doc.id,
    title: doc.title,
    slug: doc.slug,
    price: doc.price,
    stockQuantity,
    featuredImage: doc.image ? { ...doc.image } : null,
    galleryImages: [],
    categories: null,
    collections: null,
    tags: null,
    availabilityTags: [],
    availability: resolveStorefrontAvailability({ stockQuantity, availabilityTags: [] }),
    hasVariants: doc.hasVariants === true,
  }
}

type GridFilter = { productType?: string; excludeIds?: string[]; params?: Record<string, string> }

async function fetchScarvesPage(page: number, signal: AbortSignal, filter: GridFilter): Promise<ScarvesPage> {
  const params = new URLSearchParams()
  params.set("limit", String(BATCH_SIZE))
  params.set("page", String(page))
  if (filter.productType) params.set("type", filter.productType)
  if (filter.excludeIds?.length) params.set("exclude", filter.excludeIds.join(","))
  for (const [k, v] of Object.entries(filter.params ?? {})) params.set(k, v)

  const res = await fetch(`/api/public/scarves?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`Failed to fetch scarves (${res.status})`)

  const data = (await res.json()) as PublicScarvesResponse
  const docs = Array.isArray(data.docs) ? data.docs : []

  return {
    scarves: docs.map(toStorefrontScarf),
    hasNextPage: Boolean(data.hasNextPage),
  }
}

/**
 * Infinite-scroll product grid fed by `/api/public/scarves`. The filter is read once:
 * to change it, remount with a new `key` (the filter bar does that per chip).
 */
export function AllScarvesGrid({
  className,
  productType,
  excludeIds,
  filterParams,
}: {
  className?: string
  /** Only products of this type (slug, e.g. "chales"). */
  productType?: string
  /** Products already shown higher on the page. */
  excludeIds?: string[]
  /** Extra API params, e.g. a filter chip (`tags`, `categories`). */
  filterParams?: Record<string, string>
}) {
  // Read once: the infinite loader below must keep the same filter for its whole life.
  const filterRef = useRef<GridFilter>({ productType, excludeIds, params: filterParams })
  const [scarves, setScarves] = useState<StorefrontScarf[]>([])
  const [status, setStatus] = useState<Status>("idle")
  const [retryCount, setRetryCount] = useState(0)

  // Refs, not just state: the IntersectionObserver callback and the mount effect both need
  // to check/set the current status synchronously, before any React state update lands, or
  // a fast double-fire (StrictMode remount, IO firing twice in a row, the effect re-running
  // before cleanup disconnects the old observer) launches two overlapping requests — which
  // is exactly how the previous version ended up retrying ~5x/second forever on a 403.
  const statusRef = useRef<Status>("idle")
  const pageRef = useRef(0)
  const retryCountRef = useRef(0)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const sentinelRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadNextPage = useCallback(() => {
    if (statusRef.current !== "idle") return
    statusRef.current = "loading"
    setStatus("loading")

    const controller = new AbortController()
    abortControllerRef.current = controller
    const requestedPage = pageRef.current + 1

    fetchScarvesPage(requestedPage, controller.signal, filterRef.current)
      .then((result) => {
        const fresh = result.scarves.filter((s) => !seenIdsRef.current.has(String(s.id)))
        for (const s of fresh) seenIdsRef.current.add(String(s.id))
        setScarves((prev) => [...prev, ...fresh])
        pageRef.current = requestedPage

        const next: Status = result.hasNextPage ? "idle" : "done"
        statusRef.current = next
        setStatus(next)
      })
      .catch(() => {
        // An aborted request (unmount) isn't a real failure — no state to update, the
        // component is gone or about to be.
        if (controller.signal.aborted) return
        statusRef.current = "error"
        setStatus("error")
      })
  }, [])

  // First batch on mount; abort whatever is in flight on unmount. Resetting "loading" back
  // to "idle" in the cleanup matters: StrictMode (and a filter-chip remount racing a
  // request) unmounts and remounts — without the reset the second mount would see
  // "loading", skip its fetch, and leave the grid on skeletons forever.
  useEffect(() => {
    loadNextPage()
    return () => {
      abortControllerRef.current?.abort()
      if (statusRef.current === "loading") statusRef.current = "idle"
    }
  }, [loadNextPage])

  // Only watches for scroll while genuinely idle: this effect's own condition (not just
  // its cleanup) keeps the observer disconnected while loading, and permanently once
  // status is "error" or "done" — reconnecting only happens by status flipping back to
  // "idle", i.e. via the manual retry button, never automatically.
  useEffect(() => {
    if (status !== "idle") return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage()
        }
      },
      { rootMargin: SENTINEL_ROOT_MARGIN },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [status, loadNextPage])

  const handleRetry = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRIES) return
    retryCountRef.current += 1
    setRetryCount(retryCountRef.current)
    statusRef.current = "idle"
    setStatus("idle")
  }, [])

  const retriesExhausted = status === "error" && retryCount >= MAX_RETRIES

  return (
    <div className={className}>
      <ul className={PRODUCT_GRID_CLASS}>
        {scarves.map((scarf, i) => (
          <li key={String(scarf.id)} className={productCellClass(i)}>
            {/* cardIndex keeps counting across batches: only the first cards get priority. */}
            <ScarfCard scarf={scarf} cardIndex={i} layout={productLayoutAt(i)} />
          </li>
        ))}
        {status === "loading"
          ? Array.from({ length: BATCH_SIZE }).map((_, k) => {
              const i = scarves.length + k
              return (
                <li key={`skeleton-${k}`} className={productCellClass(i)}>
                  <ProductCardSkeleton layout={productLayoutAt(i)} />
                </li>
              )
            })
          : null}
      </ul>

      {status === "error" ? (
        <div className="mt-10 text-center">
          <p className="text-sm text-red-700">Impossible de charger plus de pièces pour le moment.</p>
          {retriesExhausted ? (
            <p className="mt-2 text-sm text-stone-500">Rechargez la page pour réessayer.</p>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={handleRetry}
              className="mt-4 rounded-none border-stone-400 font-light"
            >
              Réessayer
            </Button>
          )}
        </div>
      ) : null}

      {/* Sentinel: IntersectionObserver triggers the next batch ~400px before this is reached. */}
      <div ref={sentinelRef} aria-hidden className="h-px" />

      {status === "idle" ? (
        <div className="mt-10 text-center">
          <Button
            type="button"
            variant="outline"
            onClick={loadNextPage}
            className="h-11 rounded-none border-stone-900 px-8 text-[11px] font-normal tracking-[0.2em] uppercase"
          >
            Voir plus
          </Button>
        </div>
      ) : status === "done" && scarves.length > 0 ? (
        <p className="mt-12 text-center text-[11px] tracking-[0.2em] text-stone-400 uppercase">
          {scarves.length} pièce{scarves.length > 1 ? "s" : ""}
        </p>
      ) : status === "done" ? (
        <p className="py-16 text-center text-sm text-stone-500">Aucune pièce dans cette sélection pour le moment.</p>
      ) : null}
    </div>
  )
}
