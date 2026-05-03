"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

export function ProductGallery({
  images,
  productTitle,
}: {
  images: { src: string; alt: string }[]
  productTitle: string
}) {
  const [index, setIndex] = useState(0)

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center bg-stone-100 text-sm font-light text-stone-500">
        Aucune image
      </div>
    )
  }

  const active = images[index] ?? images[0]

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:items-start md:gap-5">
      <div className="flex flex-row gap-2 overflow-x-auto pb-0.5 md:w-[4.75rem] md:flex-col md:gap-2.5 md:overflow-y-auto md:pb-0 md:pt-0.5">
        {images.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Voir l’image ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            className={cn(
              "relative shrink-0 overflow-hidden border bg-white transition-colors",
              i === index
                ? "border-stone-900 ring-1 ring-stone-900"
                : "border-stone-200 hover:border-stone-400",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt=""
              className="aspect-square size-16 object-cover md:size-[4.5rem]"
            />
          </button>
        ))}
      </div>

      <div className="relative aspect-[4/5] w-full flex-1 overflow-hidden bg-stone-50 md:min-h-[min(70vh,36rem)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={active.src}
          alt={active.alt || productTitle}
          className="absolute inset-0 size-full object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          {...(index === 0 ? { fetchPriority: "high" as const } : {})}
        />
      </div>
    </div>
  )
}
