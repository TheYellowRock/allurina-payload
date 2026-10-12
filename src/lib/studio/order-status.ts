export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "packing",
  "shipped",
  "delivered",
  "cancelled",
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  packing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
}

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v)
}

export const TERMINAL_STATUSES: readonly OrderStatus[] = ["delivered", "cancelled"]

/** Forward order of the non-terminal happy path; `cancelled` is a separate terminal branch reachable from any non-terminal status. */
const STATUS_FLOW_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  packing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
}

/**
 * True when a status change is unusual enough to warrant an extra confirmation step:
 * moving backward along the happy path, or leaving a terminal status (delivered/cancelled)
 * for anything else. Cancelling from any non-terminal status is always ordinary.
 */
export function isUnusualTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false
  if (TERMINAL_STATUSES.includes(from)) return true
  if (to === "cancelled") return false
  return STATUS_FLOW_INDEX[to] < STATUS_FLOW_INDEX[from]
}

/** Threshold past which an unconfirmed order is flagged as needing a call. */
export const URGENT_PENDING_HOURS = 24

export function isUrgentPendingOrder(
  order: { status: OrderStatus; createdAt: string },
  now: Date = new Date(),
): boolean {
  if (order.status !== "pending") return false
  const created = new Date(order.createdAt).getTime()
  if (!Number.isFinite(created)) return false
  return now.getTime() - created >= URGENT_PENDING_HOURS * 3_600_000
}

/** ISO instant `URGENT_PENDING_HOURS` before `now` — the cutoff for the "À traiter" bucket. */
export function urgentCutoffIso(now: Date = new Date()): string {
  return new Date(now.getTime() - URGENT_PENDING_HOURS * 3_600_000).toISOString()
}
