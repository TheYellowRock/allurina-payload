/** Aligns with livraison promo snippet: no pure black — dark grey, deep red, body grey. */
export const deliveryPromo = {
  /** Headings / caps lines (≈ #1A1A1A) */
  heading: "font-bold uppercase tracking-[0.22em] text-[#1a1a1a]",
  /** “+ Livraison gratuite” (≈ #C00000) */
  accent: "text-[#c00000]",
  /** Body copy (≈ #555) */
  body: "text-sm font-normal leading-relaxed text-[#555555]",
  /** Icon tile: light border, not dark fill */
  iconBox:
    "flex size-11 shrink-0 items-center justify-center border border-stone-300 bg-white text-[#1a1a1a]",
} as const
