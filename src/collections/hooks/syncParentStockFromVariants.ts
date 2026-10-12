import { sql } from '@payloadcms/db-postgres'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

type VariantDoc = { product?: unknown }

function relId(value: unknown): number | null {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  if (value && typeof value === 'object' && 'id' in value) return relId((value as { id: unknown }).id)
  return null
}

/**
 * Keeps `scarves.stock_quantity` of a variable product equal to the sum of its variants.
 * Raw SQL on the request's own transaction (so it sees the variant row just written,
 * before commit) and no Payload update of the product (so no product hooks re-run).
 * `decrement_variant_stock()` in the database keeps the same invariant at checkout.
 */
async function recompute(req: PayloadRequest, productId: number): Promise<void> {
  const payload = req.payload
  const txDb = req.transactionID
    ? (payload.db.sessions?.[String(await req.transactionID)]?.db as
        | Parameters<typeof payload.db.execute>[0]['db']
        | undefined)
    : undefined

  await payload.db.execute({
    db: txDb,
    // Fallback when the operation runs outside a transaction (`execute` needs one of the two).
    drizzle: payload.db.drizzle,
    sql: sql`
      UPDATE "scarves"
      SET "stock_quantity" = (
        SELECT COALESCE(SUM("stock_quantity"), 0) FROM "product_variants" WHERE "product_id" = ${productId}
      )
      WHERE "id" = ${productId} AND "has_variants" = true
    `,
  })
}

export const syncParentStockFromVariants: CollectionAfterChangeHook & CollectionAfterDeleteHook = async (
  args: Parameters<CollectionAfterChangeHook>[0] | Parameters<CollectionAfterDeleteHook>[0],
) => {
  const { doc, req } = args
  const previousDoc = 'previousDoc' in args ? (args.previousDoc as VariantDoc | undefined) : undefined

  const ids = new Set<number>()
  const current = relId((doc as VariantDoc).product)
  if (current != null) ids.add(current)
  // Variant moved to another product: the old parent must be recomputed too.
  const previous = relId(previousDoc?.product)
  if (previous != null) ids.add(previous)

  for (const id of ids) await recompute(req, id)
  return doc
}
