"use client"

import { ArrowLeft, ExternalLink, Minus, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import {
  variantKey,
  type EditorColor,
  type EditorImage,
  type EditorOptions,
  type ProductEditorValues,
  type ProductSavePayload,
} from "@/lib/catalog/editor-types"
import { STUDIO_PATHS, studioDuplicatePath, studioProductPath } from "@/lib/studio/paths"
import { cn } from "@/lib/utils"

import { PhotoGrid } from "./_editor/photo-grid"
import { cardClass, cardTitleClass, Chips, inputClass, labelClass, toggleId } from "./_editor/ui"
import { usePhotoUploads } from "./_editor/use-photo-uploads"
import { VariantSection } from "./_editor/variant-section"

type Props = {
  /** null = new product. */
  productId: number | null
  slug: string | null
  initial: ProductEditorValues
  options: EditorOptions
  /** Shown once after a redirect from a successful save. */
  justSaved?: boolean
}

/**
 * Studio product editor — one page, one Save, built for the phone. Simple products
 * (scarves) have one stock number; products with sizes/colours (pulls) get the
 * size × colour stock grid and a photo gallery per colour.
 */
export function ProductEditor({ productId, slug, initial, options, justSaved }: Props) {
  const router = useRouter()
  const [values, setValues] = useState<ProductEditorValues>(initial)
  const [colors, setColors] = useState<EditorColor[]>(options.colors)
  const [descriptionTouched, setDescriptionTouched] = useState(productId === null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(Boolean(justSaved))
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initial))
  const photos = usePhotoUploads()

  const set = <K extends keyof ProductEditorValues>(key: K, value: ProductEditorValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const dirty = JSON.stringify(values) !== savedSnapshot

  useEffect(() => {
    if (!savedFlash) return
    const t = setTimeout(() => setSavedFlash(false), 2500)
    return () => clearTimeout(t)
  }, [savedFlash])

  // Warn before leaving with unsaved edits or photos still uploading.
  useEffect(() => {
    if (!dirty && !photos.busy) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [dirty, photos.busy])

  const selectedType = options.productTypes.find((t) => t.id === values.productTypeId) ?? null

  // Categories of the chosen type, "all types" ones, and anything already ticked.
  const categoryOptions = useMemo(
    () =>
      options.categories.filter(
        (c) =>
          c.productTypeId == null || c.productTypeId === values.productTypeId || values.categoryIds.includes(c.id),
      ),
    [options.categories, values.productTypeId, values.categoryIds],
  )
  const sizeOptions = useMemo(
    () =>
      options.sizes.filter(
        (s) => s.productTypeId == null || s.productTypeId === values.productTypeId || values.sizeIds.includes(s.id),
      ),
    [options.sizes, values.productTypeId, values.sizeIds],
  )

  const chooseType = (typeId: number) => {
    setValues((v) => {
      // New product: a type that has its own sizes (Pulls) switches on the size × colour grid.
      const typeHasSizes = options.sizes.some((s) => s.productTypeId === typeId)
      return { ...v, productTypeId: typeId, ...(productId === null ? { hasVariants: typeHasSizes } : {}) }
    })
  }

  const addMainPhotos = (files: FileList | null) =>
    void photos.upload(files, "main", values.title, (image) =>
      setValues((v) => ({ ...v, images: [...v.images, image] })),
    )

  const colorImagesOf = (colorId: number): EditorImage[] =>
    values.colorImages.find((c) => c.colorId === colorId)?.images ?? []

  const setColorImages = (colorId: number, images: EditorImage[]) =>
    setValues((v) => ({
      ...v,
      colorImages: [...v.colorImages.filter((c) => c.colorId !== colorId), { colorId, images }],
    }))

  const addColorPhotos = (colorId: number, files: FileList | null) =>
    void photos.upload(files, `color-${colorId}`, values.title, (image) =>
      setValues((v) => {
        const current = v.colorImages.find((c) => c.colorId === colorId)?.images ?? []
        return {
          ...v,
          colorImages: [...v.colorImages.filter((c) => c.colorId !== colorId), { colorId, images: [...current, image] }],
        }
      }),
    )

  // ---------- save ----------
  const buildGrid = () => {
    const rows = options.sizes.filter((s) => values.sizeIds.includes(s.id))
    return rows.flatMap((s) =>
      values.colorIds.map((colorId) => ({
        sizeId: s.id,
        colorId,
        stockQuantity: Number(values.variantStock[variantKey(s.id, colorId)]) || 0,
      })),
    )
  }

  const save = async (thenDuplicate: boolean) => {
    setError(null)
    const price = Number(values.price.replace(",", "."))
    const stock = values.stockQuantity.trim() === "" ? NaN : Number(values.stockQuantity)
    if (values.title.trim().length < 2) return setError("Indiquez un titre.")
    if (!Number.isFinite(price) || price < 0) return setError("Indiquez un prix valide.")
    if (!values.productTypeId) return setError("Choisissez un type de produit.")
    if (!values.hasVariants && (!Number.isInteger(stock) || stock < 0)) return setError("Indiquez le stock (0 ou plus).")

    const grid = values.hasVariants ? buildGrid() : undefined
    if (grid && grid.length === 0) return setError("Choisissez au moins une taille et une couleur.")

    if (grid && productId) {
      // Unticking a size/colour deletes those variants — say so when they still had stock.
      const kept = new Set(grid.map((g) => variantKey(g.sizeId, g.colorId)))
      const lost = Object.entries(initial.variantStock).filter(([k, s]) => !kept.has(k) && Number(s) > 0)
      if (lost.length && !window.confirm(`${lost.length} variante(s) avec du stock seront supprimées. Continuer ?`)) return
    }
    if (values.images.length === 0 && !window.confirm("Aucune photo principale — enregistrer quand même ?")) return

    const body: ProductSavePayload = {
      title: values.title.trim(),
      price,
      stockQuantity: values.hasVariants ? 0 : stock,
      productType: values.productTypeId,
      hasVariants: values.hasVariants,
      imageIds: values.images.map((i) => i.id),
      categories: values.categoryIds,
      collections: values.collectionIds,
      tags: values.tagIds,
      // Only sent when edited, so formatting added in the Payload admin isn't flattened.
      ...(descriptionTouched ? { description: values.description } : {}),
      ...(grid
        ? {
            variants: grid,
            colorImages: values.colorIds
              .map((colorId) => ({ colorId, imageIds: colorImagesOf(colorId).map((i) => i.id) }))
              .filter((c) => c.imageIds.length > 0),
          }
        : {}),
    }

    setSaving(true)
    try {
      const res = await fetch(productId ? `/api/studio/products/${productId}` : "/api/studio/products", {
        method: productId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      const data = (await res.json().catch(() => ({}))) as { id?: number; error?: string }
      if (!res.ok || !data.id) {
        setError(data.error ?? "Enregistrement impossible.")
        return
      }
      setSavedSnapshot(JSON.stringify(values))
      setDescriptionTouched(false)
      if (thenDuplicate) {
        router.push(studioDuplicatePath(data.id))
      } else if (!productId) {
        router.replace(`${studioProductPath(data.id)}?saved=1`)
      } else {
        setSavedFlash(true)
        router.refresh()
      }
    } catch {
      setError("Réseau indisponible. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  const stockNumber = Number(values.stockQuantity) || 0
  const pendingFor = (target: string) => photos.uploads.filter((u) => u.target === target)

  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 pb-40 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={STUDIO_PATHS.catalog}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="size-4" aria-hidden /> Catalogue
        </Link>
        {slug && productId ? (
          <a
            href={`/products/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1.5 text-sm text-stone-600 underline-offset-4 hover:underline"
          >
            Voir sur le site <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
      </div>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
        {productId ? "Modifier le produit" : "Nouveau produit"}
      </h1>

      <div className="mt-6 space-y-4">
        {/* Type first: it decides which sections follow. */}
        <section className={cn(cardClass, "space-y-3")}>
          <h2 className={cardTitleClass}>Type</h2>
          <div className="flex flex-wrap gap-2">
            {options.productTypes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => chooseType(t.id)}
                aria-pressed={values.productTypeId === t.id}
                className={cn(
                  "min-h-10 border px-4 text-sm font-medium",
                  values.productTypeId === t.id
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-300 bg-white text-stone-700",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex items-start gap-3 pt-1 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={values.hasVariants}
              onChange={(e) => set("hasVariants", e.target.checked)}
              className="mt-0.5 size-5 accent-stone-900"
            />
            <span>
              Plusieurs tailles / couleurs
              <span className="block text-xs text-stone-500">
                Décoché pour un châle : pièce unique, un seul stock.
              </span>
            </span>
          </label>
        </section>

        <section className={cardClass}>
          <h2 className={cardTitleClass}>{values.hasVariants ? "Photos principales" : "Photos"}</h2>
          <p className="mt-1 mb-4 text-xs text-stone-500">
            {values.hasVariants
              ? "Affichées dans les listes. Sur la fiche, ce sont les photos de la couleur choisie (plus bas)."
              : "La première photo est la photo principale (listes et partage)."}
          </p>
          <PhotoGrid
            images={values.images}
            onChange={(images) => set("images", images)}
            pending={pendingFor("main")}
            onAddFiles={addMainPhotos}
            onDismissUpload={photos.dismiss}
          />
        </section>

        <section className={cn(cardClass, "space-y-4")}>
          <h2 className={cardTitleClass}>Produit</h2>
          <label className="block">
            <span className={labelClass}>Titre</span>
            <input
              className={cn(inputClass, "mt-1.5")}
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder={selectedType?.slug === "pulls" ? "ex. Pull Nora" : "ex. Châle Signature Noir"}
              autoComplete="off"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelClass}>Prix (DH)</span>
              <input
                className={cn(inputClass, "mt-1.5")}
                value={values.price}
                onChange={(e) => set("price", e.target.value)}
                inputMode="decimal"
                placeholder="95"
              />
            </label>
            {!values.hasVariants ? (
              <div>
                <span className={labelClass}>Stock</span>
                <div className="mt-1.5 flex">
                  <button
                    type="button"
                    onClick={() => set("stockQuantity", String(Math.max(0, stockNumber - 1)))}
                    className="flex w-11 shrink-0 items-center justify-center border border-r-0 border-stone-300 bg-white"
                    aria-label="Retirer 1"
                  >
                    <Minus className="size-4" />
                  </button>
                  <input
                    className={cn(inputClass, "text-center")}
                    value={values.stockQuantity}
                    onChange={(e) => set("stockQuantity", e.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    placeholder="0"
                    aria-label="Stock"
                  />
                  <button
                    type="button"
                    onClick={() => set("stockQuantity", String(stockNumber + 1))}
                    className="flex w-11 shrink-0 items-center justify-center border border-l-0 border-stone-300 bg-white"
                    aria-label="Ajouter 1"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <label className="block">
            <span className={labelClass}>Description</span>
            <textarea
              className={cn(inputClass, "mt-1.5 min-h-28 resize-y")}
              value={values.description}
              onChange={(e) => {
                set("description", e.target.value)
                setDescriptionTouched(true)
              }}
              placeholder="Matière, dimensions, entretien…"
            />
            <span className="mt-1 block text-[11px] text-stone-400">Ligne vide = nouveau paragraphe.</span>
          </label>
        </section>

        {values.hasVariants ? (
          <>
            <VariantSection
              sizes={sizeOptions}
              colors={colors}
              sizeIds={values.sizeIds}
              colorIds={values.colorIds}
              stock={values.variantStock}
              onSizeIds={(ids) => set("sizeIds", ids)}
              onColorIds={(ids) => set("colorIds", ids)}
              onStock={(stock) => set("variantStock", stock)}
              onColorCreated={(color) => {
                setColors((list) => (list.some((c) => c.id === color.id) ? list : [...list, color]))
                setValues((v) => (v.colorIds.includes(color.id) ? v : { ...v, colorIds: [...v.colorIds, color.id] }))
              }}
            />

            {values.colorIds.length > 0 ? (
              <section className={cn(cardClass, "space-y-5")}>
                <h2 className={cardTitleClass}>Photos par couleur</h2>
                {values.colorIds.map((colorId) => {
                  const color = colors.find((c) => c.id === colorId)
                  if (!color) return null
                  return (
                    <div key={colorId}>
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium text-stone-800">
                        <span
                          className="size-4 rounded-full border border-black/15"
                          style={{ backgroundColor: color.hex }}
                          aria-hidden
                        />
                        {color.label}
                      </p>
                      <PhotoGrid
                        images={colorImagesOf(colorId)}
                        onChange={(images) => setColorImages(colorId, images)}
                        pending={pendingFor(`color-${colorId}`)}
                        onAddFiles={(files) => addColorPhotos(colorId, files)}
                        onDismissUpload={photos.dismiss}
                        mainLabel="1re"
                      />
                    </div>
                  )
                })}
              </section>
            ) : null}
          </>
        ) : null}

        <section className={cn(cardClass, "space-y-4")}>
          <h2 className={cardTitleClass}>Classement</h2>
          <div>
            <span className={labelClass}>Catégories{selectedType ? ` (${selectedType.label})` : ""}</span>
            <div className="mt-2">
              <Chips
                options={categoryOptions}
                selected={values.categoryIds}
                onToggle={(id) => set("categoryIds", toggleId(values.categoryIds, id))}
                empty="Aucune catégorie pour ce type."
              />
            </div>
          </div>
          <div>
            <span className={labelClass}>Collections</span>
            <div className="mt-2">
              <Chips
                options={options.collections}
                selected={values.collectionIds}
                onToggle={(id) => set("collectionIds", toggleId(values.collectionIds, id))}
                empty="Aucune collection."
              />
            </div>
          </div>
          <div>
            <span className={labelClass}>Étiquettes (motifs / unis…)</span>
            <div className="mt-2">
              <Chips
                options={options.tags}
                selected={values.tagIds}
                onToggle={(id) => set("tagIds", toggleId(values.tagIds, id))}
                empty="Aucune étiquette."
              />
            </div>
          </div>
          {productId ? (
            <p className="text-[11px] text-stone-400">
              Badges de disponibilité, prix spécifique d’une variante et réglages avancés :{" "}
              <a className="underline" href={`/admin/collections/scarves/${productId}`}>
                Payload
              </a>
              .
            </p>
          ) : null}
        </section>
      </div>

      {/* Sticky save bar — thumb-reachable on phones. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="mx-auto max-w-2xl space-y-2 px-4 py-3 md:px-6">
          {error ? (
            <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
          {savedFlash ? (
            <p className="text-center text-sm font-medium text-green-700" role="status">
              Enregistré ✓
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void save(true)}
              disabled={saving || photos.busy}
              className="min-h-12 flex-1 border border-stone-400 bg-white px-3 text-sm font-medium text-stone-800 disabled:opacity-50"
            >
              Enregistrer + dupliquer
            </button>
            <button
              type="button"
              onClick={() => void save(false)}
              disabled={saving || photos.busy}
              className="min-h-12 flex-[1.4] bg-stone-900 px-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : photos.busy ? "Photos en cours…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
