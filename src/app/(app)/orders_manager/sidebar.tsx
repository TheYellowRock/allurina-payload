"use client"

import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react"
import Link from "next/link"
import { useState, useSyncExternalStore } from "react"

import type { OrdersManagerTab } from "@/lib/orders-manager/tabs"
import { cn } from "@/lib/utils"

import { NAV_GROUPS, NAV_ITEMS } from "./nav-config"
import type { NavBadgeKey } from "./nav-config"

const COLLAPSE_STORAGE_KEY = "orders-manager-sidebar-collapsed"

// A tiny external store for the collapsed preference, read via `useSyncExternalStore`
// rather than `useEffect` + `setState`: localStorage doesn't exist during SSR, so the
// server and the client's first paint must agree on a value (here, `false`) without
// either of them touching `window` — `useSyncExternalStore`'s `getServerSnapshot` is
// exactly the sanctioned way to do that, and it re-renders with the real client value
// right after hydration on its own, with no manual effect involved.
const collapseListeners = new Set<() => void>()

function readCollapsed(): boolean {
  return window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1"
}

function writeCollapsed(next: boolean): void {
  window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0")
  collapseListeners.forEach((listener) => listener())
}

function subscribeCollapsed(listener: () => void): () => void {
  collapseListeners.add(listener)
  return () => collapseListeners.delete(listener)
}

function getServerCollapsedSnapshot(): boolean {
  return false
}

function NavList({
  collapsed,
  active,
  badges,
  onNavigate,
}: {
  collapsed: boolean
  active: OrdersManagerTab
  badges: Partial<Record<NavBadgeKey, number>>
  onNavigate: () => void
}) {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-2 py-4">
      {NAV_GROUPS.map((group) => {
        const items = NAV_ITEMS.filter((i) => i.group === group)
        return (
          <div key={group}>
            {!collapsed ? (
              <p className="px-2.5 text-[10px] font-semibold tracking-[0.16em] text-stone-400 uppercase">{group}</p>
            ) : null}
            <ul className="mt-2 space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon
                const isActive = item.tab === active
                const badgeCount = item.badgeKey ? badges[item.badgeKey] : undefined
                const hasBadge = Boolean(badgeCount && badgeCount > 0)

                const inner = (
                  <>
                    <span className="relative shrink-0">
                      <Icon className="size-4" strokeWidth={1.75} aria-hidden />
                      {collapsed && hasBadge ? (
                        <span className="absolute -top-1 -right-1 size-1.5 rounded-full bg-red-600" aria-hidden />
                      ) : null}
                    </span>
                    {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                    {!collapsed && hasBadge ? (
                      <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        {badgeCount}
                      </span>
                    ) : null}
                  </>
                )

                if (!item.tab) {
                  return (
                    <li key={item.id}>
                      <div
                        className="flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm text-stone-400"
                        title={collapsed ? `${item.label} (bientôt)` : undefined}
                      >
                        {inner}
                        {!collapsed ? <span className="text-[10px] text-stone-400">Bientôt</span> : null}
                      </div>
                    </li>
                  )
                }

                return (
                  <li key={item.id}>
                    <Link
                      href={`/orders_manager?tab=${item.tab}`}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm font-medium transition-colors",
                        isActive ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100 hover:text-stone-900",
                      )}
                      title={collapsed ? item.label : undefined}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {inner}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export function Sidebar({
  active,
  badges,
}: {
  active: OrdersManagerTab
  badges: Partial<Record<NavBadgeKey, number>>
}) {
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, getServerCollapsedSnapshot)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleCollapsed = () => {
    writeCollapsed(!collapsed)
  }

  return (
    <>
      {/* Desktop persistent sidebar */}
      <aside
        className={cn(
          "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-stone-200 bg-white transition-[width] duration-150 lg:flex",
          collapsed ? "w-16" : "w-60",
        )}
        aria-label="Navigation CRM"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-3 py-3">
          {!collapsed ? (
            <span className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">Menu</span>
          ) : null}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="ml-auto inline-flex rounded-sm p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            aria-label={collapsed ? "Déplier le menu" : "Replier le menu"}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>
        </div>
        <NavList collapsed={collapsed} active={active} badges={badges} onNavigate={() => {}} />
      </aside>

      {/* Mobile hamburger trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-40 inline-flex items-center justify-center rounded-sm border border-stone-300 bg-white p-2 text-stone-700 shadow-sm lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Mobile drawer overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer le menu"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-3 py-3">
              <span className="text-xs font-semibold tracking-[0.14em] text-stone-500 uppercase">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex rounded-sm p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                aria-label="Fermer le menu"
              >
                <X className="size-4" />
              </button>
            </div>
            <NavList collapsed={false} active={active} badges={badges} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  )
}
