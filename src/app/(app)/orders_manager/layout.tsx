import Link from "next/link"

/** Staff CRM shell — no boutique mega-menu; compact in-app navigation only. */
export default function OrdersManagerLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-[#f4f3f0]">
      <header className="sticky top-0 z-40 border-b border-stone-300/90 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2">
            <span className="text-sm font-semibold tracking-tight text-stone-900">
              Allurina · CRM
            </span>
            <nav
              className="flex flex-wrap items-center gap-1 text-xs font-medium text-stone-600 md:text-[13px]"
              aria-label="Sections CRM"
            >
              <a
                href="#crm-overview"
                className="rounded-sm px-2 py-1 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                Synthèse
              </a>
              <span className="text-stone-300" aria-hidden>
                ·
              </span>
              <a
                href="#crm-commandes"
                className="rounded-sm px-2 py-1 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                Commandes
              </a>
              <span className="text-stone-300" aria-hidden>
                ·
              </span>
              <a
                href="#crm-clients"
                className="rounded-sm px-2 py-1 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                Clients
              </a>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs md:text-[13px]">
            <Link
              href="/"
              className="font-medium text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline"
            >
              Boutique
            </Link>
            <Link
              href="/admin/collections/orders"
              className="rounded-none border border-stone-400 px-2.5 py-1 font-medium text-stone-800 transition-colors hover:bg-stone-900 hover:text-white"
            >
              Payload
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
