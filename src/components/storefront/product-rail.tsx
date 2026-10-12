"use client"

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Children, useRef, type ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Horizontal product carousel for the homepage. On phones one large card fills ~80% of
 * the screen with the next one peeking (an invitation to swipe, and one scarf at a time
 * instead of a colour wall); four across with arrows on desktop. A "Voir plus" tile ends
 * the scroll. Cards are passed as children, one per slide.
 */
export function ProductRail({
  id,
  kicker,
  title,
  viewMoreHref,
  viewMoreLabel,
  className,
  children,
}: {
  id?: string
  kicker?: string
  title: string
  viewMoreHref: string
  viewMoreLabel: string
  className?: string
  children: ReactNode
}) {
  const scroller = useRef<HTMLUListElement>(null)
  const slides = Children.toArray(children)
  if (slides.length === 0) return null

  const scrollBy = (dir: -1 | 1) => {
    const el = scroller.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" })
  }

  const slideClass =
    "w-[78vw] max-w-80 shrink-0 snap-start sm:w-64 lg:w-[calc((100%-3.75rem)/4)] lg:max-w-none"

  return (
    <section id={id} className={cn("scroll-mt-28 py-10 md:py-14", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-5 md:px-6">
        <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
          <div>
            {kicker ? (
              <p className="text-[10px] font-medium tracking-[0.3em] text-stone-500 uppercase">{kicker}</p>
            ) : null}
            <h2 className="mt-1.5 text-[13px] font-medium tracking-[0.28em] text-stone-900 uppercase md:text-sm">
              {title}
            </h2>
          </div>
          <Link
            href={viewMoreHref}
            className="text-[11px] tracking-[0.16em] text-stone-900 uppercase underline underline-offset-[5px] md:hidden"
          >
            Tout voir
          </Link>
          <div className="hidden gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="flex size-9 items-center justify-center rounded-full border border-stone-300 text-stone-800 hover:border-stone-900"
              aria-label="Précédent"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="flex size-9 items-center justify-center rounded-full border border-stone-300 text-stone-800 hover:border-stone-900"
              aria-label="Suivant"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <ul
          ref={scroller}
          className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto scroll-px-4 px-4 pb-2 [scrollbar-width:none] sm:-mx-5 sm:gap-4 sm:scroll-px-5 sm:px-5 md:-mx-6 md:scroll-px-6 md:px-6 lg:gap-5 [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, i) => (
            <li key={i} className={slideClass}>
              {slide}
            </li>
          ))}
          <li className={slideClass}>
            <Link
              href={viewMoreHref}
              className="group flex aspect-3/4 w-full flex-col items-center justify-center gap-4 bg-[#efece6] px-4 text-center text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
            >
              <span className="flex size-12 items-center justify-center rounded-full border border-current transition-transform group-hover:translate-x-1">
                <ArrowRight className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="text-[11px] tracking-[0.22em] uppercase">{viewMoreLabel}</span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}
