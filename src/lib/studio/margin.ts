import type { OrdersManagerOrder } from "./serialize-order"

export type MarginEstimate = {
  estimatedCost: number
  estimatedMargin: number
  marginPct: number | null
}

/**
 * Rough per-order margin from a flat manual unit-cost assumption — never recorded COGS.
 * Returns null when `unitCost` isn't set: callers must hide the margin UI entirely in
 * that case, not render a 0/100% or otherwise nonsense figure.
 */
export function estimateOrderMargin(order: OrdersManagerOrder, unitCost: number): MarginEstimate | null {
  if (unitCost <= 0) return null
  const totalQty = order.items.reduce((sum, line) => sum + line.quantity, 0)
  const estimatedCost = unitCost * totalQty
  const estimatedMargin = order.grandTotal - estimatedCost - order.deliveryFee
  return {
    estimatedCost,
    estimatedMargin,
    marginPct: order.grandTotal > 0 ? estimatedMargin / order.grandTotal : null,
  }
}

export type AggregateMarginEstimate = {
  totalEstimatedCost: number
  totalEstimatedMargin: number
  marginPct: number | null
  orderCount: number
}

/** Same estimate, aggregated across a set of orders (e.g. delivered orders in a Métriques range). */
export function estimateAggregateMargin(
  orders: OrdersManagerOrder[],
  unitCost: number,
): AggregateMarginEstimate | null {
  if (unitCost <= 0) return null
  let totalRevenue = 0
  let totalEstimatedCost = 0
  let totalDeliveryFee = 0
  for (const o of orders) {
    const totalQty = o.items.reduce((sum, line) => sum + line.quantity, 0)
    totalEstimatedCost += unitCost * totalQty
    totalDeliveryFee += o.deliveryFee
    totalRevenue += o.grandTotal
  }
  const totalEstimatedMargin = totalRevenue - totalEstimatedCost - totalDeliveryFee
  return {
    totalEstimatedCost,
    totalEstimatedMargin,
    marginPct: totalRevenue > 0 ? totalEstimatedMargin / totalRevenue : null,
    orderCount: orders.length,
  }
}
