"use client"

import { Plus_Jakarta_Sans } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { TOUTES_LES_PIECES_PATH } from "@/lib/routes"
import { cn } from "@/lib/utils"

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
})

const ROTATE_MS = 5000

const slides = [
  {
    src: "/hero/boutique.png",
    alt: "Modèle en boutique AllurinaScarf, foulard fleuri et présentoirs de châles",
    kicker: "Nouveautés",
    title: "Matières & couleurs",
  },
  {
    src: "/hero/courtyard.png",
    alt: "Modèle dans un riad marocain, hijab à motifs et architecture zellige",
    kicker: "Inspirations",
    title: "L’élégance modeste",
  },
] as const

/** Near-lossless for full-bleed hero photography (allowlisted in `next.config` `images.qualities`). */
const HERO_IMAGE_QUALITY = 95

/** Promo strip (~40px) + compact header row — keeps hero from underlapping chrome on small phones */
const heroMinHeight =
  "min-h-[min(92dvh,calc(100dvh-7.5rem))] sm:min-h-[min(90dvh,calc(100dvh-6.5rem))] md:min-h-[min(88svh,calc(100svh-6rem))] lg:min-h-[calc(100svh-5.25rem)]"

export function HeroBanner() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      ROTATE_MS,
    )
    return () => window.clearInterval(id)
  }, [])

  return (
    <section
      className={cn(
        sans.className,
        "relative w-full overflow-hidden border-b border-stone-200/80",
      )}
    >
      <div className={cn("relative w-full", heroMinHeight)}>
        {slides.map((slide, index) => {
          const isOn = index === active
          return (
            <div
              key={slide.src}
              className={cn(
                "absolute inset-0 touch-manipulation transition-opacity duration-700 ease-out",
                isOn ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none",
              )}
              aria-hidden={!isOn}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : "low"}
                quality={HERO_IMAGE_QUALITY}
                sizes="100vw"
                className="object-cover object-[62%_22%] sm:object-center"
              />
              {/* Mobile: bottom-heavy scrim for stacked copy; md+: left-to-right */}
              <div
                className="absolute inset-0 bg-linear-to-t from-black/70 via-black/35 to-black/25 md:bg-linear-to-r md:from-black/55 md:via-black/28 md:to-transparent"
                aria-hidden
              />
              <div
                className={cn(
                  "group/hero absolute inset-0 flex max-w-xl flex-col justify-end text-left sm:max-w-2xl",
                  "px-4 pb-[max(5rem,env(safe-area-inset-bottom,0px)+3rem)] pt-16 sm:px-6 sm:pb-24 sm:pt-20",
                  "md:justify-center md:pb-28 md:pl-10 md:pr-8 md:pt-24 lg:max-w-2xl lg:pl-14 lg:pr-10",
                )}
              >
                <p
                  className={cn(
                    "text-[10px] font-semibold tracking-[0.28em] text-white/75 uppercase transition-colors duration-300",
                    "sm:text-[11px] sm:tracking-[0.35em]",
                    "group-hover/hero:text-white",
                  )}
                >
                  {slide.kicker}
                </p>
                <h1
                  className={cn(
                    "mt-2 text-balance text-[1.65rem] font-semibold leading-[1.12] tracking-tight text-white drop-shadow-sm transition-[color,text-shadow] duration-300 sm:mt-3 sm:text-4xl md:text-5xl lg:text-6xl",
                    "group-hover/hero:text-white group-hover/hero:drop-shadow-[0_2px_28px_rgba(0,0,0,0.55)]",
                  )}
                >
                  {slide.title}
                </h1>
                <div className="mt-6 sm:mt-8">
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "h-11 min-h-11 w-full rounded-none border-2 border-white bg-white px-6 text-sm font-semibold tracking-wide text-stone-950 shadow-none transition-colors duration-200 sm:w-auto sm:px-8",
                      "hover:border-stone-950 hover:bg-stone-950 hover:text-white",
                      "focus-visible:border-white focus-visible:ring-2 focus-visible:ring-white/40",
                    )}
                    asChild
                  >
                    <Link href={TOUTES_LES_PIECES_PATH}>Découvrir la collection</Link>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        <div
          className={cn(
            "absolute z-20 flex gap-1 sm:gap-2",
            "bottom-[max(1rem,env(safe-area-inset-bottom,0px)+0.5rem)] left-4 sm:bottom-6 sm:left-6 md:left-10 lg:left-14",
          )}
          role="tablist"
          aria-label="Diaporama"
        >
          {slides.map((_, index) => (
            <button
              key={String(index)}
              type="button"
              role="tab"
              aria-selected={index === active}
              className={cn(
                "flex min-h-10 min-w-10 items-center justify-center rounded-none p-0 transition-colors touch-manipulation sm:min-h-9 sm:min-w-9",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80",
              )}
              onClick={() => setActive(index)}
            >
              <span
                className={cn(
                  "block h-1 w-7 bg-white/35 transition-colors sm:h-1.5 sm:w-8",
                  index === active ? "bg-white" : "hover:bg-white/60",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
