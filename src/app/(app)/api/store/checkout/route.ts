import { NextResponse } from "next/server"
import { commitTransaction, createLocalReq, getPayload, initTransaction, killTransaction } from "payload"
import { sql } from "@payloadcms/db-postgres"

import config from "@payload-config"
import { upsertClientFromCheckout } from "@/lib/clients/upsertClientFromCheckout"
import { computeCartPricing } from "@/lib/cart/pricing"
import type { CartLineItem } from "@/lib/cart/types"
import type { CheckoutStockFailure } from "@/lib/checkout/types"
import { validateCheckoutBody } from "@/lib/checkout/validate-checkout"
import { sendOrderConfirmation, sendOwnerNotification } from "@/lib/email"
import { storefrontMediaUrl } from "@/lib/storefront-scarf-display"

function generateOrderReference(): string {
  return `ALL-${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase()}`
}

export async function POST(req: Request) {
  try {
    let json: unknown
    try {
      json = await req.json()
    } catch {
      return NextResponse.json({ error: "JSON invalide." }, { status: 400 })
    }

    const parsed = validateCheckoutBody(json)
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const { customer, items: lineInputs, paymentMethod, idempotencyKey } = parsed.data

    const resolvedConfig = await config
    const payload = await getPayload({ config: resolvedConfig })

    // Idempotency: a resubmission carrying a key we've already accepted returns the
    // original order instead of creating a second one (double-click, retry, back button).
    const existingByKey = await payload.find({
      collection: "orders",
      where: { idempotencyKey: { equals: idempotencyKey } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const existingOrder = existingByKey.docs[0]
    if (existingOrder) {
      return NextResponse.json({ orderReference: existingOrder.orderReference })
    }

    // Server-side re-pricing: the client only sent { productId, quantity } — everything
    // else (price, title, slug, imageSrc) is re-derived from `scarves` right here, in one
    // query, and only that DB-derived data is ever stored on the order.
    const productIds = [...new Set(lineInputs.map((line) => line.productId))]
    const scarvesRes = await payload.find({
      collection: "scarves",
      where: { id: { in: productIds } },
      depth: 0,
      limit: productIds.length,
      overrideAccess: true,
    })
    const scarfById = new Map(scarvesRes.docs.map((doc) => [String(doc.id), doc]))

    const missingProductIds = productIds.filter((id) => !scarfById.has(id))
    if (missingProductIds.length > 0) {
      return NextResponse.json(
        { error: "Certains articles ne sont plus disponibles.", missingProductIds },
        { status: 400 },
      )
    }

    const items: CartLineItem[] = lineInputs.map((line) => {
      const scarf = scarfById.get(line.productId)!
      return {
        productId: line.productId,
        slug: String(scarf.slug),
        title: String(scarf.title),
        price: Number(scarf.price),
        quantity: line.quantity,
        imageSrc: storefrontMediaUrl(scarf.featuredImage),
      }
    })

    const pricing = computeCartPricing(items)
    const orderReference = generateOrderReference()

    await upsertClientFromCheckout(payload, customer)

    const localReq = await createLocalReq({}, payload)
    await initTransaction(localReq)

    let orderDoc: Record<string, unknown> | undefined

    try {
      const txDb = payload.db.sessions?.[String(await localReq.transactionID)]?.db as
        | Parameters<typeof payload.db.execute>[0]["db"]
        | undefined

      // Atomic per-line stock decrement — single `UPDATE ... WHERE stock_quantity >= qty
      // RETURNING`, no read-then-write. Runs before the order row exists.
      const stockFailures: CheckoutStockFailure[] = []
      for (const line of items) {
        const { rows } = await payload.db.execute({
          db: txDb,
          sql: sql`SELECT decrement_stock(${Number(line.productId)}, ${line.quantity}) AS new_stock`,
        })
        const newStock = rows[0]?.new_stock
        if (newStock === null || newStock === undefined) {
          const scarf = scarfById.get(line.productId)!
          stockFailures.push({
            productId: line.productId,
            title: line.title,
            availableStock: Number(scarf.stockQuantity ?? 0),
          })
        }
      }

      if (stockFailures.length > 0) {
        await killTransaction(localReq)
        return NextResponse.json(
          {
            error: "Stock insuffisant pour un ou plusieurs articles.",
            failedItems: stockFailures,
          },
          { status: 409 },
        )
      }

      orderDoc = await payload.create({
        collection: "orders",
        req: localReq,
        overrideAccess: true,
        data: {
          orderReference,
          idempotencyKey,
          customerName: customer.customerName,
          email: customer.email,
          phone: customer.phone,
          addressLine1: customer.addressLine1,
          ...(customer.addressLine2 ? { addressLine2: customer.addressLine2 } : {}),
          city: customer.city,
          postalCode: customer.postalCode,
          country: customer.country,
          ...(customer.notes ? { notes: customer.notes } : {}),
          paymentMethod,
          status: "pending",
          items,
          subtotal: pricing.merchandiseSaleTotal,
          volumeDiscount: pricing.promoSavingsDh,
          deliveryFee: pricing.deliveryDh,
          grandTotal: pricing.grandTotal,
        },
      })

      await commitTransaction(localReq)
    } catch (err) {
      await killTransaction(localReq)
      throw err
    }

    // Emails run after the transaction has committed and its pooled client has been
    // released — they never receive `req`, so a slow/stuck Resend call can no longer pin
    // a transactional connection (see the pg "client already executing a query" audit).
    // Awaited (not fire-and-forget): on Vercel, work started after the response is sent
    // isn't guaranteed to run to completion. Both functions already catch their own
    // errors internally (Resend failures are logged, never thrown).
    if (orderDoc) {
      await Promise.all([sendOrderConfirmation(orderDoc), sendOwnerNotification(orderDoc)])
    }

    return NextResponse.json({ orderReference })
  } catch (error) {
    console.error("[store/checkout]", error)
    return NextResponse.json(
      { error: "Impossible d’enregistrer la commande. Réessayez plus tard." },
      { status: 500 },
    )
  }
}
