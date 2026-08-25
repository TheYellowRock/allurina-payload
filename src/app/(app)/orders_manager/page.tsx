import { Package } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getPayload } from "payload"

import config from "@payload-config"
import { getStaffUser } from "@/lib/orders-manager/getStaffUser"
import { urgentCutoffIso } from "@/lib/orders-manager/order-status"
import { resolveOrdersManagerTab } from "@/lib/orders-manager/tabs"

import { Sidebar } from "./sidebar"
import { MetricsTab } from "./tabs/metrics-tab"
import { OrdersTab } from "./tabs/orders-tab"
import { ProductsTab } from "./tabs/products-tab"

export const metadata: Metadata = {
  title: "Commandes — logistique | AllurinaScarf",
  robots: { index: false, follow: false },
}

type SearchParams = Record<string, string | string[] | undefined>

export default async function OrdersManagerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { user } = await getStaffUser()

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

  const sp = await searchParams
  const tab = resolveOrdersManagerTab(sp.tab)

  const staffEmail =
    typeof user === "object" && user && "email" in user
      ? String((user as { email?: string }).email ?? "")
      : undefined

  // Sidebar badge — count-only query, independent of which tab is active. Cheap: same
  // shape as orders-tab.tsx's "urgent" query, but `limit: 1` since only `totalDocs` is read.
  const resolvedConfig = await config
  const payload = await getPayload({ config: resolvedConfig })
  const urgentRes = await payload.find({
    collection: "orders",
    where: { status: { equals: "pending" }, createdAt: { less_than: urgentCutoffIso() } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  return (
    <div className="flex border-t border-stone-200/80">
      <Sidebar active={tab} badges={{ urgentPending: urgentRes.totalDocs }} />
      <main className="min-w-0 flex-1 pb-24">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center bg-stone-900 text-white">
                <Package className="size-5" strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
                  Commandes & CRM
                </h1>
                {staffEmail ? (
                  <p className="mt-2 text-xs text-stone-500">
                    Session : <span className="font-medium text-stone-700">{staffEmail}</span>
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-8">
            {tab === "orders" ? <OrdersTab searchParams={sp} /> : null}
            {tab === "metrics" ? <MetricsTab searchParams={sp} /> : null}
            {tab === "products" ? <ProductsTab searchParams={sp} /> : null}
          </div>
        </div>
      </main>
    </div>
  )
}
