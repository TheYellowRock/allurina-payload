import { LayoutGrid, Package, RotateCcw, Shirt, ShoppingCart, Tag, Truck, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { STUDIO_PATHS } from "@/lib/studio/paths"

export type NavBadgeKey = "urgentPending"
export type NavGroup = "Opérations" | "Analyse" | "Configuration"

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  group: NavGroup
  /** Present = a real page. Absent = a future placeholder, rendered disabled. */
  href?: string
  badgeKey?: NavBadgeKey
}

export const NAV_GROUPS: NavGroup[] = ["Opérations", "Analyse", "Configuration"]

/**
 * Data-driven sidebar contents — adding a section is one entry here plus its page folder.
 * Items without `href` render as disabled placeholders until those pages exist.
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "orders", label: "Commandes", icon: ShoppingCart, group: "Opérations", href: STUDIO_PATHS.orders, badgeKey: "urgentPending" },
  { id: "catalog", label: "Catalogue", icon: Shirt, group: "Opérations", href: STUDIO_PATHS.catalog },
  { id: "livraisons", label: "Livraisons", icon: Truck, group: "Opérations" },
  { id: "retours", label: "Retours", icon: RotateCcw, group: "Opérations" },
  { id: "metrics", label: "Métriques", icon: LayoutGrid, group: "Analyse", href: STUDIO_PATHS.metrics },
  { id: "performance", label: "Performances produits", icon: Package, group: "Analyse", href: STUDIO_PATHS.performance },
  { id: "clients", label: "Clients", icon: Users, group: "Analyse" },
  { id: "promotions", label: "Promotions", icon: Tag, group: "Configuration", href: STUDIO_PATHS.promotions },
]
