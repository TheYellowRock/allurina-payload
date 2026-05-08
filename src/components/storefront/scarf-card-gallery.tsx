"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useLayoutEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type ImageEntry = { src: string; alt: string }

const SWIPE_THRESHOLD_PX = 12

export function ScarfCardGallery({
  images,
  productHref,
  productTitle,
  onActiveIndexChange,
}: {
  images: ImageEntry[]
  productHref: string
  productTitle: string
  onActiveIndexChange?: (index: number) => void
}) {
  const router = useRouter()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const pointerDown = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)

  const onSlideChangeRef = useRef(onActiveIndexChange)
  onSlideChangeRef.current = onActiveIndexChange

  const updateIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || !images.length) return
    const w = el.clientWidth
    if (w <= 0) return
    const i = Math.round(el.scrollLeft / w)
    const clamped = Math.max(0, Math.min(i, images.length - 1))
    setActiveIndex(clamped)
    onSlideChangeRef.current?.(clamped)
  }, [images.length])

  const imageKey = images.map((i) => i.src).join("|")

  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollLeft = 0
    setActiveIndex(0)
    onSlideChangeRef.current?.(0)
  }, [imageKey])

  useLayoutEffect(() => {
    updateIndexFromScroll()
  }, [updateIndexFromScroll, imageKey])

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollerRef.current
      if (!el || !images.length) return
      const clamped = Math.max(0, Math.min(index, images.length - 1))
      el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" })
    },
    [images.length],
  )

  const scrollByDir = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" })
  }, [])

  const maybeNavigate = useCallback(() => {
    if (moved.current) return
    router.push(productHref)
  }, [productHref, router])

  if (!images.length) {
    return (
      <div className="flex h-full min-h-40 items-center justify-center text-sm font-light text-muted-foreground">
        Sans visuel
      </div>
    )
  }

  if (images.length === 1) {
    const only = images[0]
    return (
      <button
        type="button"
        className="relative block size-full min-h-0 cursor-pointer border-0 bg-transparent p-0 text-left"
        aria-label={`Voir ${productTitle}`}
        onClick={() => router.push(productHref)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={only.src}
          alt={only.alt}
          className="size-full object-contain object-center"
          sizes="(max-width: 1024px) 50vw, 33vw"
          draggable={false}
        />
      </button>
    )
  }

  return (
    <div
      className="group/gallery relative h-full min-h-0 min-w-0 overflow-hidden bg-transparent"
      role="region"
      aria-roledescription="carrousel"
      aria-label={`Photos de ${productTitle} — glisser pour parcourir`}
    >
      <div
        ref={scrollerRef}
        onScroll={updateIndexFromScroll}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          pointerDown.current = { x: e.clientX, y: e.clientY }
          moved.current = false
        }}
        onPointerMove={(e) => {
          if (!pointerDown.current) return
          const dx = Math.abs(e.clientX - pointerDown.current.x)
          const dy = Math.abs(e.clientY - pointerDown.current.y)
          if (dx > SWIPE_THRESHOLD_PX || dy > SWIPE_THRESHOLD_PX) moved.current = true
        }}
        onPointerUp={() => {
          pointerDown.current = null
        }}
        onPointerCancel={() => {
          pointerDown.current = null
        }}
        onClick={() => maybeNavigate()}
        className={cn(
          "flex h-full touch-manipulation snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        {images.map((img) => (
          <div
            key={img.src}
            className="relative h-full min-w-full shrink-0 snap-start snap-always"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              className="pointer-events-none size-full object-contain object-center select-none"
              sizes="(max-width: 1024px) 50vw, 33vw"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5 px-2"
      >
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Image ${i + 1} sur ${images.length}`}
            aria-current={i === activeIndex ? true : undefined}
            className={cn(
              "pointer-events-auto h-1.5 min-h-0 min-w-0 rounded-full p-0 transition-all duration-200",
              i === activeIndex ? "w-5 bg-stone-900" : "w-1.5 bg-stone-100/90 ring-1 ring-stone-900/25",
            )}
            onClick={(e) => {
              e.stopPropagation()
              scrollToIndex(i)
            }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-10 items-center justify-start pl-1 md:flex">
        <button
          type="button"
          aria-label="Image précédente"
          disabled={activeIndex <= 0}
          className={cn(
            "pointer-events-auto flex size-8 items-center justify-center rounded-full border border-stone-200/90 bg-white/90 text-stone-800 shadow-sm backdrop-blur-sm transition-opacity",
            "opacity-0 group-hover/card:opacity-100",
            activeIndex <= 0 && "invisible",
          )}
          onClick={(e) => {
            e.stopPropagation()
            scrollByDir(-1)
          }}
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-10 items-center justify-end pr-1 md:flex">
        <button
          type="button"
          aria-label="Image suivante"
          disabled={activeIndex >= images.length - 1}
          className={cn(
            "pointer-events-auto flex size-8 items-center justify-center rounded-full border border-stone-200/90 bg-white/90 text-stone-800 shadow-sm backdrop-blur-sm transition-opacity",
            "opacity-0 group-hover/card:opacity-100",
            activeIndex >= images.length - 1 && "invisible",
          )}
          onClick={(e) => {
            e.stopPropagation()
            scrollByDir(1)
          }}
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
