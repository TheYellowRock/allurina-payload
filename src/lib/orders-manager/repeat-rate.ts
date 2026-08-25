import type { OrdersManagerOrder } from "./serialize-order"

/** Last 9 digits, non-digits stripped — groups the same Moroccan number across formatting variants (spaces, +212, leading 0). */
export function normalizePhoneLast9(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits.slice(-9)
}

export type RepeatRateStats = {
  totalOrders: number
  repeatOrders: number
  repeatShare: number
  newCustomers: number
  returningCustomers: number
}

/** Share of orders whose phone number appears on more than one order in the set. */
export function repeatRateByPhone(orders: OrdersManagerOrder[]): RepeatRateStats {
  const countByPhone = new Map<string, number>()
  for (const o of orders) {
    const key = normalizePhoneLast9(o.phone)
    if (!key) continue
    countByPhone.set(key, (countByPhone.get(key) ?? 0) + 1)
  }

  let repeatOrders = 0
  let newCustomers = 0
  let returningCustomers = 0
  for (const count of countByPhone.values()) {
    if (count > 1) {
      repeatOrders += count
      returningCustomers += 1
    } else {
      newCustomers += 1
    }
  }

  const totalOrders = orders.length
  return {
    totalOrders,
    repeatOrders,
    repeatShare: totalOrders > 0 ? repeatOrders / totalOrders : 0,
    newCustomers,
    returningCustomers,
  }
}
