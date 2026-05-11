import type { Metadata } from "next"
import Link from "next/link"

import { getStaffUser } from "@/lib/orders-manager/getStaffUser"
import { serializeOrderDoc } from "@/lib/orders-manager/serialize-order"

import { OrdersManagerDashboard } from "./orders-manager-dashboard"

export const metadata: Metadata = {
  title: "Commandes — logistique | AllurinaScarf",
  robots: { index: false, follow: false },
}

export default async function OrdersManagerPage() {
  const { user, payload } = await getStaffUser()

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-stone-900">Préparation des commandes</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          Connectez-vous avec un compte Payload (bouton ci-dessous), puis ouvrez à nouveau cette page.
          Les cookies de session admin s’appliquent au même site.
        </p>
        <Link
          href="/admin/login"
          className="mt-8 inline-flex h-11 items-center border-2 border-stone-900 bg-stone-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-stone-900"
        >
          Connexion admin
        </Link>
      </div>
    )
  }

  const res = await payload.find({
    collection: "orders",
    limit: 200,
    depth: 0,
    sort: "-createdAt",
    overrideAccess: true,
  })

  const orders = res.docs
    .map((d) => serializeOrderDoc(d as unknown as Record<string, unknown>))
    .filter((o): o is NonNullable<typeof o> => o != null)

  const staffEmail =
    typeof user === "object" && user && "email" in user
      ? String((user as { email?: string }).email ?? "")
      : undefined

  return (
    <OrdersManagerDashboard
      initialOrders={orders}
      staffEmail={staffEmail || undefined}
    />
  )
}
