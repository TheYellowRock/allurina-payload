"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { ScarfCard } from "@/components/storefront/scarf-card"
import { Button } from "@/components/ui/button"
import { resolveStorefrontAvailability } from "@/lib/availability"
import type { StorefrontScarf } from "@/lib/storefront-scarf-types"
import { cn } from "@/lib/utils"

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
  // The endpoint already filters to stockQuantity > 0; it doesn't expose the exact count,
  // so `1` here is just "known in stock", not a real quantity.
  const stockQuantity = 1
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
  }
}

async function fetchScarvesPage(page: number, signal: AbortSignal): Promise<ScarvesPage> {
  const params = new URLSearchParams()
  params.set("limit", String(BATCH_SIZE))
  params.set("page", String(page))

  const res = await fetch(`/api/public/scarves?${params.toString()}`, { signal })
  if (!res.ok) throw new Error(`Failed to fetch scarves (${res.status})`)

  const data = (await res.json()) as PublicScarvesResponse
  const docs = Array.isArray(data.docs) ? data.docs : []

  return {
    scarves: docs.map(toStorefrontScarf),
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

    fetchScarvesPage(requestedPage, controller.signal)
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

  // First batch, fetched on mount. `loadNextPage` is stable (no deps), so this only ever
  // runs once in practice (StrictMode's double-invoke is caught by the ref guard above).
  useEffect(() => {
    loadNextPage()
  }, [loadNextPage])

  // Aborts whatever's in flight when the component unmounts.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

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
          {status === "loading"
            ? Array.from({ length: BATCH_SIZE }).map((_, i) => (
                <li key={`skeleton-${i}`} className="min-w-0">
                  <ScarfCardSkeleton />
                </li>
              ))
            : null}
        </ul>

        {status === "error" ? (
          <div className="mt-8 text-center">
            <p className="text-sm text-red-700">
              Impossible de charger plus de pièces pour le moment.
            </p>
            {retriesExhausted ? (
              <p className="mt-2 text-sm text-stone-500">
                Rechargez la page pour réessayer.
              </p>
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

        {status === "idle" || status === "loading" ? (
          <div className="mt-8 text-center">
            <Button
              type="button"
              variant="outline"
              disabled={status === "loading"}
              onClick={loadNextPage}
              className="rounded-none border-stone-400 font-light"
            >
              {status === "loading" ? "Chargement…" : "Charger plus"}
            </Button>
          </div>
        ) : status === "done" ? (
          <p className="mt-8 text-center text-sm text-stone-500">Vous avez tout vu</p>
        ) : null}
      </div>
    </section>
  )
}
