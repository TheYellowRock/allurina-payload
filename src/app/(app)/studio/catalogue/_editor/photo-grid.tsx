"use client"

import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star, X } from "lucide-react"
import { useRef } from "react"

import type { EditorImage } from "@/lib/catalog/editor-types"
import { cn } from "@/lib/utils"

import type { PendingUpload } from "./use-photo-uploads"

/** A reorderable photo grid with an "Ajouter" tile. The first photo is the main one. */
export function PhotoGrid({
  images,
  onChange,
  pending,
  onAddFiles,
  onDismissUpload,
  mainLabel = "Principale",
}: {
  images: EditorImage[]
  onChange: (images: EditorImage[]) => void
  pending: PendingUpload[]
  onAddFiles: (files: FileList | null) => void
  onDismissUpload: (key: string) => void
  mainLabel?: string
}) {
  const fileInput = useRef<HTMLInputElement>(null)

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target]!, next[index]!]
    onChange(next)
  }
  const makeMain = (index: number) => {
    const next = [...images]
    const [img] = next.splice(index, 1)
    onChange(img ? [img, ...next] : next)
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {images.map((img, i) => (
        <div key={img.id} className="relative aspect-square overflow-hidden border border-stone-200 bg-stone-100">
          {img.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage URL, no Next image config needed here
            <img src={img.url} alt="" className="size-full object-cover" />
          ) : null}
          {i === 0 ? (
            <span className="absolute top-1 left-1 bg-stone-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              {mainLabel}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onChange(images.filter((_, j) => j !== i))}
            className="absolute top-1 right-1 flex size-8 items-center justify-center bg-white/90 text-stone-800"
            aria-label="Retirer la photo"
          >
            <X className="size-4" />
          </button>
          <div className="absolute inset-x-0 bottom-0 flex justify-between bg-white/85">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="flex h-8 flex-1 items-center justify-center disabled:opacity-30"
              aria-label="Déplacer à gauche"
            >
              <ChevronLeft className="size-4" />
            </button>
            {i !== 0 ? (
              <button
                type="button"
                onClick={() => makeMain(i)}
                className="flex h-8 flex-1 items-center justify-center"
                aria-label="Mettre en premier"
              >
                <Star className="size-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === images.length - 1}
              className="flex h-8 flex-1 items-center justify-center disabled:opacity-30"
              aria-label="Déplacer à droite"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ))}

      {pending.map((u) => (
        <div
          key={u.key}
          className={cn(
            "relative flex aspect-square flex-col items-center justify-center gap-1 border p-2 text-center text-[11px]",
            u.error ? "border-red-300 bg-red-50 text-red-700" : "border-stone-200 bg-stone-50 text-stone-500",
          )}
        >
          {u.error ? (
            <>
              <span className="line-clamp-3">{u.error}</span>
              <button type="button" onClick={() => onDismissUpload(u.key)} className="underline">
                Fermer
              </button>
            </>
          ) : (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Envoi…
            </>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="flex aspect-square flex-col items-center justify-center gap-1.5 border border-dashed border-stone-400 bg-white text-xs font-medium text-stone-600 hover:border-stone-900 hover:text-stone-900"
      >
        <ImagePlus className="size-6" aria-hidden />
        Ajouter
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onAddFiles(e.target.files)
          e.target.value = ""
        }}
      />
    </div>
  )
}
