import type { CheckoutStockFailure } from "@/lib/checkout/types"
import type { CartValidationItem } from "@/lib/checkout/validateCart"
import { lineKey, lineDisplayTitle, type CartLineItem } from "@/lib/cart/types"

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
  const byKey = new Map(validation.map((item) => [lineKey(item), item]))
  const issues: CartIssue[] = []
  const nextItems: CartLineItem[] = []

  for (const line of items) {
    const check = byKey.get(lineKey(line))
    if (!check || !check.exists || (check.currentStock ?? 0) <= 0) {
      issues.push({
        productId: line.productId,
        title: lineDisplayTitle(line),
        reason: "removed",
        detail: removedDetail(lineDisplayTitle(line)),
      })
      continue
    }

    let next = line
    if (check.priceChanged && check.currentPrice !== null) {
      next = { ...next, price: check.currentPrice }
      issues.push({
        productId: line.productId,
        title: lineDisplayTitle(line),
        reason: "price_changed",
        detail: `Le prix de ${lineDisplayTitle(line)} a été mis à jour.`,
      })
    }
    if (check.insufficientStock && check.currentStock !== null && check.currentStock > 0) {
      next = { ...next, quantity: check.currentStock }
      issues.push({
        productId: line.productId,
        title: lineDisplayTitle(line),
        reason: "stock_reduced",
        detail: stockReducedDetail(lineDisplayTitle(line), check.currentStock),
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
  const byKey = new Map(failures.map((failure) => [lineKey(failure), failure]))
  const issues: CartIssue[] = []
  const nextItems: CartLineItem[] = []

  for (const line of items) {
    const failure = byKey.get(lineKey(line))
    if (!failure) {
      nextItems.push(line)
      continue
    }
    if (failure.availableStock <= 0) {
      issues.push({
        productId: line.productId,
        title: lineDisplayTitle(line),
        reason: "removed",
        detail: removedDetail(lineDisplayTitle(line)),
      })
      continue
    }
    nextItems.push({ ...line, quantity: failure.availableStock })
    issues.push({
      productId: line.productId,
      title: lineDisplayTitle(line),
      reason: "stock_reduced",
      detail: stockReducedDetail(lineDisplayTitle(line), failure.availableStock),
    })
  }

  return { items: nextItems, issues }
}
