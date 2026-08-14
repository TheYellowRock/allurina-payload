"use client"

import { AlertTriangle, X } from "lucide-react"

import type { CartIssue } from "@/lib/cart/reconcile"

/**
 * Informational, dismissible — the cart itself has already been corrected by the caller
 * (see `applyCartValidation`/`applyStockConflict`) before this renders. Dismissing does
 * not re-enable submission on its own; callers gate that on a fresh click after the fix.
 */
export function CartValidationBanner({
  issues,
  onDismiss,
}: {
  issues: CartIssue[]
  onDismiss: () => void
}) {
  if (issues.length === 0) return null

  return (
    <div
      role="alert"
      className="flex items-start gap-3 border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium">Votre panier a été mis à jour</p>
        <ul className="space-y-0.5 text-amber-800">
          {issues.map((issue) => (
            <li key={`${issue.productId}-${issue.reason}`}>{issue.detail}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-amber-700 hover:text-amber-900"
        aria-label="Fermer"
      >
        <X className="size-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}
