import type { Payload } from 'payload'

import type { CheckoutCustomerPayload } from '@/lib/checkout/types'

/**
 * Crée ou met à jour un client par e-mail (insensible à la casse).
 * Appelé depuis l’API checkout avec overrideAccess.
 */
export async function upsertClientFromCheckout(
  payload: Payload,
  customer: CheckoutCustomerPayload,
): Promise<void> {
  const email = customer.email.trim().toLowerCase()
  if (!email) return

  const existing = await payload.find({
    collection: 'clients',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })

  const data = {
    email,
    fullName: customer.customerName,
    phone: customer.phone,
  }

  if (existing.docs[0]) {
    await payload.update({
      collection: 'clients',
      id: existing.docs[0].id,
      data,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'clients',
      data,
      overrideAccess: true,
    })
  }
}
