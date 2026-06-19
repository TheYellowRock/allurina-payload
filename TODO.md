# AllurinaScarf — TODO

## Bugs / Oversights

- [ ] **`nouveautes/page.tsx` — missing `FreeDeliveryMiniBanner`**
  `src/app/(app)/(shop)/nouveautes/page.tsx`
  The recent delivery-promo round added the banner to home, `/collections/[slug]`, and `/collections/toutes-les-articles`, but skipped the Nouveautés page. Add `<FreeDeliveryMiniBanner />` after `<CollectionPageIntro>` for consistency.

- [ ] **Redundant `size-11` in `FreeDeliveryMiniBanner`**
  `src/components/storefront/free-delivery-mini-banner.tsx:29`
  `cn(deliveryPromo.iconBox, "size-11")` — `deliveryPromo.iconBox` already contains `size-11` (see `delivery-promo-styles.ts:11`). Drop the extra class.

- [ ] **`getNouveautesScarves` does JS-side date filtering**
  `src/lib/getScarvesStorefront.ts:64-86`
  Fetches up to 400 docs then filters in memory by `createdAt`. Use Payload's `where` clause instead:
  ```ts
  where: { createdAt: { greater_than: since.toISOString() } }
  ```
  This avoids pulling unnecessary rows and makes the query correct as the catalog grows.

- [ ] **`DeliveryPromoSection` and `FreeDeliveryMiniBanner` hardcode the "5 pièces" threshold**
  `src/components/storefront/delivery-promo-section.tsx:39,44,69,78`
  `src/components/storefront/free-delivery-mini-banner.tsx:8,33`
  The canonical source of truth is `FREE_DELIVERY_MIN_ITEMS = 5` in `src/lib/cart/pricing.ts`. If the threshold ever changes, these UI strings won't update automatically. Either import the constant and use it in JSX, or at minimum leave a comment pointing to `pricing.ts`.

---

## Performance

- [ ] **`getScarvesWithAvailability` limit is 100 — homepage category grids will silently truncate**
  `src/lib/getScarvesStorefront.ts:36`
  The homepage uses this function to build the four material-category preview grids (Crêpe, Mousseline, Lin, Satin). Once the catalog exceeds 100 items the grids will silently miss pieces. Either raise the limit to match `getAllScarvesWithAvailability` (400), or scope the query with a `where: { categories: { contains: categoryId } }` per row instead of fetching everything and filtering client-side.

---

## Configuration / Environment

- [ ] **GTM ID hardcoded as fallback in `layout.tsx`**
  `src/app/(app)/layout.tsx:31`
  ```ts
  const GTM_ID = (process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-MLPCW62M").trim()
  ```
  If `GTM-MLPCW62M` is the real production ID, move it into `.env` as `NEXT_PUBLIC_GTM_ID` and drop the fallback so it's never silently injected on unrelated environments. If it's a placeholder, remove the hardcoded string.

---

## SEO

- [ ] **No Open Graph / Twitter card metadata in root layout**
  `src/app/(app)/layout.tsx:25-29`
  The global `metadata` export only sets `title` and `description`. Add an `openGraph` block (type, siteName, locale, image) so link previews render correctly on WhatsApp, social media, etc.

- [ ] **Product pages lack `openGraph.images`**
  `src/app/(app)/(shop)/products/[slug]/page.tsx:23-31`
  `generateMetadata` returns title + description but no OG image. The featured product image is available via `getStorefrontScarfBySlug` — attach it so social previews show the product photo.

- [ ] **Collection `generateMetadata` uses a generic fallback description**
  `src/app/(app)/(shop)/collections/[slug]/page.tsx:29-32`
  The fallback `Découvrez les pièces de la collection ${collection.name}.` is fine, but if no `collection.description` is set in Payload the meta description is thin. Consider pulling the first N scarves' titles as a richer fallback, or enforce the description field as required in the `Collections` Payload config.

---

## Commit hygiene

- [ ] **Stage and commit the current delivery-promo batch**
  Six files are untracked / modified but not committed:
  - `src/components/storefront/delivery-promo-styles.ts` (new)
  - `src/components/storefront/free-delivery-mini-banner.tsx` (new)
  - `src/components/storefront/delivery-promo-section.tsx` (refactored)
  - `src/app/(app)/(shop)/page.tsx`
  - `src/app/(app)/(shop)/collections/[slug]/page.tsx`
  - `src/app/(app)/(shop)/collections/toutes-les-articles/page.tsx`
  Fix the redundant `size-11` and add the banner to `nouveautes/page.tsx` first, then commit everything together.

---

## Nice-to-have / Future

- [ ] **Add `FreeDeliveryMiniBanner` to `chales/[slug]` category pages** (if that route exists / is planned) for parity with collection pages.
- [ ] **`politique-confidentialite` page** — verify legal copy is complete and up-to-date before running ads.
- [ ] **`NOUVEAUTES_WINDOW_MS` (30 days) is not surfaced in UI** — the page header says "30 derniers jours" (`src/app/(app)/(shop)/nouveautes/page.tsx:14`) and the metadata echoes it, but if the constant changes the text won't update. Same fix as the delivery threshold: import and interpolate the constant.
