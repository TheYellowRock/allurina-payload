"use client"

import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function HeaderIconButton({
  className,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-none text-stone-800 outline-none transition-colors hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-stone-900/20",
        className,
      )}
      {...props}
    />
  )
}
