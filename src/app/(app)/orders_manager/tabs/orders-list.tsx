"use client"

import { AlertTriangle, ChevronDown, ChevronRight, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { ESTIMATED_UNIT_COST } from "@/lib/orders-manager/cost-config"
import { formatDh, formatPercent, formatRelativeTime } from "@/lib/orders-manager/format"
import { estimateOrderMargin } from "@/lib/orders-manager/margin"
import {
  isUnusualTransition,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  URGENT_PENDING_HOURS,
  type OrderStatus,
} from "@/lib/orders-manager/order-status"
import type { OrdersManagerOrder } from "@/lib/orders-manager/serialize-order"
import { ORDERS_TAB_PAGE_SIZE } from "@/lib/orders-manager/tabs"
import { productPath } from "@/lib/routes"
import { cn } from "@/lib/utils"

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-950 ring-amber-900/15"
    case "confirmed":
      return "bg-sky-100 text-sky-950 ring-sky-900/15"
    case "packing":
      return "bg-violet-100 text-violet-950 ring-violet-900/15"
    case "shipped":
      return "bg-emerald-100 text-emerald-950 ring-emerald-900/15"
    case "delivered":
      return "bg-stone-200 text-stone-900 ring-stone-900/10"
    case "cancelled":
      return "bg-red-100 text-red-950 ring-red-900/15"
    default:
      return "bg-stone-100 text-stone-800 ring-stone-900/10"
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d)
  } catch {
    return iso
  }
}

/** Debounces the search box so it doesn't push a URL/refetch on every keystroke. */
function useDebouncedCallback<Args extends unknown[]>(fn: (...args: Args) => void, delayMs: number) {
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  return useCallback(
    (...args: Args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => fnRef.current(...args), delayMs)
    },
    [delayMs],
  )
}

function OrderStatusControls({
  order,
  savingId,
  onApply,
}: {
  order: OrdersManagerOrder
  savingId: string | null
  onApply: (orderId: string, status: OrderStatus) => void
}) {
  // No effect syncing `draft` to `order.status`: the parent remounts this component with
  // a fresh `key={order.status}` whenever the order's status actually changes (see
  // `OrderCard` below), so the `useState` initializer below is always correct on mount.
  const [draft, setDraft] = useState<OrderStatus>(order.status)
  const [confirmArmed, setConfirmArmed] = useState(false)

  const dirty = draft !== order.status
  const busy = savingId === order.id
  const unusual = dirty && isUnusualTransition(order.status, draft)

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor={`status-${order.id}`}>
          Statut de la commande
        </label>
        <select
          id={`status-${order.id}`}
          className="h-10 min-w-[12rem] border border-stone-400 bg-white px-3 text-sm font-medium text-stone-900"
          value={draft}
          disabled={busy}
          onChange={(e) => {
            const v = e.target.value
            if (ORDER_STATUSES.includes(v as OrderStatus)) {
              setDraft(v as OrderStatus)
              setConfirmArmed(false)
            }
          }}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          disabled={!dirty || busy}
          className={cn(
            "inline-flex items-center rounded-none border-stone-800 bg-stone-900 text-white hover:bg-stone-800",
            unusual && confirmArmed && "border-red-800 bg-red-900 hover:bg-red-800",
          )}
          onClick={() => {
            if (unusual && !confirmArmed) {
              setConfirmArmed(true)
              return
            }
            onApply(order.id, draft)
          }}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Enregistrement…
            </>
          ) : unusual && confirmArmed ? (
            "Confirmer ce changement inhabituel"
          ) : (
            "Mettre à jour le statut"
          )}
        </Button>
      </div>
      {unusual ? (
        <p className="flex items-start gap-1.5 text-xs text-red-800">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {confirmArmed
            ? "Cliquez à nouveau pour confirmer ce changement inhabituel."
            : `Passage de « ${ORDER_STATUS_LABELS[order.status]} » à « ${ORDER_STATUS_LABELS[draft]} » inhabituel — vérifiez avant de confirmer.`}
        </p>
      ) : null}
    </div>
  )
}

function OrderCard({
  order,
  open,
  onToggle,
  savingId,
  onApplyStatus,
}: {
  order: OrdersManagerOrder
  open: boolean
  onToggle: () => void
  savingId: string | null
  onApplyStatus: (orderId: string, status: OrderStatus) => void
}) {
  const qty = order.items.reduce((sum, line) => sum + line.quantity, 0)
  const marginEstimate = estimateOrderMargin(order, ESTIMATED_UNIT_COST)

  return (
    <li>
      <div
        className={cn(
          "overflow-hidden border border-stone-300/90 bg-white shadow-sm",
          open && "ring-1 ring-stone-400/40",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-stone-50 md:gap-4 md:px-5 md:py-5"
        >
          <span className="mt-0.5 shrink-0 text-stone-500">
            {open ? <ChevronDown className="size-5" aria-hidden /> : <ChevronRight className="size-5" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 gap-y-1">
              <span className="font-mono text-sm font-semibold text-stone-900">{order.orderReference}</span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ring-1",
                  statusBadgeClass(order.status),
                )}
              >
                {ORDER_STATUS_LABELS[order.status]}
              </span>
              <span className="text-[11px] text-stone-500">{formatRelativeTime(order.updatedAt)}</span>
            </div>
            <p className="mt-1 truncate text-sm text-stone-700">{order.customerName}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
              <span>
                {qty} article{qty > 1 ? "s" : ""}
              </span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
          </div>
          <div className="shrink-0 text-right text-lg font-semibold tabular-nums text-stone-900">
            {formatDh(order.grandTotal)}
          </div>
        </button>

        {open ? (
          <div className="border-t border-stone-200 bg-stone-50/80 px-4 py-5 md:px-5">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
                  Client & livraison
                </h3>
                <dl className="mt-3 space-y-2 text-sm text-stone-800">
                  <div>
                    <dt className="text-xs text-stone-500">Nom</dt>
                    <dd>{order.customerName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">E-mail</dt>
                    <dd>
                      <a href={`mailto:${order.email}`} className="underline decoration-stone-400 underline-offset-2">
                        {order.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">Téléphone</dt>
                    <dd>
                      <a
                        href={`tel:${order.phone.replace(/\s/g, "")}`}
                        className="underline decoration-stone-400 underline-offset-2"
                      >
                        {order.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-stone-500">Adresse</dt>
                    <dd className="text-pretty">
                      {order.addressLine1}
                      {order.addressLine2 ? (
                        <>
                          <br />
                          {order.addressLine2}
                        </>
                      ) : null}
                      <br />
                      {[order.postalCode, order.city].filter(Boolean).join(" ")}
                      <br />
                      {order.country}
                    </dd>
                  </div>
                  {order.notes ? (
                    <div>
                      <dt className="text-xs text-stone-500">Notes</dt>
                      <dd className="text-pretty text-stone-700">{order.notes}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div>
                <h3 className="text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">Statut</h3>
                <OrderStatusControls key={order.status} order={order} savingId={savingId} onApply={onApplyStatus} />

                <h3 className="mt-8 text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">Totaux</h3>
                <ul className="mt-3 space-y-1 text-sm text-stone-700">
                  <li className="flex justify-between gap-4">
                    <span>Sous-total articles</span>
                    <span>{formatDh(order.subtotal)}</span>
                  </li>
                  {order.volumeDiscount > 0 ? (
                    <li className="flex justify-between gap-4 text-emerald-800">
                      <span>Réduction lot</span>
                      <span>−{formatDh(order.volumeDiscount)}</span>
                    </li>
                  ) : null}
                  <li className="flex justify-between gap-4">
                    <span>Livraison</span>
                    <span>{order.deliveryFee <= 0 ? "Offerte" : formatDh(order.deliveryFee)}</span>
                  </li>
                  <li className="flex justify-between gap-4 border-t border-stone-200 pt-2 font-semibold text-stone-900">
                    <span>Total</span>
                    <span>{formatDh(order.grandTotal)}</span>
                  </li>
                  <li className="text-xs text-stone-500">
                    Paiement : {order.paymentMethod === "cod" ? "à la livraison" : order.paymentMethod}
                  </li>
                </ul>

                {marginEstimate ? (
                  <>
                    <h3 className="mt-8 flex items-center text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
                      Marge estimée
                      <span
                        className="ml-1.5 cursor-help normal-case tracking-normal text-stone-400"
                        title="Basée sur un coût unitaire manuel (ESTIMATED_UNIT_COST), pas un COGS enregistré."
                      >
                        ⓘ
                      </span>
                    </h3>
                    <ul className="mt-3 space-y-1 text-sm text-stone-700">
                      <li className="flex justify-between gap-4">
                        <span>Coût estimé</span>
                        <span>{formatDh(marginEstimate.estimatedCost)}</span>
                      </li>
                      <li className="flex justify-between gap-4 font-semibold text-stone-900">
                        <span>Marge estimée</span>
                        <span>
                          {formatDh(marginEstimate.estimatedMargin)}
                          {marginEstimate.marginPct !== null ? ` (${formatPercent(marginEstimate.marginPct)})` : ""}
                        </span>
                      </li>
                    </ul>
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
                Articles à préparer
              </h3>
              <ul className="mt-3 divide-y divide-stone-200 border border-stone-200 bg-white">
                {order.items.map((line) => (
                  <li key={`${order.id}-${line.productId}`} className="flex gap-3 px-3 py-3 md:gap-4 md:px-4">
                    <div className="relative size-16 shrink-0 overflow-hidden bg-stone-100 md:size-20">
                      {line.imageSrc ? (
                        <Image
                          src={line.imageSrc}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="80px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-stone-400">—</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-stone-900">{line.title}</p>
                      <p className="mt-1 text-xs text-stone-500">
                        Qté {line.quantity} · {formatDh(line.price)} / u.
                      </p>
                      <Link
                        href={productPath(line.slug)}
                        className="mt-1 inline-block text-xs font-medium text-stone-700 underline underline-offset-2"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Fiche produit
                      </Link>
                    </div>
                    <div className="shrink-0 text-right text-sm font-semibold text-stone-900">
                      {formatDh(line.price * line.quantity)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </li>
  )
}

export function OrdersList({
  urgentOrders,
  orders,
  page,
  hasNextPage,
  hasPrevPage,
  totalDocs,
  q: initialQ,
  status: initialStatus,
}: {
  urgentOrders: OrdersManagerOrder[]
  orders: OrdersManagerOrder[]
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
  totalDocs: number
  q: string
  status: OrderStatus | "all"
}) {
  const router = useRouter()
  const pathname = usePathname()

  // No effects syncing these to props: the server parent (`orders-tab.tsx`) renders this
  // component with `key={q|status|page}`, so React fully remounts it — and re-runs these
  // initializers — whenever the query actually changes, instead of an update in place.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [urgent, setUrgent] = useState(urgentOrders)
  const [rest, setRest] = useState(orders)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchDraft, setSearchDraft] = useState(initialQ)

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const pushParams = useCallback(
    (next: { q?: string; status?: string; page?: number }) => {
      const params = new URLSearchParams()
      params.set("tab", "orders")
      const q = next.q ?? initialQ
      const status = next.status ?? initialStatus
      const p = next.page ?? 1
      if (q) params.set("q", q)
      if (status && status !== "all") params.set("status", status)
      if (p > 1) params.set("page", String(p))
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, initialQ, initialStatus],
  )

  const debouncedSearch = useDebouncedCallback((value: string) => {
    pushParams({ q: value, status: initialStatus, page: 1 })
  }, 400)

  const totalPages = Math.max(1, Math.ceil(totalDocs / ORDERS_TAB_PAGE_SIZE))

  const updateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setError(null)
    setSavingId(orderId)
    try {
      const res = await fetch(`/api/orders-manager/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      })
      const data = (await res.json()) as { error?: string; status?: OrderStatus }
      if (!res.ok) {
        setError(data.error ?? "Échec de la mise à jour.")
        return
      }
      if (data.status) {
        setUrgent((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: data.status! } : o)))
        setRest((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: data.status! } : o)))
      }
      router.refresh()
    } catch {
      setError("Réseau indisponible.")
    } finally {
      setSavingId(null)
    }
  }, [router])

  const isDefaultView = initialQ === "" && initialStatus === "all"

  return (
    <section className="space-y-6">
      {error ? (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => {
            setSearchDraft(e.target.value)
            debouncedSearch(e.target.value)
          }}
          placeholder="Rechercher : nom, téléphone, ville, e-mail, référence…"
          className="h-10 w-full max-w-sm border border-stone-400 bg-white px-3 text-sm text-stone-900 placeholder:text-stone-400 sm:w-80"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => pushParams({ status: "all", q: initialQ, page: 1 })}
          className={cn(
            "rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors",
            initialStatus === "all"
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-white text-stone-700 hover:border-stone-500",
          )}
        >
          Tous les statuts
        </button>
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => pushParams({ status: s, q: initialQ, page: 1 })}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors",
              initialStatus === s
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:border-stone-500",
            )}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {isDefaultView && urgent.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 border-b border-red-200 pb-2">
            <AlertTriangle className="size-4 text-red-700" aria-hidden />
            <h2 className="text-sm font-semibold text-red-900">
              À traiter · en attente depuis plus de {URGENT_PENDING_HOURS} h
            </h2>
            <span className="text-xs text-red-700">({urgent.length})</span>
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {urgent.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                open={expanded.has(order.id)}
                onToggle={() => toggle(order.id)}
                savingId={savingId}
                onApplyStatus={updateStatus}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        {isDefaultView && urgent.length > 0 ? (
          <h2 className="border-b border-stone-200 pb-2 text-sm font-semibold text-stone-900">
            Toutes les commandes
          </h2>
        ) : null}
        {rest.length === 0 ? (
          <p className="py-12 text-center text-sm text-stone-500">Aucune commande pour ce filtre.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {rest.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                open={expanded.has(order.id)}
                onToggle={() => toggle(order.id)}
                savingId={savingId}
                onApplyStatus={updateStatus}
              />
            ))}
          </ul>
        )}
      </div>

      {totalDocs > ORDERS_TAB_PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-4 border-t border-stone-200 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasPrevPage}
            onClick={() => pushParams({ q: initialQ, status: initialStatus, page: page - 1 })}
            className="rounded-none border-stone-400 font-light"
          >
            Précédent
          </Button>
          <span className="text-xs text-stone-500">
            Page {page} sur {totalPages} · {totalDocs} commande{totalDocs > 1 ? "s" : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => pushParams({ q: initialQ, status: initialStatus, page: page + 1 })}
            className="rounded-none border-stone-400 font-light"
          >
            Suivant
          </Button>
        </div>
      ) : null}
    </section>
  )
}
