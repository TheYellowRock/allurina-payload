"use client"

import { CircleCheck } from "lucide-react"
import { Toaster } from "sonner"

/** Creamy neutrals; success green only on the icon (no richColors). */
export function CartToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      icons={{
        success: (
          <CircleCheck
            className="size-[18px] shrink-0 text-emerald-600"
            strokeWidth={2}
            aria-hidden
          />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "rounded-none border border-stone-300/90 bg-[#f7f2e8] text-stone-900 shadow-lg",
          title: "font-medium text-stone-900",
          description: "text-stone-600",
          closeButton:
            "rounded-none border border-stone-300 bg-[#f7f2e8] text-stone-700 hover:bg-stone-200/80",
          success:
            "rounded-none border border-stone-300/90 bg-[#f7f2e8] text-stone-900",
        },
      }}
    />
  )
}
