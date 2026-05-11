"use client"

import { ChevronDown, ChevronRight, Loader2, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import type { OrdersManagerOrder } from "@/lib/orders-manager/serialize-order"
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/orders-manager/order-status"
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
}: {
  initialOrders: OrdersManagerOrder[]
  staffEmail: string | undefined
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [orders, setOrders] = useState(initialOrders)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    <div className="border-t border-stone-200/80 bg-[#f4f3f0] pb-20">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300/80 pb-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center bg-stone-900 text-white">
              <Package className="size-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
                Préparation des commandes
              </h1>
              <p className="mt-1 text-sm text-stone-600">
                Récapitulatif, détail client et lignes — changement de statut pour la logistique.
              </p>
              {staffEmail ? (
                <p className="mt-2 text-xs text-stone-500">
                  Session : <span className="font-medium text-stone-700">{staffEmail}</span>
                </p>
              ) : null}
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-none border-stone-400" asChild>
            <Link href="/admin/collections/orders">Ouvrir dans Payload</Link>
          </Button>
        </div>

        {error ? (
          <p
            className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {orders.length === 0 ? (
          <p className="mt-12 text-center text-sm text-stone-500">
            Aucune commande pour le moment.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {orders.map((order) => {
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
                        <p className="mt-1 truncate text-sm text-stone-700">
                          {order.customerName}
                        </p>
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
                                  {order.postalCode} {order.city}
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
      </div>
    </div>
  )
}
