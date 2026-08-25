import { LayoutGrid, Package, RotateCcw, ShoppingCart, Truck, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import type { OrdersManagerTab } from "@/lib/orders-manager/tabs"

export type NavBadgeKey = "urgentPending"
export type NavGroup = "Opérations" | "Analyse"

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  group: NavGroup
  /** Present = a real, routable tab. Absent = a future placeholder, rendered disabled. */
  tab?: OrdersManagerTab
  badgeKey?: NavBadgeKey
}

export const NAV_GROUPS: NavGroup[] = ["Opérations", "Analyse"]

/**
 * Data-driven sidebar contents — adding a future section is one entry here, not a JSX
 * edit. Items without `tab` render as disabled placeholders (e.g. Livraisons, Retours,
 * Clients) until those routes exist.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "orders", label: "Commandes", icon: ShoppingCart, group: "Opérations", tab: "orders", badgeKey: "urgentPending" },
  { id: "livraisons", label: "Livraisons", icon: Truck, group: "Opérations" },
  { id: "retours", label: "Retours", icon: RotateCcw, group: "Opérations" },
  { id: "metrics", label: "Métriques", icon: LayoutGrid, group: "Analyse", tab: "metrics" },
  { id: "products", label: "Produits", icon: Package, group: "Analyse", tab: "products" },
  { id: "clients", label: "Clients", icon: Users, group: "Analyse" },
]
