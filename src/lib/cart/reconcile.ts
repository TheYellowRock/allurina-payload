import type { CheckoutStockFailure } from "@/lib/checkout/types"
import type { CartValidationItem } from "@/lib/checkout/validateCart"
import type { CartLineItem } from "@/lib/cart/types"

export type CartIssue = {
  productId: string
  title: string
  reason: "removed" | "price_changed" | "stock_reduced"
  detail: string
}

function removedDetail(title: string): string {
  return `${title} n’est plus disponible et a été retiré de votre panier.`
}

function stockReducedDetail(title: string, remaining: number): string {
  const phrase = remaining === 1 ? "il ne reste qu’1 article" : `il ne reste que ${remaining} articles`
  return `${title} — ${phrase}.`
}

/** Applies a `validateCart` result to a cart: drop missing/out-of-stock lines, fix prices, clamp quantities. */
export function applyCartValidation(
  items: CartLineItem[],
  validation: CartValidationItem[],
): { items: CartLineItem[]; issues: CartIssue[] } {
  const byProductId = new Map(validation.map((item) => [item.productId, item]))
  const issues: CartIssue[] = []
  const nextItems: CartLineItem[] = []

  for (const line of items) {
    const check = byProductId.get(line.productId)
    if (!check || !check.exists || (check.currentStock ?? 0) <= 0) {
      issues.push({
        productId: line.productId,
        title: line.title,
        reason: "removed",
        detail: removedDetail(line.title),
      })
      continue
    }

    let next = line
    if (check.priceChanged && check.currentPrice !== null) {
      next = { ...next, price: check.currentPrice }
      issues.push({
        productId: line.productId,
        title: line.title,
        reason: "price_changed",
        detail: `Le prix de ${line.title} a été mis à jour.`,
      })
    }
    if (check.insufficientStock && check.currentStock !== null && check.currentStock > 0) {
      next = { ...next, quantity: check.currentStock }
      issues.push({
        productId: line.productId,
        title: line.title,
        reason: "stock_reduced",
        detail: stockReducedDetail(line.title, check.currentStock),
      })
    }
    nextItems.push(next)
  }

  return { items: nextItems, issues }
}

/** Applies a 409 stock-conflict response from `POST /api/store/checkout` to the cart. */
export function applyStockConflict(
  items: CartLineItem[],
  failures: CheckoutStockFailure[],
): { items: CartLineItem[]; issues: CartIssue[] } {
  const byProductId = new Map(failures.map((failure) => [failure.productId, failure]))
  const issues: CartIssue[] = []
  const nextItems: CartLineItem[] = []

  for (const line of items) {
    const failure = byProductId.get(line.productId)
    if (!failure) {
      nextItems.push(line)
      continue
    }
    if (failure.availableStock <= 0) {
      issues.push({
        productId: line.productId,
        title: line.title,
        reason: "removed",
        detail: removedDetail(line.title),
      })
      continue
    }
    nextItems.push({ ...line, quantity: failure.availableStock })
    issues.push({
      productId: line.productId,
      title: line.title,
      reason: "stock_reduced",
      detail: stockReducedDetail(line.title, failure.availableStock),
    })
  }

  return { items: nextItems, issues }
}
