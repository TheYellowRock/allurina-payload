import type { Metadata } from "next"
import Link from "next/link"

import { getStaffUser } from "@/lib/studio/getStaffUser"
import { urgentCutoffIso } from "@/lib/studio/order-status"

import { Sidebar } from "./_components/sidebar"

// Scoped to the Studio only — the public storefront's own metadata is untouched. See
// manifest.webmanifest/route.ts for why this isn't the special `manifest.ts` convention.
export const metadata: Metadata = {
  title: { default: "Studio | Allurina", template: "%s | Allurina Studio" },
  robots: { index: false, follow: false },
  manifest: "/studio/manifest.webmanifest",
}

/**
 * Staff Studio shell: header + sidebar shared by every Studio page. Each page still does
 * its own `requireStaffUser(path)` (so the login redirect lands back on that exact page);
 * here the session is only read to decide whether to show the sidebar and its badge.
 */
export default async function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { payload, user } = await getStaffUser()
  const staffEmail = user && "email" in user ? String((user as { email?: string }).email ?? "") : null

  // Sidebar badge — count-only query (`limit: 1`, only `totalDocs` is read).
  const urgentPending = user
    ? (
        await payload.find({
          collection: "orders",
          where: { status: { equals: "pending" }, createdAt: { less_than: urgentCutoffIso() } },
          depth: 0,
          limit: 1,
          overrideAccess: true,
        })
      ).totalDocs
    : 0

  return (
    <div className="min-h-screen bg-[#f4f3f0]">
      {/* Fixed h-14 height: the sidebar and the Métriques sticky cards row both anchor to
          `top-14`, so this must stay in sync if the header height ever changes. */}
      <header className="sticky top-0 z-40 h-14 border-b border-stone-300/90 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
          {/* pl-9 clears the fixed hamburger button (Sidebar) below 1024px. */}
          <span className="pl-9 text-sm font-semibold tracking-tight text-stone-900 lg:pl-0">Allurina · Studio</span>
          <div className="flex shrink-0 items-center gap-3 text-xs md:text-[13px]">
            {staffEmail ? <span className="hidden text-stone-500 md:inline">{staffEmail}</span> : null}
            <Link href="/" className="font-medium text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline">
              Boutique
            </Link>
            <Link
              href="/admin"
              className="rounded-none border border-stone-400 px-2.5 py-1 font-medium text-stone-800 transition-colors hover:bg-stone-900 hover:text-white"
            >
              Payload
            </Link>
          </div>
        </div>
      </header>
      {user ? (
        <div className="flex border-t border-stone-200/80">
          <Sidebar badges={{ urgentPending }} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
