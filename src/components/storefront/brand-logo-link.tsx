"use client"

import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

const LOGO_SRC = "/allurina-scarf-logo.png"

export function BrandLogoLink({
  className,
  variant = "header",
}: {
  className?: string
  variant?: "header" | "footer"
}) {
  return (
    <Link
      href="/"
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2",
        variant === "header" &&
          "block min-w-0 max-w-full shrink md:inline-block md:shrink-0",
        variant === "footer" && "inline-block shrink-0",
        className,
      )}
    >
      <Image
        src={LOGO_SRC}
        alt="Allurina Scarf"
        width={1000}
        height={305}
        priority={variant === "header"}
        className={cn(
          "object-contain object-left",
          variant === "header" &&
            "h-10 w-auto max-w-full md:h-14",
          variant === "footer" &&
            "h-7 max-w-35 w-auto sm:h-8 sm:max-w-40",
        )}
      />
    </Link>
  )
}
