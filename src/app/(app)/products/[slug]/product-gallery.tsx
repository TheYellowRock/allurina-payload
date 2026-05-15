"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useCallback, useLayoutEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

const SWIPE_THRESHOLD_PX = 12
const PDP_MAIN_SIZES = "(max-width: 768px) 100vw, 50vw"
const PDP_THUMB_SIZES = "4.5rem"

type GalleryImage = { src: string; alt: string }

export function ProductGallery({
  images,
  productTitle,
}: {
  images: GalleryImage[]
  productTitle: string
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const pointerDown = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)

  const updateIndexFromScroll = useCallback(() => {
    const el = scrollerRef.current
    if (!el || !images.length) return
    const w = el.clientWidth
    if (w <= 0) return
    const i = Math.round(el.scrollLeft / w)
    setActiveIndex(Math.max(0, Math.min(i, images.length - 1)))
  }, [images.length])

  const imageKey = images.map((i) => i.src).join("|")

  useLayoutEffect(() => {
    const el = scrollerRef.current
    if (el) el.scrollLeft = 0
    setActiveIndex(0)
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

  if (images.length === 0) {
    return (
      <div className="flex aspect-4/5 w-full items-center justify-center bg-stone-100 text-sm font-light text-stone-500">
        Aucune image
      </div>
    )
  }

  if (images.length === 1) {
    const only = images[0]
    return (
      <div className="relative aspect-4/5 w-full min-w-0 overflow-hidden bg-stone-50 md:min-h-[min(70vh,36rem)]">
        <Image
          src={only.src}
          alt={only.alt || productTitle}
          fill
          priority
          fetchPriority="high"
          sizes={PDP_MAIN_SIZES}
          className="object-cover"
          style={{ objectPosition: "center" }}
          draggable={false}
        />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:gap-5">
      {/* Thumbnails — desktop only (mobile: swipe + dots, no tiny targets) */}
      <div className="hidden min-w-0 shrink-0 md:flex md:w-19 md:flex-col md:gap-2.5 md:overflow-y-auto md:overflow-x-hidden md:pt-0.5">
        {images.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            type="button"
            onClick={() => scrollToIndex(i)}
            aria-label={`Voir l’image ${i + 1}`}
            aria-current={i === activeIndex ? "true" : undefined}
            className={cn(
              "relative shrink-0 overflow-hidden border bg-white transition-colors",
              i === activeIndex
                ? "border-stone-900 ring-1 ring-stone-900"
                : "border-stone-200 hover:border-stone-400",
            )}
          >
            <span className="relative block aspect-square size-18">
              <Image
                src={img.src}
                alt=""
                fill
                sizes={PDP_THUMB_SIZES}
                className="object-cover"
                draggable={false}
              />
            </span>
          </button>
        ))}
      </div>

      <div
        className="group/gallery relative min-w-0 w-full flex-1 touch-manipulation overflow-hidden bg-stone-50 md:min-h-[min(70vh,36rem)]"
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
          className={cn(
            "flex aspect-4/5 w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain",
            "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {images.map((img, i) => (
            <div
              key={img.src}
              className="relative h-full min-h-0 min-w-full shrink-0 snap-start snap-always"
            >
              <Image
                src={img.src}
                alt={img.alt || `${productTitle} — visuel ${i + 1}`}
                fill
                priority={i === 0}
                fetchPriority={i === 0 ? "high" : "low"}
                sizes={PDP_MAIN_SIZES}
                className="pointer-events-none object-cover select-none"
                style={{ objectPosition: "center" }}
                draggable={false}
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5 px-2 md:bottom-4">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Image ${i + 1} sur ${images.length}`}
              aria-current={i === activeIndex ? true : undefined}
              className={cn(
                "pointer-events-auto h-2 min-h-0 min-w-0 rounded-full p-0 transition-all duration-200 md:h-1.5",
                i === activeIndex ? "w-6 bg-stone-900 md:w-5" : "w-2 bg-white/90 ring-1 ring-stone-900/30 md:w-1.5",
              )}
              onClick={(e) => {
                e.stopPropagation()
                scrollToIndex(i)
              }}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-12 items-center justify-start pl-2 md:flex">
          <button
            type="button"
            aria-label="Image précédente"
            disabled={activeIndex <= 0}
            className={cn(
              "pointer-events-auto flex size-9 items-center justify-center rounded-full border border-stone-200/90 bg-white/90 text-stone-800 shadow-sm backdrop-blur-sm transition-opacity",
              "opacity-0 group-hover/gallery:opacity-100",
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
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden w-12 items-center justify-end pr-2 md:flex">
          <button
            type="button"
            aria-label="Image suivante"
            disabled={activeIndex >= images.length - 1}
            className={cn(
              "pointer-events-auto flex size-9 items-center justify-center rounded-full border border-stone-200/90 bg-white/90 text-stone-800 shadow-sm backdrop-blur-sm transition-opacity",
              "opacity-0 group-hover/gallery:opacity-100",
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
    </div>
  )
}
