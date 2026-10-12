import { NextResponse } from "next/server"

import { getStaffUser } from "@/lib/studio/getStaffUser"

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"])
// The editor resizes photos in the browser first (~1600 px WebP, a few hundred KB);
// Vercel rejects request bodies above ~4.5 MB anyway.
const MAX_BYTES = 4 * 1024 * 1024

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }

/**
 * Phone photos often share names (IMG_0001.jpg) and several upload in parallel: Payload's
 * own "rename on conflict" isn't safe under that race, so every upload gets a unique name.
 */
function uniqueFileName(original: string, type: string): string {
  const base =
    (original || "photo")
      .replace(/\.[^.]+$/, "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 40) || "photo"
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  return `${base}-${suffix}.${EXT[type] ?? "jpg"}`
}

/** Upload one product photo from the Studio quick editor into `media`. */
export async function POST(req: Request) {
  const { user, payload } = await getStaffUser()
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 })

  const form = await req.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier." }, { status: 400 })
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Format non accepté (JPG, PNG ou WebP)." }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Photo trop lourde (4 Mo max)." }, { status: 400 })

  const title = typeof form?.get("title") === "string" ? String(form?.get("title")).trim() : ""

  try {
    const doc = await payload.create({
      collection: "media",
      // Replaced by `Allurina scarf - "<titre>"` when the product is saved (syncScarfMediaAlt).
      data: { alt: title ? `Allurina scarf - "${title}"` : "Allurina scarf" },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: uniqueFileName(file.name, file.type),
        size: file.size,
      },
      overrideAccess: true,
    })
    const d = doc as { id: unknown; url?: unknown }
    return NextResponse.json({ id: Number(d.id), url: typeof d.url === "string" ? d.url : null })
  } catch (e) {
    console.error("[studio media POST]", e)
    return NextResponse.json({ error: "Envoi de la photo impossible." }, { status: 500 })
  }
}
