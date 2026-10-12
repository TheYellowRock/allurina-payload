"use client"

import { useState } from "react"

import type { EditorImage } from "@/lib/catalog/editor-types"
import { prepareProductPhoto } from "@/lib/catalog/resize-image"

/** One photo being sent, shown as a placeholder tile in the grid it was added to. */
export type PendingUpload = { key: string; target: string; error?: string }

/**
 * Photo uploads for the product editor. Each photo is resized in the browser, then sent
 * to `/api/studio/media`, two at a time (fast on 4G, gentle on a phone's memory).
 * `target` says which grid the photo belongs to ("main" or a colour id), so each grid
 * shows only its own pending tiles.
 */
export function usePhotoUploads() {
  const [uploads, setUploads] = useState<PendingUpload[]>([])

  const upload = async (
    files: FileList | File[] | null,
    target: string,
    productTitle: string,
    onUploaded: (image: EditorImage) => void,
  ) => {
    if (!files || files.length === 0) return
    const batch = Array.from(files)
      .slice(0, 20)
      .map((file, i) => ({ key: `${target}-${Date.now()}-${i}`, file }))
    setUploads((u) => [...u, ...batch.map(({ key }) => ({ key, target }))])

    const queue = [...batch]
    const worker = async () => {
      for (let next = queue.shift(); next; next = queue.shift()) {
        const { key, file } = next
        try {
          let prepared: File
          try {
            prepared = await prepareProductPhoto(file)
          } catch {
            prepared = file // Not decodable in this browser (e.g. HEIC): the server checks the type.
          }
          const form = new FormData()
          form.append("file", prepared)
          form.append("title", productTitle)
          const res = await fetch("/api/studio/media", { method: "POST", body: form, credentials: "include" })
          const data = (await res.json().catch(() => ({}))) as { id?: number; url?: string | null; error?: string }
          if (!res.ok || !data.id) throw new Error(data.error ?? "Envoi impossible")
          onUploaded({ id: data.id, url: data.url ?? null })
          setUploads((u) => u.filter((x) => x.key !== key))
        } catch (e) {
          const message = e instanceof Error ? e.message : "Envoi impossible"
          setUploads((u) => u.map((x) => (x.key === key ? { ...x, error: message } : x)))
        }
      }
    }
    await Promise.all([worker(), worker()])
  }

  const dismiss = (key: string) => setUploads((u) => u.filter((x) => x.key !== key))
  const busy = uploads.some((u) => !u.error)

  return { uploads, upload, dismiss, busy }
}
