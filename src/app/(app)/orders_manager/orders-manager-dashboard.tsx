"use client"

import { ChevronDown, ChevronRight, Loader2, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  CRM_STATS_TIMEZONE,
  type ClientInsightRow,
  type CrmOverview,
} from "@/lib/orders-manager/crm-stats"
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/orders-manager/order-status"
import type { OrdersManagerOrder } from "@/lib/orders-manager/serialize-order"
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

function formatDh(n: number): string {
  return `${Math.round(n)} Dh`
}

function formatDhCompact(n: number): string {
  const r = Math.round(n)
  if (r >= 1_000_000) return `${(r / 1_000_000).toFixed(1).replace(/\.0$/, "")} M Dh`
  if (r >= 10_000) return `${Math.round(r / 1000)} k Dh`
  return `${r} Dh`
}

function PeriodBars({
  overview,
}: {
  overview: CrmOverview
}) {
  const cols = [
    { key: "today", label: "Aujourd’hui", s: overview.today },
    { key: "week", label: "7 jours", s: overview.week },
    { key: "month", label: "Mois en cours", s: overview.month },
  ] as const

  const metrics: Array<{
    label: string
    format: (v: number) => string
    pick: (x: (typeof cols)[number]["s"]) => number
  }> = [
    { label: "Commandes", format: (v) => String(v), pick: (x) => x.orderCount },
    { label: "Pièces vendues", format: (v) => String(Math.round(v)), pick: (x) => x.unitsSold },
    {
      label: "Chiffre (Dh)",
      format: formatDhCompact,
      pick: (x) => x.revenueDh,
    },
  ]

  return (
    <div className="space-y-6">
      {metrics.map((metric) => {
        const values = cols.map((c) => metric.pick(c.s))
        const max = Math.max(...values, 1)
        return (
          <div key={metric.label}>
            <p className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
              {metric.label}
            </p>
            <div className="mt-2 grid grid-cols-3 gap-3 md:gap-4">
              {cols.map((c, i) => {
                const v = values[i]
                const pct = max > 0 ? Math.round((v / max) * 100) : 0
                return (
                  <div key={c.key} className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-stone-600">{c.label}</p>
                    <div className="relative mt-2 h-16 overflow-hidden rounded-sm bg-stone-200/90 md:h-20">
                      <div
                        className="absolute bottom-0 left-0 w-full bg-stone-800 transition-all duration-300"
                        style={{ height: `${pct}%`, minHeight: v ? "6%" : "0%" }}
                        title={`${metric.label}: ${metric.format(v)}`}
                      />
                    </div>
                    <p className="mt-1.5 tabular-nums text-sm font-semibold text-stone-900">
                      {metric.format(v)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const STATUS_SEGMENT_CLASS: Record<OrderStatus, string> = {
  pending: "bg-amber-600",
  confirmed: "bg-sky-600",
  packing: "bg-violet-600",
  shipped: "bg-emerald-600",
  delivered: "bg-stone-600",
  cancelled: "bg-red-600",
}

function StatusStrip({
  counts,
}: {
  counts: Record<OrderStatus, number>
}) {
  const total = ORDER_STATUSES.reduce((sum, s) => sum + counts[s], 0)
  const safeTotal = total > 0 ? total : 1

  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
        Répartition des statuts · 30 derniers jours
      </p>
      <div className="mt-3 flex h-10 overflow-hidden rounded-sm bg-stone-200 ring-1 ring-stone-300/80">
        {ORDER_STATUSES.map((s) => {
          const n = counts[s]
          const flexGrow = total > 0 ? Math.max(n, 0) : 1
          const showLabel = total > 0 && n / safeTotal >= 0.08
          return (
            <div
              key={s}
              className={cn(
                "relative flex min-w-0 items-center justify-center border-r border-white/25 px-1 text-[10px] font-semibold text-white last:border-r-0",
                STATUS_SEGMENT_CLASS[s],
              )}
              style={{ flex: flexGrow }}
              title={`${ORDER_STATUS_LABELS[s]}: ${n}`}
            >
              {showLabel ? (
                <span className="truncate drop-shadow-sm">{ORDER_STATUS_LABELS[s]}</span>
              ) : null}
            </div>
          )
        })}
      </div>
      <ul className="mt-3 grid gap-2 text-xs text-stone-700 sm:grid-cols-2 md:grid-cols-3">
        {ORDER_STATUSES.map((s) => (
          <li key={s} className="flex justify-between gap-2 border-b border-stone-200/80 pb-1">
            <span className="text-stone-600">{ORDER_STATUS_LABELS[s]}</span>
            <span className="tabular-nums font-semibold">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
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
  const [draft, setDraft] = useState<OrderStatus>(order.status)

  useEffect(() => {
    setDraft(order.status)
  }, [order.status])

  const dirty = draft !== order.status
  const busy = savingId === order.id

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
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
        className="inline-flex items-center rounded-none border-stone-800 bg-stone-900 text-white hover:bg-stone-800"
        onClick={() => onApply(order.id, draft)}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            Enregistrement…
          </>
        ) : (
          "Mettre à jour le statut"
        )}
      </Button>
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d)
  } catch {
    return iso
  }
}

export function OrdersManagerDashboard({
  initialOrders,
  staffEmail,
  overview,
  statusLast30,
  clientInsights,
}: {
  initialOrders: OrdersManagerOrder[]
  staffEmail: string | undefined
  overview: CrmOverview
  statusLast30: Record<OrderStatus, number>
  clientInsights: ClientInsightRow[]
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [orders, setOrders] = useState(initialOrders)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all")

  useEffect(() => {
    setOrders(initialOrders)
  }, [initialOrders])

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const itemCount = useMemo(
    () => (o: OrdersManagerOrder) =>
      o.items.reduce((sum, line) => sum + line.quantity, 0),
    [],
  )

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders
    return orders.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter])

  const topClients = useMemo(() => clientInsights.slice(0, 8), [clientInsights])

  const updateStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
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
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: data.status! } : o)),
          )
        }
        router.refresh()
      } catch {
        setError("Réseau indisponible.")
      } finally {
        setSavingId(null)
      }
    },
    [router],
  )

  return (
    <div className="border-t border-stone-200/80 pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300/80 pb-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center bg-stone-900 text-white">
              <Package className="size-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
                Commandes & CRM
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Synthèse des ventes, file logistique et portrait clients à partir des commandes en
                base.
              </p>
              {staffEmail ? (
                <p className="mt-2 text-xs text-stone-500">
                  Session : <span className="font-medium text-stone-700">{staffEmail}</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <p
            className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {/* ——— Synthèse ——— */}
        <section id="crm-overview" className="scroll-mt-28 mt-10 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-3">
            <h2 className="text-lg font-semibold text-stone-900">Synthèse</h2>
            <p className="max-w-xl text-[11px] leading-relaxed text-stone-500">
              Ventes hors commandes annulées · jour calendaire · fenêtre 7 jours glissants · mois en
              cours ({CRM_STATS_TIMEZONE.replace("_", " ")}).
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-5 lg:gap-10">
            <div className="lg:col-span-3">
              <PeriodBars overview={overview} />
            </div>
            <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm lg:col-span-2">
              <StatusStrip counts={statusLast30} />
            </div>
          </div>
        </section>

        {/* ——— Commandes ——— */}
        <section id="crm-commandes" className="scroll-mt-28 mt-16 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-3">
            <h2 className="text-lg font-semibold text-stone-900">Commandes</h2>
            <p className="text-xs text-stone-500">
              {filteredOrders.length} affichée{filteredOrders.length > 1 ? "s" : ""} sur{" "}
              {orders.length} chargée{orders.length > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={cn(
                "rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === "all"
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
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors",
                  statusFilter === s
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:border-stone-500",
                )}
              >
                {ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <p className="py-12 text-center text-sm text-stone-500">
              Aucune commande pour ce filtre.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {filteredOrders.map((order) => {
                const open = expanded.has(order.id)
                const qty = itemCount(order)
                return (
                  <li key={order.id}>
                    <div
                      className={cn(
                        "overflow-hidden border border-stone-300/90 bg-white shadow-sm",
                        open && "ring-1 ring-stone-400/40",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(order.id)}
                        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-stone-50 md:gap-4 md:px-5 md:py-5"
                      >
                        <span className="mt-0.5 shrink-0 text-stone-500">
                          {open ? (
                            <ChevronDown className="size-5" aria-hidden />
                          ) : (
                            <ChevronRight className="size-5" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 gap-y-1">
                            <span className="font-mono text-sm font-semibold text-stone-900">
                              {order.orderReference}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ring-1",
                                statusBadgeClass(order.status),
                              )}
                            >
                              {ORDER_STATUS_LABELS[order.status]}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-sm text-stone-700">{order.customerName}</p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                            <span>
                              {qty} article{qty > 1 ? "s" : ""}
                            </span>
                            <span>{formatDate(order.createdAt)}</span>
                            <span className="font-medium text-stone-800">
                              {formatDh(order.grandTotal)}
                            </span>
                          </div>
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
                                    <a
                                      href={`mailto:${order.email}`}
                                      className="underline decoration-stone-400 underline-offset-2"
                                    >
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
                              <h3 className="text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
                                Statut
                              </h3>
                              <OrderStatusControls
                                order={order}
                                savingId={savingId}
                                onApply={updateStatus}
                              />

                              <h3 className="mt-8 text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
                                Totaux
                              </h3>
                              <ul className="mt-3 space-y-1 text-sm text-stone-700">
                                <li className="flex justify-between gap-4">
                                  <span>Sous-total articles</span>
                                  <span>{formatDh(order.subtotal)}</span>
                                </li>
                                {order.volumeDiscount > 0 ? (
                                  <li className="flex justify-between gap-4 text-emerald-800">
                                    <span>Remise volume</span>
                                    <span>−{formatDh(order.volumeDiscount)}</span>
                                  </li>
                                ) : null}
                                <li className="flex justify-between gap-4">
                                  <span>Livraison</span>
                                  <span>
                                    {order.deliveryFee <= 0
                                      ? "Offerte"
                                      : formatDh(order.deliveryFee)}
                                  </span>
                                </li>
                                <li className="flex justify-between gap-4 border-t border-stone-200 pt-2 font-semibold text-stone-900">
                                  <span>Total</span>
                                  <span>{formatDh(order.grandTotal)}</span>
                                </li>
                                <li className="text-xs text-stone-500">
                                  Paiement :{" "}
                                  {order.paymentMethod === "cod"
                                    ? "à la livraison"
                                    : order.paymentMethod}
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="mt-8">
                            <h3 className="text-xs font-semibold tracking-[0.2em] text-stone-500 uppercase">
                              Articles à préparer
                            </h3>
                            <ul className="mt-3 divide-y divide-stone-200 border border-stone-200 bg-white">
                              {order.items.map((line) => (
                                <li
                                  key={`${order.id}-${line.productId}`}
                                  className="flex gap-3 px-3 py-3 md:gap-4 md:px-4"
                                >
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
                                      <div className="flex size-full items-center justify-center text-[10px] text-stone-400">
                                        —
                                      </div>
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
              })}
            </ul>
          )}
        </section>

        {/* ——— Clients ——— */}
        <section id="crm-clients" className="scroll-mt-28 mt-16 space-y-8">
          <div className="border-b border-stone-200 pb-3">
            <h2 className="text-lg font-semibold text-stone-900">Clients</h2>
            <p className="mt-1 text-xs text-stone-600">
              Fusion collection « Clients » et historique commandes (hors annulées) · tri par CA.
            </p>
          </div>

          <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
            <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
              Top clients (CA cumulé)
            </h3>
            {topClients.length === 0 ? (
              <p className="mt-4 text-sm text-stone-500">Pas encore de données client.</p>
            ) : (
              <ul className="mt-4 divide-y divide-stone-200">
                {topClients.map((row, idx) => (
                  <li
                    key={row.email}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm first:pt-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="tabular-nums text-xs font-semibold text-stone-400">
                        {idx + 1}.
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stone-900">{row.email}</p>
                        {row.displayName ? (
                          <p className="truncate text-xs text-stone-500">{row.displayName}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-6 tabular-nums text-xs md:text-sm">
                      <span className="text-stone-600">
                        {row.orderCount} cmd.
                      </span>
                      <span className="font-semibold text-stone-900">
                        {formatDh(row.lifetimeValueDh)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-x-auto rounded-sm border border-stone-300/90 bg-white shadow-sm">
            <table className="min-w-[640px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold tracking-wide text-stone-600 uppercase">
                  <th className="px-4 py-3 font-semibold">E-mail</th>
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Téléphone</th>
                  <th className="px-4 py-3 font-semibold text-right">Commandes</th>
                  <th className="px-4 py-3 font-semibold text-right">CA (Dh)</th>
                  <th className="px-4 py-3 font-semibold">Dernière commande</th>
                </tr>
              </thead>
              <tbody>
                {clientInsights.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-stone-500" colSpan={6}>
                      Aucun client à afficher.
                    </td>
                  </tr>
                ) : (
                  clientInsights.map((row) => (
                    <tr key={row.email} className="border-b border-stone-100 hover:bg-stone-50/80">
                      <td className="px-4 py-3 font-mono text-[13px] text-stone-900">
                        <a className="underline decoration-stone-300 underline-offset-2" href={`mailto:${row.email}`}>
                          {row.email}
                        </a>
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-stone-700">
                        {row.displayName ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-stone-700">
                        {row.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">{row.orderCount}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-stone-900">
                        {formatDh(row.lifetimeValueDh)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-600">
                        {row.lastOrderAt ? formatDate(row.lastOrderAt) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-stone-500">
            Astuce : les métriques synthèse utilisent au plus les{" "}
            <span className="font-medium text-stone-700">500</span> commandes les plus récentes.
            Ouvrez Payload pour filtrages plus poussés ou exports.
          </p>
        </section>
      </div>
    </div>
  )
}
