import { existsSync, readdirSync } from "fs"
import path from "path"
import { getFileByPath } from "payload"
import type { Payload } from "payload"

type Id = number | string

async function findIdBySlug(
  payload: Payload,
  collection: "categories" | "collections" | "tags" | "availability-tags",
  slug: string,
): Promise<Id | null> {
  const res = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return res.docs[0]?.id ?? null
}

async function ensureCategory(
  payload: Payload,
  row: { name: string; slug: string; description: string },
): Promise<Id> {
  const existing = await findIdBySlug(payload, "categories", row.slug)
  if (existing !== null) return existing
  const doc = await payload.create({
    collection: "categories",
    data: {
      name: row.name,
      slug: row.slug,
      description: row.description,
    },
  })
  return doc.id
}

async function ensureCatalogCollection(
  payload: Payload,
  row: { name: string; slug: string; description: string },
): Promise<Id> {
  const existing = await findIdBySlug(payload, "collections", row.slug)
  if (existing !== null) return existing
  const doc = await payload.create({
    collection: "collections",
    data: {
      name: row.name,
      slug: row.slug,
      description: row.description,
    },
  })
  return doc.id
}

async function ensureTag(
  payload: Payload,
  row: { name: string; slug: string; description?: string },
): Promise<Id> {
  const existing = await findIdBySlug(payload, "tags", row.slug)
  if (existing !== null) return existing
  const doc = await payload.create({
    collection: "tags",
    data: {
      name: row.name,
      slug: row.slug,
      description: row.description,
    },
  })
  return doc.id
}

async function ensureAvailabilityTag(
  payload: Payload,
  row: { name: string; slug: string; status: string },
): Promise<Id> {
  const existing = await findIdBySlug(payload, "availability-tags", row.slug)
  if (existing !== null) return existing
  const doc = await payload.create({
    collection: "availability-tags",
    data: {
      name: row.name,
      slug: row.slug,
      status: row.status,
    },
  })
  return doc.id
}

function listSeedImagePaths(assetsRoot: string): string[] {
  const dir = assetsRoot
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .map((f) => path.join(dir, f))
}

async function buildMediaPool(
  payload: Payload,
  assetsRoot: string,
): Promise<Id[]> {
  const paths = listSeedImagePaths(assetsRoot)
  const ids: Id[] = []
  let i = 0
  for (const filePath of paths) {
    const base = path.basename(filePath)
    const existing = await payload.find({
      collection: "media",
      where: { alt: { equals: `seed:${base}` } },
      limit: 1,
    })
    if (existing.docs[0]) {
      ids.push(existing.docs[0].id)
      continue
    }
    try {
      const file = await getFileByPath(filePath)
      const doc = await payload.create({
        collection: "media",
        data: { alt: `seed:${base}` },
        file,
      })
      ids.push(doc.id)
      i += 1
      console.log(`[seed] media ${i}: ${base}`)
    } catch (e) {
      console.warn(`[seed] skip media ${base}:`, e)
    }
  }
  return ids
}

async function upsertScarf(
  payload: Payload,
  data: Record<string, unknown>,
): Promise<void> {
  const slug = String(data.slug)
  const found = await payload.find({
    collection: "scarves",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  if (found.docs[0]) {
    await payload.update({
      collection: "scarves",
      id: found.docs[0].id,
      data: data as never,
    })
    console.log(`[seed] update scarf ${slug}`)
  } else {
    await payload.create({
      collection: "scarves",
      data: data as never,
    })
    console.log(`[seed] create scarf ${slug}`)
  }
}

function pickImageId(mediaIds: Id[], index: number): Id | undefined {
  if (mediaIds.length === 0) return undefined
  return mediaIds[index % mediaIds.length]
}

/**
 * Seeds categories, collections (merchandising), pattern/solid tags, availability tags,
 * and 15 demo scarves (upsert by slug). Optional images from `assets/`.
 */
export async function seedAllurinaCatalog(
  payload: Payload,
  options?: { assetsRoot?: string },
): Promise<{ scarfCount: number }> {
  const assetsRoot = options?.assetsRoot ?? path.join(process.cwd(), "assets")

  const categoryRows = [
    {
      name: "Châles en crêpe",
      slug: "chales-en-crepe",
      description: "Châles au tombé fluide et à la texture crêpe.",
    },
    {
      name: "Châles en fil de lin",
      slug: "chales-en-fil-de-lin",
      description: "Lin naturel, respirant et élégant.",
    },
    {
      name: "Châles en mousseline",
      slug: "chales-en-mousseline",
      description: "Mousseline légère et aérienne.",
    },
    {
      name: "Châles en satin",
      slug: "chales-en-satin",
      description: "Satin souple, fini lumineux et tombé fluide.",
    },
    {
      name: "Châles à motifs",
      slug: "chales-a-motifs",
      description: "Imprimés, carrés décorés et motifs variés.",
    },
    {
      name: "Châles unis",
      slug: "chales-unis",
      description: "Couleurs unies, intemporelles.",
    },
  ]

  const catIds: Record<string, Id> = {}
  for (const row of categoryRows) {
    catIds[row.slug] = await ensureCategory(payload, row)
  }

  const collectionRows = [
    {
      name: "Automne",
      slug: "automne",
      description: "Tons chauds et textures de saison.",
    },
    {
      name: "Outlet",
      slug: "outlet",
      description: "Dernières pièces et bonnes affaires.",
    },
    {
      name: "Essentiels",
      slug: "essentiels",
      description: "Pièces intemporelles du quotidien.",
    },
    {
      name: "Capsule Riad",
      slug: "capsule-riad",
      description: "Inspirations architecture et couleurs du Maroc.",
    },
    {
      name: "Nouvelle saison",
      slug: "nouvelle-saison",
      description: "Sélection fraîchement mise en avant.",
    },
  ]

  const collIds: Record<string, Id> = {}
  for (const row of collectionRows) {
    collIds[row.slug] = await ensureCatalogCollection(payload, row)
  }

  const collectionRotation = [
    "automne",
    "outlet",
    "essentiels",
    "capsule-riad",
    "nouvelle-saison",
  ] as const
  const tagPattern = await ensureTag(payload, {
    name: "À motifs",
    slug: "pattern",
    description: "Châles à motifs (imprimés, géométriques, floraux…).",
  })
  const tagSolid = await ensureTag(payload, {
    name: "Unis",
    slug: "solid",
    description: "Châles unis ou quasi-unis.",
  })

  const avInStock = await ensureAvailabilityTag(payload, {
    name: "Disponible",
    slug: "disponible",
    status: "in_stock",
  })
  const avLow = await ensureAvailabilityTag(payload, {
    name: "Stock limité",
    slug: "stock-limite",
    status: "low_stock",
  })
  const avOut = await ensureAvailabilityTag(payload, {
    name: "Rupture",
    slug: "rupture",
    status: "out_of_stock",
  })
  const avPre = await ensureAvailabilityTag(payload, {
    name: "Précommande",
    slug: "precommande",
    status: "pre_order",
  })

  const mediaIds = await buildMediaPool(payload, assetsRoot)
  if (mediaIds.length === 0) {
    console.log(
      "[seed] No images in /assets — scarves seed without featuredImage. Add .png/.jpg to ./assets and re-run.",
    )
  }

  type ScarfSeed = {
    slug: string
    title: string
    price: number
    stockQuantity: number
    lowStockThreshold: number
    categorySlug: string
    tagIds: Id[]
    availabilityTagIds: Id[]
    idx: number
  }

  const scarves: ScarfSeed[] = [
    {
      slug: "chale-crepe-marine-uni",
      title: "Châle en crêpe marine uni",
      price: 42,
      stockQuantity: 22,
      lowStockThreshold: 5,
      categorySlug: "chales-en-crepe",
      tagIds: [tagSolid],
      availabilityTagIds: [avInStock],
      idx: 0,
    },
    {
      slug: "chale-crepe-sable-rose",
      title: "Châle en crêpe sable rosé",
      price: 39,
      stockQuantity: 3,
      lowStockThreshold: 5,
      categorySlug: "chales-en-crepe",
      tagIds: [tagSolid],
      availabilityTagIds: [avInStock, avLow],
      idx: 1,
    },
    {
      slug: "chale-crepe-rayures-fines",
      title: "Châle en crêpe à fines rayures",
      price: 44,
      stockQuantity: 18,
      lowStockThreshold: 5,
      categorySlug: "chales-en-crepe",
      tagIds: [tagPattern],
      availabilityTagIds: [avInStock],
      idx: 2,
    },
    {
      slug: "chale-lin-naturel-ecru",
      title: "Châle en lin naturel écru",
      price: 55,
      stockQuantity: 12,
      lowStockThreshold: 5,
      categorySlug: "chales-en-fil-de-lin",
      tagIds: [tagSolid],
      availabilityTagIds: [avInStock],
      idx: 3,
    },
    {
      slug: "chale-lin-bleu-horizon-precommande",
      title: "Châle en lin bleu horizon",
      price: 58,
      stockQuantity: 0,
      lowStockThreshold: 5,
      categorySlug: "chales-en-fil-de-lin",
      tagIds: [tagSolid],
      availabilityTagIds: [avPre],
      idx: 4,
    },
    {
      slug: "chale-lin-raye-ivoire",
      title: "Châle en lin rayé ivoire",
      price: 52,
      stockQuantity: 7,
      lowStockThreshold: 5,
      categorySlug: "chales-en-fil-de-lin",
      tagIds: [tagPattern],
      availabilityTagIds: [avInStock],
      idx: 5,
    },
    {
      slug: "chale-mousseline-caramel-uni",
      title: "Voile mousseline caramel uni",
      price: 32,
      stockQuantity: 30,
      lowStockThreshold: 5,
      categorySlug: "chales-en-mousseline",
      tagIds: [tagSolid],
      availabilityTagIds: [avInStock],
      idx: 6,
    },
    {
      slug: "chale-mousseline-fleuri-rose",
      title: "Mousseline fleurie rose",
      price: 36,
      stockQuantity: 4,
      lowStockThreshold: 5,
      categorySlug: "chales-en-mousseline",
      tagIds: [tagPattern],
      availabilityTagIds: [avInStock],
      idx: 7,
    },
    {
      slug: "chale-mousseline-indigo-uni",
      title: "Mousseline indigo légère",
      price: 34,
      stockQuantity: 45,
      lowStockThreshold: 5,
      categorySlug: "chales-en-mousseline",
      tagIds: [tagSolid],
      availabilityTagIds: [avInStock],
      idx: 8,
    },
    {
      slug: "chale-motifs-cachemire-bleu",
      title: "Châle à motifs cachemire bleu",
      price: 48,
      stockQuantity: 20,
      lowStockThreshold: 5,
      categorySlug: "chales-a-motifs",
      tagIds: [tagPattern],
      availabilityTagIds: [avInStock],
      idx: 9,
    },
    {
      slug: "chale-motifs-paisley-terracotta",
      title: "Grand carré paisley terracotta",
      price: 46,
      stockQuantity: 2,
      lowStockThreshold: 5,
      categorySlug: "chales-a-motifs",
      tagIds: [tagPattern],
      availabilityTagIds: [avInStock],
      idx: 10,
    },
    {
      slug: "chale-motifs-baroque-or-bleu",
      title: "Carré baroque or et bleu",
      price: 51,
      stockQuantity: 0,
      lowStockThreshold: 5,
      categorySlug: "chales-a-motifs",
      tagIds: [tagPattern],
      availabilityTagIds: [avOut],
      idx: 11,
    },
    {
      slug: "chale-uni-bordeaux",
      title: "Châle uni bordeaux intense",
      price: 38,
      stockQuantity: 50,
      lowStockThreshold: 5,
      categorySlug: "chales-unis",
      tagIds: [tagSolid],
      availabilityTagIds: [avInStock],
      idx: 12,
    },
    {
      slug: "chale-uni-olive",
      title: "Châle uni olive profond",
      price: 38,
      stockQuantity: 8,
      lowStockThreshold: 5,
      categorySlug: "chales-unis",
      tagIds: [tagSolid],
      availabilityTagIds: [avInStock],
      idx: 13,
    },
    {
      slug: "chale-uni-ivoire-precommande",
      title: "Châle uni ivoire classique",
      price: 40,
      stockQuantity: 0,
      lowStockThreshold: 5,
      categorySlug: "chales-unis",
      tagIds: [tagSolid],
      availabilityTagIds: [avPre],
      idx: 14,
    },
    {
      slug: "chale-satin-champagne-uni",
      title: "Châle en satin champagne uni",
      price: 41,
      stockQuantity: 16,
      lowStockThreshold: 5,
      categorySlug: "chales-en-satin",
      tagIds: [tagSolid],
      availabilityTagIds: [avInStock],
      idx: 15,
    },
    {
      slug: "chale-satin-nuit-fonce",
      title: "Châle en satin bleu nuit",
      price: 43,
      stockQuantity: 11,
      lowStockThreshold: 5,
      categorySlug: "chales-en-satin",
      tagIds: [tagSolid],
      availabilityTagIds: [avInStock],
      idx: 16,
    },
    {
      slug: "chale-satin-motif-cachemire",
      title: "Carré satin motif cachemire",
      price: 45,
      stockQuantity: 5,
      lowStockThreshold: 5,
      categorySlug: "chales-en-satin",
      tagIds: [tagPattern],
      availabilityTagIds: [avInStock],
      idx: 17,
    },
  ]

  let n = 0
  for (const s of scarves) {
    const catId = catIds[s.categorySlug]
    if (!catId) throw new Error(`Missing category ${s.categorySlug}`)

    const collSlug = collectionRotation[s.idx % collectionRotation.length]
    const collId = collIds[collSlug]
    if (!collId) throw new Error(`Missing collection ${collSlug}`)

    const featuredImage = pickImageId(mediaIds, s.idx)
    const extraA = pickImageId(mediaIds, s.idx + 1)
    const extraB = pickImageId(mediaIds, s.idx + 2)
    const galleryImages = [extraA, extraB]
      .filter((id): id is Id => id != null && id !== featuredImage)
      .filter((id, i, arr) => arr.indexOf(id) === i)

    await upsertScarf(payload, {
      title: s.title,
      slug: s.slug,
      price: s.price,
      stockQuantity: s.stockQuantity,
      lowStockThreshold: s.lowStockThreshold,
      categories: [catId],
      collections: [collId],
      tags: s.tagIds,
      availabilityTags: s.availabilityTagIds,
      ...(featuredImage ? { featuredImage } : {}),
      ...(galleryImages.length > 0 ? { galleryImages } : {}),
    })
    n += 1
  }

  console.log(`[seed] done: ${n} scarves; categories, collections & tags ensured.`)
  return { scarfCount: n }
}
