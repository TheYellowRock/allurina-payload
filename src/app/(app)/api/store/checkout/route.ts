import { NextResponse } from "next/server"
import { getPayload } from "payload"

import config from "@payload-config"
import { upsertClientFromCheckout } from "@/lib/clients/upsertClientFromCheckout"
import { computeCartPricing } from "@/lib/cart/pricing"
import { validateCheckoutBody } from "@/lib/checkout/validate-checkout"

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

    const { customer, items, paymentMethod } = parsed.data
    const pricing = computeCartPricing(items)

    const orderReference = `ALL-${Date.now().toString(36).toUpperCase()}${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`

    const resolvedConfig = await config
    const payload = await getPayload({ config: resolvedConfig })

    await upsertClientFromCheckout(payload, customer)

    await payload.create({
      collection: "orders",
      data: {
        orderReference,
        customerName: customer.customerName,
        email: customer.email,
        phone: customer.phone,
        addressLine1: customer.addressLine1,
        ...(customer.addressLine2
          ? { addressLine2: customer.addressLine2 }
          : {}),
        city: customer.city,
        postalCode: customer.postalCode,
        country: customer.country,
        ...(customer.notes ? { notes: customer.notes } : {}),
        paymentMethod,
        status: "pending",
        items,
        subtotal: pricing.merchandiseSaleTotal,
        volumeDiscount: pricing.volumeDiscountDh,
        deliveryFee: pricing.deliveryDh,
        grandTotal: pricing.grandTotal,
      },
      overrideAccess: true,
    })

    return NextResponse.json({ orderReference })
  } catch (error) {
    console.error("[store/checkout]", error)
    return NextResponse.json(
      { error: "Impossible d’enregistrer la commande. Réessayez plus tard." },
      { status: 500 },
    )
  }
}
