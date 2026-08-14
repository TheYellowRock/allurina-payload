# AllurinaScarf — Meta Tracking / Cart / Cookie Audit

Audit only. No source files were modified. All line numbers refer to the state of the
repository at the time of this audit; re-verify before acting on them if the code has
changed since.

---

## Summary

- **Checkout trusts client-supplied prices with no server-side re-pricing** — `src/app/api/store/checkout/route.ts:23-24` feeds the raw `items` array from the request body straight into `computeCartPricing`, and `validateCheckoutBody` (`src/lib/checkout/validate-checkout.ts:7-23`) only checks that `price` is a non-negative number, never against `scarves.price` in Payload. A tampered request can set any price.
- **No idempotency protection on order submission** — `src/components/storefront/checkout/checkout-page-view.tsx:41,317` disables the submit button via React state (`setPending(true)`), which is not synchronous with the DOM commit, and the server (`route.ts:36-60`) has no dedup key. Double-click, back-button resubmission, or a client retry after a timed-out-but-successful request can all create duplicate orders, each independently decrementing stock and firing a duplicate Meta `Purchase` event.
- **Stock is never checked before an order is accepted, and the post-order decrement is a non-atomic read-then-write loop** — `src/lib/inventory/adjustInventoryForNewOrder.ts:60-101` runs `findByID` then `update` per product with no transaction or row lock, so concurrent orders can both read the same `stockQuantity` and both succeed, overselling.
- **Server-side Conversions API events carry almost no match-quality data and one structurally wrong field** — `src/lib/conversions-api.ts:38-41` sends only `client_ip_address`/`client_user_agent` in `user_data` (no email/phone/external_id/fbp/fbc, despite the checkout form collecting all of this at Purchase time), and `contents` is built from `{ sku, quantity }` objects (`src/components/storefront/product-view-tracker.tsx:33`, `add-to-cart-button.tsx:69`, `checkout-page-view.tsx:89-92`) — Meta's Content object schema expects a field named `id`, not `sku`, so these events likely arrive at Meta with no usable product identifiers server-side.
- **No cookie consent mechanism exists**, despite the privacy policy (`src/app/(app)/(shop)/politique-confidentialite/page.tsx:151-158`) stating cookies are set "with your consent where the law requires it." The Meta Pixel and GTM both load unconditionally on every page load (`src/app/(app)/layout.tsx:57-58`) with no gate.

---

## Part 1 — Meta tracking findings

### 1–2. Event inventory and dedup table

| Event | File : line | Trigger | Browser (fbq) | Server (CAPI) | Shared `event_id`? | Dedup OK? |
|---|---|---|---|---|---|---|
| `PageView` (initial load) | `src/components/MetaPixelScript.tsx:21` | Pixel init inline script runs on every full page load | Yes | **No** (explicitly skipped, see `src/components/PixelPageView.tsx:14-19`) | N/A | N/A — no server counterpart by design |
| `PageView` (SPA route change) | `src/components/PixelPageView.tsx:13-26`, `src/lib/pixel.ts:9-13` | `useEffect` on `[pathname, searchParams]`, skipped on first mount | Yes, via `pageview()` | Yes, via `fetch("/api/pixel", {eventName:"PageView"})` | **No** — `pageview()` (`lib/pixel.ts:9-13`) calls `window.fbq("track","PageView")` with no `eventID` at all; the server call has no `eventId` passed in the body either, so `sendServerEvent` (`conversions-api.ts:26`) falls back to `crypto.randomUUID()` | **No** — browser and server events are independent random/absent IDs, Meta cannot merge them |
| `ViewContent` | `src/components/storefront/product-view-tracker.tsx:14-38` | `useEffect` on `[productId, price]`, mounted from `src/app/(app)/(shop)/products/[slug]/page.tsx:49` | Yes, `fbEvent(...)` line 16-25 | Yes, `fetch("/api/pixel")` line 26-37 | **Yes** — same `eventId` (line 15) passed to both | Yes, on the ID; but see product-identifier bug below |
| `AddToCart` | `src/components/storefront/cart/add-to-cart-button.tsx:41-80` | Button `onClick` | Yes, line 52-61 | Yes, line 62-73 | **Yes** — same `addToCartEventId` (line 51) | Yes, on the ID; see product-identifier bug below |
| `Purchase` | `src/components/storefront/checkout/checkout-page-view.tsx:33-104` | After `/api/store/checkout` returns `res.ok` and a truthy `orderReference` | Yes, line 72-81 | Yes, line 82-96 | **Yes** — same `purchaseEventId` (line 71) | Yes, on the ID; see product-identifier and match-quality issues below |

Also present but not a Meta event: `src/lib/gtm.ts` fires `add_to_cart`, `view_cart`, `begin_checkout` to GTM/GA4 (`sendGTMEvent`), separate pipeline, not asked about in detail here beyond the cookie inventory in Part 3.

### 3. `src/lib/conversions-api.ts` — payload construction

- **Graph API version**: `v21.0`, hardcoded in the URL template (`conversions-api.ts:50`): `` `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}` ``.
- **PII hashing**: There is **no hashing anywhere in this file or anywhere in `src/`** (confirmed via repo-wide search for `sha256`/`createHash`/`hash(` — zero matches). This is moot for what's *currently* sent, because `user_data` (lines 38-41) only ever contains `client_ip_address` and `client_user_agent` — both of which Meta's spec requires **unhashed**, so nothing is "hashed incorrectly." But it also means the `CapiEventData` type (`conversions-api.ts:3-9`) has no `email`/`phone`/`externalId`/`fbp`/`fbc` fields at all, and none of the three call sites (`product-view-tracker.tsx`, `add-to-cart-button.tsx`, `checkout-page-view.tsx`) pass any customer PII into `eventData` even though the checkout form collects name, email, phone, and address at the exact moment `Purchase` fires (`checkout-page-view.tsx:23-31` holds this state, none of it reaches the `/api/pixel` POST body at lines 82-96). If PII fields are added later, there is currently no hashing utility in the codebase to reuse — one would need to be written.
- **`test_event_code`**: Read from `process.env.FACEBOOK_TEST_EVENT_CODE` (line 23), included as a top-level sibling of `data` whenever truthy (line 44: `...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {})`). **There is no environment guard** (no `NODE_ENV` check, no allowlist) — if this env var is ever set in the production deployment, every real order's `Purchase` event (and every other event) is flagged as a test event, which Meta excludes from ad-delivery optimization and attribution. Whether it is currently set in production is not determinable from the repo — see Open Questions.
- **Failure handling**: Improved from a fully silent implementation — `res.json()` is now awaited (line 58) and `console.error("[conversions-api] Meta CAPI rejected event", eventName, body)` fires (lines 59-61) when `!res.ok` **or** `body?.error` is truthy, so a Meta-side rejection embedded in a 200 response is caught, not just an HTTP-level failure. However: this is `console.error` only — there is no retry, no dead-letter queue, no metric/alert. On Vercel, `console.error` from a serverless function goes to function logs, which are not actively monitored by anything in this repo (no Sentry/log-drain integration found). A sustained CAPI failure (e.g. expired access token) would produce log lines nobody looks at rather than a visible alert. There's also a `console.log` of the full outgoing payload at line 47 (`console.log("[conversions-api] outgoing payload", ...)`) which was added as a temporary debug aid — it logs `client_ip_address` and `client_user_agent` (real visitor PII) into Vercel logs on every single tracked event, indefinitely, until removed.
- **Missing credentials**: `console.warn` fires (line 19) and the function returns early (line 20) when `PIXEL_ID` or `ACCESS_TOKEN` is absent — not silent.
- **Is `FACEBOOK_ACCESS_TOKEN` reachable from client bundles?** No. `conversions-api.ts` has no `"use client"` directive, and its only importer is `src/app/api/pixel/route.ts:3-4`, a server-only Route Handler (confirmed via repo-wide search — no other file imports from `@/lib/conversions-api`). The token is never referenced with a `NEXT_PUBLIC_` prefix anywhere in the repo.

### 4. `_fbp` / `_fbc` cookies

Not read anywhere in the codebase. A repo-wide case-insensitive search for `_fbp`, `_fbc`, and `fbclid` in `src/` returns zero matches outside this audit.

The Pixel base code **is** present and would set `_fbp` (and `_fbc`, if a `fbclid` query param were present on landing) automatically per Meta's standard snippet behavior: `src/components/MetaPixelScript.tsx:11-22` is the unmodified official Meta bootstrap snippet that loads `fbevents.js` from `connect.facebook.net`. But since these cookies are never read back into the app, `user_data` sent to CAPI never includes `fbp`/`fbc` (consistent with the `user_data` contents shown in Part 1, item 3).

Where they would need to be read: client-side, at each of the three tracking call sites — `product-view-tracker.tsx:14-38`, `add-to-cart-button.tsx:41-80`, `checkout-page-view.tsx:71-96` — via `document.cookie` parsing for `_fbp`/`_fbc`, then threaded through the `/api/pixel` POST body, through `CapiEventData` (`conversions-api.ts:3-9`, which has no fields for them today), into the `user_data` object (`conversions-api.ts:38-41`).

### 5. `fbclid` capture

Not captured or persisted anywhere (same search as above). No landing-page middleware, no query-param reader, no cookie write for it.

### 6. Duplicate firing

- **`PageView` on SPA navigation is architecturally double-fired relative to Meta's dedup mechanism** — see the table in Part 1.2. This isn't a React bug (no re-render loop), it's a missing `event_id` handshake between `lib/pixel.ts:9-13` and the server call in `PixelPageView.tsx:20-25`.
- **`ViewContent`**: `product-view-tracker.tsx:14` has a `useEffect` with dependency array `[productId, price]` (line 38) — this only re-fires on a genuine prop change (i.e., navigating to a different product), not on unrelated re-renders. No guard against React Strict Mode double-invocation was found; `next.config.ts:8-29` does not set `reactStrictMode` explicitly, so it follows whatever Next 16's default is (not independently confirmed from `next.config.ts` alone — see Open Questions). If Strict Mode is on, this would double-fire in **development only**, not production.
- **`AddToCart`**: no debounce or disabled-state on the button while the handler runs (`add-to-cart-button.tsx:41-80` — contrast with the checkout submit button, which does set `pending`/`disabled`, `checkout-page-view.tsx:41,317`). A fast double-click fires two full `AddToCart` sequences (GTM + browser Pixel + CAPI, each with a distinct `crypto.randomUUID()` at line 51) and adds the item twice to cart. This inflates `AddToCart` counts relative to real distinct user intents; it is not deduplicated by Meta because each click gets its own `event_id`.
- **`Purchase`**: gated correctly behind a successful `fetch` response (`checkout-page-view.tsx:63-70` returns before the tracking calls on any error), so a failed order does not fire `Purchase`. But see Part 2, item 14 — the order-creation request itself is not idempotent, so a duplicate *order* also produces a duplicate, correctly-paired-but-still-duplicate `Purchase` event (browser+server share an ID *within* that submission, but a second submission gets its own new ID and is invisible to Meta as a duplicate).

---

## Part 2 — Cart findings

### 7. Where cart state lives

React Context + `useReducer`, in `src/components/storefront/cart/cart-context.tsx:90-125` (`CartProvider`/`useCart`). Persisted to `window.localStorage` under key `CART_STORAGE_KEY` (`src/lib/cart/constants.ts`, read at `persist.ts:1`), via `readCartFromStorage`/`writeCartToStorage` (`src/lib/cart/persist.ts:33-41`), synced on every `state.items` change once hydrated (`cart-context.tsx:97-100`). **Per-device, per-browser** — `localStorage` is not synced to any account/session, and there is no server-side cart table in Payload or Postgres. No Supabase client-side usage found (Supabase is used only as the Postgres host + S3-compatible media storage behind Payload, confirmed in `src/payload.config.ts:1,63-67,69-86` — no `@supabase/supabase-js` or similar client import anywhere in `src/`).

### 8. TTL / expiry

None. `writeCartToStorage` (`persist.ts:38-41`) sets no expiry, and `localStorage` itself has no built-in TTL — the cart persists indefinitely until the user clears browser storage, `clearCart()` is called (only on a successful order, `checkout-page-view.tsx:97`), or the stored JSON fails `parseStoredCart`'s shape validation (`persist.ts:22-31`, which fails safe to `[]` on any parse error or shape mismatch).

### 9. Full path: "add to cart" click → order row

1. `src/components/storefront/cart/add-to-cart-button.tsx:41-80` — `onClick` calls `addItem(item)`.
2. `src/components/storefront/cart/cart-context.tsx:116` — `addItem` dispatches `{type:"ADD", payload}` → `cartReducer` (line 55-56) → `addOrMergeLine` in `src/lib/cart/merge-lines.ts:3-26`.
3. `cart-context.tsx:97-100` — effect writes the new `items` array to `localStorage` via `persist.ts:38-41`.
4. User navigates to `/checkout` (`src/app/(app)/(shop)/checkout/page.tsx:10-16`) → `CheckoutPageView` (`checkout-page-view.tsx:17`) reads `items`/`pricing` from `useCart()` (line 19).
5. On submit (`checkout-page-view.tsx:33-119`), `POST /api/store/checkout` with the client's `items` array and customer form fields (lines 43-61).
6. `src/app/(app)/api/store/checkout/route.ts:9-70` — parses the body, calls `validateCheckoutBody` (`src/lib/checkout/validate-checkout.ts:30-106`) for shape/format validation only, computes `pricing` from the **client-supplied** `items` via `computeCartPricing` (`route.ts:24`, defined in `src/lib/cart/pricing.ts:30-53`).
7. `route.ts:34` — `upsertClientFromCheckout` (`src/lib/clients/upsertClientFromCheckout.ts:9-43`) creates/updates a `clients` row keyed by lowercased email.
8. `route.ts:36-60` — `payload.create({collection:"orders", ...})` inserts the order row, `items` stored as a raw JSON blob (`Orders.ts:123-127`) — i.e., the client's cart array is stored verbatim, not normalized into line-item rows.
9. `src/collections/Orders.ts:23-34` — `afterChange` hook (create only) fires `sendOrderConfirmation`, `sendOwnerNotification` (`src/lib/email.ts:146-203`), and `adjustInventoryForNewOrder` (`src/lib/inventory/adjustInventoryForNewOrder.ts:48-103`) in parallel via `Promise.all`.
10. Back on the client, `checkout-page-view.tsx:71-98` fires the `Purchase` event, calls `clearCart()`, and redirects to `/checkout/confirmation?ref=...`.

### 10. Stock check

**No stock check gates order creation at all.** `validateCheckoutBody` (`validate-checkout.ts:30-106`) never queries `scarves.stockQuantity`; `route.ts:36-60` creates the order unconditionally. Stock is only ever touched *after* the order already exists, inside the `afterChange` hook.

The decrement itself (`adjustInventoryForNewOrder.ts:48-103`) is a classic **read-then-write, not atomic**: for each product, it does `payload.findByID` (line 62-66) to read current `stockQuantity`, computes `next = Math.max(0, current - qtyOrdered)` in application code (line 77), then `payload.update` (line 96-101) — no `SELECT ... FOR UPDATE`, no DB-level atomic decrement/constraint, no transaction. Two orders for the same product created within milliseconds of each other can both read the same `current` value and both write a `next` that only accounts for one of the two orders — the loop also silently `continue`s (line 67-70) if `findByID` throws, meaning that product's stock simply doesn't get adjusted, with only a `console.warn`.

### 11. Client-trusted vs. server-validated order payload

**Trusted as-is**, not re-derived. Quoting the exact code:

`src/lib/checkout/validate-checkout.ts:7-23` (`isCartLine`) — the *only* server-side check on each cart line:
```ts
function isCartLine(x: unknown): x is CartLineItem {
  if (!x || typeof x !== "object") return false
  const o = x as Record<string, unknown>
  return (
    typeof o.productId === "string" &&
    o.productId.length > 0 &&
    typeof o.slug === "string" &&
    typeof o.title === "string" &&
    typeof o.price === "number" &&
    Number.isFinite(o.price) &&
    o.price >= 0 &&
    typeof o.quantity === "number" &&
    Number.isInteger(o.quantity) &&
    o.quantity >= 1 &&
    (o.imageSrc === null || typeof o.imageSrc === "string")
  )
}
```
This checks *shape and type*, not that `price` matches the corresponding `scarves` document's `price` field, and not that `productId` even exists in the `scarves` collection. `route.ts:23-24` then does:
```ts
const { customer, items, paymentMethod } = parsed.data
const pricing = computeCartPricing(items)
```
`items` here is exactly what the client sent (post shape-validation), and is stored verbatim into the order (`route.ts:53`, `items,`).

### 12. Prices: client cart or re-read from DB?

Client cart, unconditionally — see item 11. `scarves.price` (`src/collections/Scarves.ts:44-50`) is never read during checkout. A request crafted directly against `POST /api/store/checkout` (bypassing the UI) with fabricated `price` values on each line would be accepted as-is, and `subtotal`/`grandTotal` on the resulting order (`route.ts:54,57`) would reflect the fabricated prices.

### 13. Transaction wrapping

No transaction anywhere in this flow. The order itself is a single `payload.create` call (`route.ts:36-60`) writing one row with `items` as a JSON column — not multiple line-item rows, so there's no multi-row insert to wrap for the order itself. But the **inventory adjustment loop is multi-row and unwrapped**: `adjustInventoryForNewOrder.ts:59-102` iterates `byProduct` and calls `payload.update` once per distinct product with no surrounding transaction — if it throws partway through (e.g., on the third of five products), the first two already-updated products keep their decremented stock while the rest do not, and the only trace is `Orders.ts:29-31`'s `.catch(err => console.error(...))`, which does not affect the order (already created and already emailed) in any way.

### 14. Duplicate order submission

**Possible, and nothing in the code prevents it.** No idempotency key is generated client-side or accepted server-side — `route.ts:9-70` has no dedup field, and `orderReference` (`route.ts:26-29`, `` `ALL-${Date.now()...}${Math.random()...}` ``) is generated fresh server-side on every call, so two submissions of the identical cart always produce two distinct, both-valid order rows (the only `unique` constraint on `Orders` is `orderReference` itself, `Orders.ts:44-49`, which can't collide with itself).

Client-side mitigation is a `pending` React state disabling the submit button (`checkout-page-view.tsx:41` `setPending(true)`, `line 317` `disabled={pending}`) — this is not synchronous with the DOM update (React state updates are asynchronous/batched), leaving a race window for a fast double-click or double-Enter to invoke `onSubmit` twice before the button visually disables. A browser back-button press *after* a successful submission is safe on the happy path because `clearCart()` already ran (`checkout-page-view.tsx:97`) before the redirect, so a resubmission attempt would hit the "cart is empty" branch (`checkout-page-view.tsx:129-146`) — but a back-button press or tab duplication *during* the in-flight request (before `pending` resolves) is not covered by that guard. A client network retry after a timeout (request succeeded server-side, response lost client-side) also produces a duplicate order with no way for the server to recognize it as a repeat.

Each duplicate order independently: creates a `clients` upsert (idempotent by email, harmless), sends two confirmation/owner emails, runs the non-atomic inventory decrement twice, and fires a second `Purchase` event to Meta with a new `event_id` (not deduplicated by Meta, since dedup is per-`event_id`).

---

## Part 3 — Cookies and consent findings

### 15. Cookies set by the app

No cookie-setting code was found anywhere in `src/` — a repo-wide search for `document.cookie`, `cookies()`, `Set-Cookie`, `response.cookies`, and `req.cookies` returns matches only in `src/app/(app)/orders_manager/page.tsx` and `src/lib/orders-manager/getStaffUser.ts` (both relate to the **Payload admin/staff auth session cookie**, which is Payload's own built-in auth cookie, not something this app's code constructs directly — its name/flags are Payload-internal and not overridden here) and the privacy-policy page text itself (which only describes cookies, doesn't set any).

No custom storefront cookie exists — no cart cookie (cart is `localStorage`, see Part 2.7), no consent-state cookie, no first-party analytics cookie.

Third-party cookies present on the storefront by virtue of the scripts loaded, not this app's own code:
- **Meta Pixel** (`connect.facebook.net/en_US/fbevents.js`, loaded via `MetaPixelScript.tsx:11-22`) sets `_fbp` (and `_fbc` if a `fbclid` param is present) per Meta's standard behavior — not inspectable from this repo since it's Meta's script, not ours.
- **Google Tag Manager / GA** (`@next/third-parties/google`'s `GoogleTagManager`, `layout.tsx:57` `<GoogleTagManager gtmId={GTM_ID} />`) sets its own cookies (`_ga`, etc., depending on what tags are configured *inside* the GTM container, which lives in the Google Tag Manager UI, outside this repo's visibility).

Exact name/expiry/`httpOnly`/`secure`/`sameSite` flags for the Payload auth cookie and the Meta/GTM cookies are **not determinable from this repo** — they're set by Payload internals and by the third-party scripts respectively. See Open Questions.

### 16. Cookie consent banner

**None exists.** Confirmed via repo-wide search for `consent`, `cookie-banner`, `CookieBanner`, `cookieConsent`, `RGPD`, `GDPR` — the only match anywhere in `src/` is the privacy-policy page's prose. There is no interactive banner component, no consent-state storage (cookie or otherwise), and consequently nothing to gate on.

The Pixel loads unconditionally: `layout.tsx:42-58` — `pixelId` is read from `process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID` and `<MetaPixelScript pixelId={pixelId} />` renders whenever that env var is set, with `strategy="afterInteractive"` (`MetaPixelScript.tsx:9`), independent of any user choice. Same for GTM (`layout.tsx:57`, gated only on `GTM_ID` being configured, `layout.tsx:34`). This directly contradicts the privacy policy's own claim (`politique-confidentialite/page.tsx:151-158`, section 4) that personalization/advertising cookies are set "avec votre accord lorsque la loi l'exige" (with your consent where the law requires it).

### 17. PII in localStorage / sessionStorage / non-httpOnly cookies

None found. `localStorage` usage is confined to the cart (`src/lib/cart/persist.ts`, `src/lib/cart/types.ts`) which stores `productId`, `slug`, `title`, `price`, `quantity`, `imageSrc` (`CartLineItem`, `src/lib/cart/types.ts:2-9`) — no customer identity fields. The checkout form's `customerName`/`email`/`phone`/address fields (`checkout-page-view.tsx:23-31`) live only in React `useState`, never persisted to any browser storage. No `sessionStorage` usage found anywhere in `src/`. No app-set cookies exist at all (see item 15), so the "non-httpOnly cookie" case is moot for this app's own code.

### 18. PII in URL query strings or Referer

The only app-controlled query string carrying order-related data is `checkoutConfirmationPath` (`src/lib/routes.ts:8-10`): `` `/checkout/confirmation?ref=${encodeURIComponent(orderReference)}` ``. `orderReference` (e.g. `ALL-XXXXX...`) is an opaque reference token, not itself PII, and the confirmation page (`src/app/(app)/(shop)/checkout/confirmation/page.tsx:12-14`) only echoes back the `ref` param the client already possessed — it does not fetch or display the customer's name/email/phone/address from that reference, and there is no public API route that resolves an order reference to full order details (the only reads of the `orders` collection are gated behind `Boolean(req.user)`, `Orders.ts:38`). No email, phone, name, or address appears in any URL in this codebase. Since nothing sensitive is in the URL, the Referer-leak question is moot for first-party navigation; whether Meta's own script or GTM attaches anything to outbound Referer headers is outside this repo's code.

---

## Issues ranked

**CRITICAL**
- Checkout order creation trusts client-supplied `price` with no server-side re-derivation from `scarves.price` — `src/app/api/store/checkout/route.ts:23-24`, `src/lib/checkout/validate-checkout.ts:7-23`. Anyone can submit an order at an arbitrary price.
- No idempotency key on `POST /api/store/checkout`; double-click/back-button/retry can create duplicate orders, each decrementing stock and firing a duplicate `Purchase` event — `src/app/(app)/api/store/checkout/route.ts:9-70`, `src/components/storefront/checkout/checkout-page-view.tsx:41,317`.
- No stock check gates order creation, and the post-order decrement is a non-atomic read-then-write with no transaction/locking — `src/lib/inventory/adjustInventoryForNewOrder.ts:60-101`. Concurrent orders can oversell.

**HIGH**
- CAPI `contents` objects use `{ sku, quantity }` instead of Meta's expected `{ id, quantity, ... }` schema — `src/components/storefront/product-view-tracker.tsx:33`, `add-to-cart-button.tsx:69`, `checkout-page-view.tsx:89-92`, `src/lib/conversions-api.ts:1,35`. Server-side events likely carry no usable product identifiers.
- CAPI `user_data` never includes email/phone/external_id/fbp/fbc despite the checkout form collecting all of it — `src/lib/conversions-api.ts:38-41`. Weak match quality on every server-side event, worst on `Purchase`.
- `test_event_code` has no environment guard; if `FACEBOOK_TEST_EVENT_CODE` is ever set in production, every real event is excluded from Meta's ad optimization/attribution — `src/lib/conversions-api.ts:23,44`. (Whether it's currently set in prod is unknown — see Open Questions.)
- Temporary `console.log` of the full outgoing CAPI payload, including visitor IP and user-agent, on every event — `src/lib/conversions-api.ts:47`. Flagged in the code's own commit message as temporary but still present.
- No cookie consent banner despite the privacy policy stating consent is obtained for personalization/advertising cookies; Pixel and GTM load unconditionally for every visitor — `src/app/(app)/layout.tsx:57-58`, `src/app/(app)/(shop)/politique-confidentialite/page.tsx:151-158`.

**MEDIUM**
- SPA-navigation `PageView` fires browser + server with no shared `event_id`, so it's not deduplicated by Meta — `src/lib/pixel.ts:9-13`, `src/components/PixelPageView.tsx:13-26`.
- `_fbp`/`_fbc` are never read or forwarded to CAPI despite the Pixel base code setting them client-side, and `fbclid` is never captured from the landing URL — confirmed absent repo-wide.
- CAPI failures are logged via `console.error` only, with no alerting/retry — a token expiry or schema rejection would go unnoticed — `src/lib/conversions-api.ts:58-61`.
- `AddToCart` button has no debounce/disabled-state during its synchronous handler, so a fast double-click adds the item twice and fires two full tracking sequences — `src/components/storefront/cart/add-to-cart-button.tsx:41-80`.

**LOW**
- `next.config.ts` doesn't explicitly set `reactStrictMode`; if the framework default enables it, `ViewContent`'s `useEffect` (and any other tracking effect) double-fires in development only — `next.config.ts:8-29`, `src/components/storefront/product-view-tracker.tsx:14-38`.
- Cart has no TTL — stale, long-abandoned carts persist indefinitely in `localStorage` — `src/lib/cart/persist.ts:38-41`.

---

## Open questions I could not resolve from the code

- Whether `FACEBOOK_TEST_EVENT_CODE` is currently set in the production environment (Vercel env vars aren't in the repo).
- The exact `httpOnly`/`secure`/`sameSite`/expiry attributes of the Payload admin auth cookie — these are set by Payload's internal auth implementation, not overridden in this repo, so I could not find them by reading `src/`.
- What tags/cookies are actually configured *inside* the Google Tag Manager container referenced by `GTM_ID` (`src/app/(app)/layout.tsx:34`) — the container's contents live in the GTM UI, not this repo.
- Whether Next 16's current default for `reactStrictMode` is `true` or `false` when omitted from `next.config.ts` — `node_modules/next/dist/server/config-shared.js:118` shows the internal default sentinel as `null`, which I could not conclusively resolve to a boolean without deeper framework-source tracing than this audit's scope covered.
- Whether any WAF/rate-limiting exists in front of `/api/store/checkout` and `/api/pixel` at the hosting layer (Vercel project settings) — not visible from the repository.
