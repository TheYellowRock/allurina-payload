"use client"

import { CircleCheck } from "lucide-react"
import { Toaster } from "sonner"

/** Sepia / crème ; succès vert uniquement sur l’icône ; coins vifs, sans bouton fermer. */
export function CartToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton={false}
      icons={{
        success: (
          <CircleCheck
            className="size-4.5 shrink-0 text-emerald-600"
            strokeWidth={2}
            aria-hidden
          />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "rounded-none border border-[#c4b08f]/75 bg-[#f0e4d4] p-4 text-[#2a2218] shadow-[0_6px_28px_rgba(45,35,20,0.14)]",
          title:
            "text-sm font-medium uppercase tracking-[0.2em] text-[#2a2218]",
          description: "text-[#4a3f32] uppercase tracking-wide",
          icon: "rounded-none bg-transparent",
          content: "rounded-none",
          success:
            "rounded-none border-[#c4b08f]/75 bg-[#f0e4d4] text-[#2a2218]",
        },
      }}
    />
  )
}
