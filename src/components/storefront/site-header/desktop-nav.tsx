"use client"

import Link from "next/link"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import type { StorefrontCategory } from "@/lib/getStorefrontCategories"
import type { StorefrontCollection } from "@/lib/getStorefrontCollections"
import { chalesTypeLabel } from "@/lib/navLabels"
import { NOUVEAUTES_PATH, TOUTES_LES_PIECES_PATH, chalesCategoryPath } from "@/lib/routes"
import { cn } from "@/lib/utils"

import { NAV } from "@/components/storefront/site-header/nav-styles"

export function DesktopNav({
  collections,
  chalesCategories,
}: {
  collections: StorefrontCollection[]
  chalesCategories: StorefrontCategory[]
}) {
  return (
    <NavigationMenu
      viewport={false}
      className="relative z-60 hidden max-w-none flex-1 justify-center lg:flex"
    >
      <NavigationMenuList className="flex flex-wrap items-center justify-center gap-0">
        <NavigationMenuItem value="nouveautes">
          <NavigationMenuLink asChild>
            <Link href={NOUVEAUTES_PATH} className={NAV.link}>
              Nouveautés
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem value="collections">
          <NavigationMenuTrigger className={NAV.trigger}>Collections</NavigationMenuTrigger>
          <NavigationMenuContent className={cn(NAV.submenu, "min-w-56 p-0")}>
            <ul>
              <li>
                <NavigationMenuLink asChild>
                  <Link href={TOUTES_LES_PIECES_PATH} className={cn(NAV.link, NAV.linkInactive)}>
                    Tous les articles
                  </Link>
                </NavigationMenuLink>
              </li>
              {collections.map((c) => (
                <li key={c.slug}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={`/collections/${c.slug}`}
                      className={cn(NAV.link, NAV.linkInactive)}
                    >
                      {c.name}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem value="chales">
          <NavigationMenuTrigger className={NAV.trigger}>Châles</NavigationMenuTrigger>
          <NavigationMenuContent className={cn(NAV.submenu, "min-w-52 p-0")}>
            <ul>
              {chalesCategories.map((c) => (
                <li key={c.slug}>
                  <NavigationMenuLink asChild>
                    <Link
                      href={chalesCategoryPath(c.slug)}
                      className={cn(NAV.link, NAV.linkInactive)}
                    >
                      {chalesTypeLabel(c.name)}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
