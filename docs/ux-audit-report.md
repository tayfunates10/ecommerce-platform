# Usage / UI / UX audit report

**Scope:** the storefront as an actual shopper, screen-reader user and keyboard
user experiences it — site entry, catalog browsing, product detail, cart,
localization, responsive layout and accessibility.

**Method:** the application was built with `npm run build` and served with
`npm run start` against a real PostgreSQL 16 instance seeded with a fixture that
covers in-stock, low-stock, out-of-stock, partially-translated and image-less
products (`tests/audit/fixtures/`). A new Playwright suite
(`tests/audit/ux-audit.spec.mjs`, 38 tests × 2 viewports) drove the browser on
desktop Chrome (1280×720) and Pixel 7 emulation, with `@axe-core/playwright`
running WCAG 2 A/AA + WCAG 2.1 A/AA scans. Targeted probes measured Core Web
Vitals, live-region size, quantity-input behaviour and layout geometry.

**Result: 45 passed, 31 failed** — 15 distinct defects reproducing on both
viewports plus one mobile-only defect. Four additional process defects were
found outside the browser suite.

> Every finding below was reproduced against a running build. Where a defect is
> established by code structure rather than by measurement, that is stated
> explicitly.

---

## Severity summary

| ID | Severity | Finding |
| --- | --- | --- |
| BUG-01 | 🔴 Critical | `prisma migrate deploy` does not create the commerce schema; catalog, product detail and sitemap return HTTP 500 |
| BUG-02 | 🔴 Critical | The site root `/` returns 404 |
| BUG-03 | 🔴 Critical | The cart has no path to checkout; the entire checkout stack is unwired |
| BUG-04 | 🟠 High | The cart is silently emptied by a page reload |
| BUG-05 | 🟠 High | The quantity field deletes lines and accepts 999,999 units of a 2-unit product |
| BUG-06 | 🟠 High | The language switcher sends users to 404s on partially translated products |
| BUG-07 | 🟠 High | The 404 page has no `lang`, no navigation and no localization |
| BUG-08 | 🟠 High | Image-less product cards render an unnamed link (axe WCAG A failure) |
| BUG-09 | 🟡 Medium | The modal cart drawer leaves the page behind it exposed to assistive tech |
| BUG-10 | 🟡 Medium | The cart button announces a bare, unlabeled number |
| BUG-11 | 🟡 Medium | Locale links and the back link are below the 24×24 target minimum |
| BUG-12 | 🟡 Medium | The skip link lands under the sticky header on mobile |
| BUG-13 | 🟡 Medium | Above-the-fold catalog imagery is unconditionally lazy-loaded |
| BUG-14 | 🟡 Medium | The catalog has no count, sort, filter, search or pagination, and truncates silently at 48 |
| BUG-15 | 🟡 Medium | The whole product grid sits inside an `aria-live` region |
| BUG-16 | 🔵 Low | No breadcrumb trail or `BreadcrumbList` on product detail |
| BUG-17 | 🔵 Low | Landmark navigations carry misleading labels |
| BUG-18 | 🔵 Low | Stock urgency is invisible on catalog cards |
| BUG-19 | 🔵 Low | `.env.example` documents a Web Vitals endpoint that does not exist |
| PROC-01 | 🟠 High | CI has no database, so no pipeline step has ever rendered a commerce page |
| PROC-02 | 🟡 Medium | Byte-exact screenshot fingerprints are an unstable visual gate |
| PROC-03 | 🟡 Medium | No lockfile was committed — **addressed in this branch** |
| PROC-04 | 🔵 Low | `npm run build` mutates tracked files |

---

## 🔴 Critical

### BUG-01 — `prisma migrate deploy` does not create the commerce schema

The only migration in `prisma/migrations/` is
`20260825123000_checkout_security_analytics`, and it creates exactly two
tables: `RateLimitBucket` and `AnalyticsEventDelivery`. Every commerce model in
`prisma/schema.prisma` — `Product`, `ProductVariant`, `ProductTranslation`,
`Price`, `Inventory`, `Order`, `Cart` and the rest — has no migration at all.

Reproduction on a fresh database, using only the project's own documented
commands:

```
$ npx prisma migrate deploy
All the migrations have been successfully applied.

$ psql -d ecommerce -c '\dt'
 public | AnalyticsEventDelivery | table
 public | RateLimitBucket        | table
 public | _prisma_migrations     | table
(3 rows)
```

Every database-backed route then fails:

| Route | Status |
| --- | ---: |
| `/tr/products` | **500** |
| `/en/products` | **500** |
| `/tr/products/<slug>` | **500** |
| `/sitemap.xml` | **500** |

```
Error [PrismaClientKnownRequestError]:
Invalid `prisma.product.findMany()` invocation:
The table `public.Product` does not exist in the current database.
  code: 'P2021'
```

The divergence runs both ways: `RateLimitBucket` and `AnalyticsEventDelivery`
exist in the migration but are **absent from `prisma/schema.prisma`**, so
Prisma Client cannot type them and `prisma migrate diff` does not see them.

**Impact.** A first production deploy following the project's own release
commands yields a store where only the three static home pages work. This is
the single highest-risk finding.

**Fix.** Generate the baseline migration for the full datamodel, add the two
operational tables to `schema.prisma` so schema and history agree, and add a
CI step that runs `prisma migrate deploy` against an empty database followed by
`prisma migrate diff --exit-code` to prove there is no drift.

---

### BUG-02 — The site root `/` returns 404

There is no `src/app/page.tsx` and no `src/middleware.ts`. Nothing maps `/` to a
locale.

```
$ curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/
404
```

A shopper who types the bare domain, follows a link to the apex, or lands on
`https://shop.example.com/` from an email gets Next.js's unstyled English
"404 — This page could not be found." on a store whose default locale is `tr`.

**Fix.** Add a root route or middleware that negotiates `Accept-Language`
against `locales` and redirects to `defaultLocale` otherwise. Use a 307 so the
redirect is not cached against future locale negotiation.

---

### BUG-03 — The cart has no path to checkout

`CartDrawer` renders the line items and a subtotal, and stops. There is no
checkout button, no checkout link and no checkout page. Test B4 searched the
open dialog for any button or link matching `/ödeme|checkout|sipariş|kasa/i`
and found zero.

The gap is architectural, not cosmetic:

- `src/app/` contains only `[locale]`, `[locale]/products` and
  `[locale]/products/[slug]`. There are **no** `route.ts` files anywhere.
- `src/lib/checkout/orchestrator.ts`, `src/lib/checkout/payment-boundary.ts`,
  `src/lib/rate-limit.ts` and `src/lib/analytics.ts` have **no call sites**
  outside their own directory and their unit tests.
- `CartLine` is browser-only state. Nothing ever writes to the `Cart`,
  `CartItem` or `Order` tables that the schema defines.

The README records Phase 8 as complete and merged, delivering "production
checkout orchestration". The orchestration logic exists and is unit-tested, but
no user can reach it: **the storefront cannot take an order.**

**Fix.** This is the remaining product work, not a patch. At minimum: a
`/[locale]/checkout` route, a server action or API route that calls
`createCheckout`, server-side revalidation of price and inventory at submit
time, and a confirmation page. Until then the README's completion percentage
overstates shippable functionality.

---

## 🟠 High

### BUG-04 — The cart is silently emptied by a page reload

`CartProvider` holds the cart in `useState` with no persistence layer — no
`localStorage`, no cookie, no server cart.

```
add to cart  →  badge reads "Sepet (1)"
F5           →  badge reads "Sepet (0)"
```

The loss is inconsistent, which makes it worse: client-side navigation *does*
preserve the cart (test B3 passes), so the cart survives clicking around the
store and then vanishes on a refresh, a back-forward cache miss, or a shared
link. There is no warning and no recovery.

**Fix.** Hydrate the cart from `localStorage` on mount and persist on change, or
back it with the `Cart`/`CartItem` tables keyed by a cookie. Reconcile prices
and stock on rehydration rather than trusting stored values.

---

### BUG-05 — The quantity field deletes lines and accepts absurd quantities

`src/components/storefront/cart-ui.tsx`:

```jsx
<input type="number" min={1} step={1} value={line.quantity}
  onChange={(event) => cart.setQuantity(line.variantId, Number(event.target.value))} />
```

`min={1}` is a browser validation hint that nothing enforces, and every
keystroke is committed straight to state. Measured behaviour, typing into the
quantity field of a variant with **2 units in stock**:

| Typed | Result |
| --- | --- |
| *(cleared)* | `Number("") === 0` → **line deleted**, no confirmation, no undo |
| `-3` | **line deleted** |
| `2.7` | silently truncated to `2`, no feedback |
| `1e3` | **1,000 units accepted** |
| `999999` | **999,999 units accepted — subtotal ₺1.298.998.701,00** |

Two distinct defects compound here. Clearing the field to retype a number is the
single most common interaction with a quantity input, and it destroys the line.
And nothing anywhere caps quantity against `variant.available`, so the cart will
happily quote a billion-lira order for a product with two units on the shelf.

**Fix.** Keep the input as a draft string, commit only on `blur`/`Enter`, clamp
to `[1, variant.available]`, require an explicit Remove action for deletion, and
surface a message when the requested quantity is reduced. Carry the same clamp
into `setQuantity` so programmatic callers cannot bypass it.

---

### BUG-06 — The language switcher sends users to 404s

`src/components/storefront/locale-nav.tsx`:

```js
function localeHref(pathname, targetLocale) {
  const segments = pathname.split("/");
  if (segments.length > 1) segments[1] = targetLocale;
  return segments.join("/") || `/${targetLocale}`;
}
```

The switcher rewrites segment 1 with no knowledge of which locales a product is
actually translated into. `getStorefrontProduct` requires a translation row and
returns `null` without one, so the page calls `notFound()`.

For a product translated only into Turkish, the header's own DE and EN links are
dead:

```
/tr/products/solis-tr-only-urun  → 200
/de/products/solis-tr-only-urun  → 404   ← linked from the visible header
/en/products/solis-tr-only-urun  → 404   ← linked from the visible header
```

Notably the SEO layer already solves this: `generateMetadata` calls
`getProductTranslationLocales(product.slug)` and emits hreflang only for
available locales, and the sitemap correctly lists just the TR URL. **The
knowledge exists; the visible UI does not use it.**

**Fix.** Pass the available locales into `LocaleNav` and either disable
unavailable options with an explanation or point them at the localized catalog
instead of a dead product URL.

---

### BUG-07 — The 404 page has no language, navigation or localization

```html
<html id="__next_error__"><head>…</head><body>…404 This page could not be found.…
```

There is no `not-found.tsx` at any level, so every miss falls through to the
Next.js default:

- **no `lang` attribute** — a WCAG 3.1.1 *Language of Page* (Level A) failure;
  a screen reader announces English text in whatever voice was last active;
- **no header, footer or skip link** — the user has no way back into the store
  other than the browser's Back button;
- **English only**, on a TR/EN/DE storefront.

Because of BUG-02 this is also what visitors to the bare domain see.

**Fix.** Add `src/app/[locale]/not-found.tsx` inside the locale layout so the
page inherits `lang`, chrome and translations, plus a root `not-found.tsx` that
falls back to `defaultLocale` for unmatched paths.

---

### BUG-08 — Image-less product cards render an unnamed link

axe reports a `link-name` violation on `/tr/products`, which fails the catalog's
WCAG 2.1 A/AA scan outright:

```html
<a class="product-card__media" href="/tr/products/zenith-no-image">
  <div class="product-card__placeholder" aria-hidden="true"></div>
</a>
```

When a product has media, the `next/image` `alt` gives the link its accessible
name. When it does not, `ProductCard` renders a placeholder marked
`aria-hidden="true"`, leaving the anchor with no accessible name at all. A
screen-reader user hears "link" with no indication of the destination.

This is a data-dependent defect: it appears only for products without media,
which is exactly the state a real catalog reaches whenever merchandising lags
behind the product feed.

**Fix.** Give the media link an `aria-label` of the product name, or make it
`aria-hidden`/`tabindex="-1"` and rely on the heading link — the card currently
exposes two links to the same destination anyway.

---

## 🟡 Medium

### BUG-09 — The modal drawer leaves the background exposed

`CartDrawer` correctly sets `role="dialog"`, `aria-modal="true"`, traps Tab
(verified: test C8 passes), restores focus to the trigger on close and locks
body scroll. But nothing marks the rest of the document inert:

```js
const backgroundReachable = !header.closest("[inert]") && !header.hasAttribute("aria-hidden");
// → true
```

`aria-modal="true"` is honoured inconsistently, so a screen-reader user browsing
with the virtual cursor rather than Tab can still read and operate the header,
navigation and page content behind the overlay.

**Fix.** Set `inert` on the page wrapper while the drawer is open, or render the
drawer with `<dialog showModal()>`, which gives inertness, focus trapping and
Escape handling from the platform.

---

### BUG-10 — The cart button announces a bare number

```jsx
{copy[locale].cart} <span aria-hidden="true">({cart.count})</span>
<span className="sr-only"> {cart.count}</span>
```

The accessible name computes to `Sepet 0` — the digit has no unit, so a screen
reader announces "Cart zero" with no indication of what is being counted.

**Fix.** Put the unit in the screen-reader text (`0 ürün` / `0 items` /
`0 Artikel`) and mark the count `aria-live="polite"` so additions are announced.

---

### BUG-11 — Interactive targets below the 24×24 minimum

Measured on the product detail page at 390 px:

| Target | Size | WCAG 2.2 SC 2.5.8 (AA) |
| --- | --- | --- |
| Locale links `TR` / `EN` / `DE` | 19 × 21 px | ❌ |
| `.text-link` "Ürünlere dön" | 93 × 17 px | ❌ |

The locale switcher is the primary control for a trilingual store and is the
smallest target on the page.

**Fix.** Give `.locale-nav a` and `.text-link` `min-block-size: 2.75rem` with
matching inline padding, or add invisible padded hit areas.

---

### BUG-12 — The skip link lands under the sticky header (mobile)

`globals.css` combines `html { scroll-behavior: smooth }` with a
`position: sticky` header, but never sets `scroll-padding-block-start`. On
Pixel 7, activating the skip link on `/tr/products` leaves the page heading
**104 px above the header's bottom edge** — the very content the keyboard user
jumped to is covered.

The existing certification suite misses this because it only asserts that
`#main-content` receives focus, and only on the home route, where the hero's
large top padding happens to absorb the offset.

**Fix.** `html { scroll-padding-block-start: 5rem; }` (the header's
`min-block-size` plus a small margin).

---

### BUG-13 — Above-the-fold catalog imagery is unconditionally lazy

`ProductCard` hardcodes `loading="lazy"` on every card image with no way to
prioritize the first ones:

```jsx
<Image … loading="lazy" />
```

Measured placement: at 1280 px **four** card images are above the fold; on a
412 px phone the first one is. None carries `priority` or `fetchpriority="high"`.
Lazy images are not requested until layout runs, which delays the LCP candidate
on exactly the page where product imagery is the point.

`ProductPage` gets this right — its hero image uses `priority`. The catalog does
not.

*Measurement caveat:* on localhost every asset resolves in single-digit
milliseconds, so the LCP element here resolved to a text node at 92–108 ms and
the network penalty could not be reproduced locally. The defect is established
structurally, from the markup and the fold measurement, not from a timing
regression.

**Fix.** Accept a `priority` prop on `ProductCard` and set it for the first row
(`index < columnsAboveFold`).

---

### BUG-14 — The catalog has no count, sort, filter, search or pagination

`/[locale]/products` renders one flat grid. There is no result count, no sort
control, no filter, no search field and no pagination — tests E2 and E3 both
fail. Meanwhile `listStorefrontProducts` applies:

```js
take: STOREFRONT_PRODUCT_LIMIT   // 48
```

Product 49 onward is silently unreachable through the UI. There is no "showing
48 of N" message and no next page. `globals.css` even carries unused
`.catalog-toolbar` styling, suggesting the control bar was designed and never
built.

**Fix.** Add the result count and pagination first (they bound the data
correctness problem), then sort and category filtering. Keep filter state in the
URL so it is shareable and indexable.

---

### BUG-15 — The whole product grid sits inside a live region

```jsx
<section className="section" aria-live="polite">
```

The live region wraps the entire grid. Measured on a client-side navigation to
`/tr/products`: **252 characters** of content inside the `aria-live` element.
Live regions are for incremental updates; announcing a whole page of content
this way is disruptive and drowns out genuinely dynamic messages.

**Fix.** Remove `aria-live` from the section and attach a small dedicated status
region (`role="status"`) for real updates — filter results, add-to-cart
confirmations.

---

## 🔵 Low

### BUG-16 — No breadcrumbs on product detail

The only upward navigation is a single "Ürünlere dön" text link. There is no
`nav` breadcrumb and no `BreadcrumbList` structured data, despite the schema
supporting a full category tree (`Category`, `ProductCategory`) and the page
already emitting `Product`/`ProductGroup` JSON-LD.

### BUG-17 — Misleading landmark labels

The header's primary navigation is labelled with the text of one of its own
links, and the footer navigation is labelled "Ana sayfa":

```jsx
<nav className="primary-nav" aria-label={copy.products}>   // "Ürünler"
<nav aria-label={labels.home}>                             // "Ana sayfa"
```

A screen-reader landmark list reads "Ürünler navigation" and "Ana sayfa
navigation" — both describe a single destination inside the landmark rather than
the landmark's purpose. Use "Ana menü" / "Alt menü" (main / footer navigation).

### BUG-18 — Stock urgency is invisible on catalog cards

`ProductCard` renders the same "Stokta" badge for 115 units and for 2 units. The
detail page shows the exact count (`2 adet mevcut`); the card, where browsing
decisions are actually made, does not. Scarcity signalling is standard
conversion practice and the data is already loaded.

### BUG-19 — `.env.example` documents a Web Vitals endpoint that does not exist

```
# NEXT_PUBLIC_WEB_VITALS_ENDPOINT="/api/web-vitals"
```

There is no `route.ts` anywhere in `src/app`. Uncommenting the documented
example ships a client that beacons every LCP/INP/CLS sample to a dead path:

```
$ curl -s -o /dev/null -w '%{http_code}' -X POST http://127.0.0.1:3000/api/web-vitals
404
```

`WebVitalsReporter` treats a successful `sendBeacon()` queueing as success, so
the failure is invisible in the browser — the RUM data simply never exists.

---

## Process findings

### PROC-01 — CI has no database, so no commerce page is ever rendered

`.github/workflows/ci.yml` sets:

```yaml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ecommerce?schema=public
```

…but declares no `services:` block. There is no PostgreSQL in the job. That is
survivable only because nothing in the pipeline touches the database:

- `npm test` runs pure unit tests over `tests/*.test.mjs`;
- `npm run build` prerenders only the three static home routes — the catalog and
  product pages are `export const dynamic = "force-dynamic"`;
- `npm run test:e2e` visits `/tr`, `/en`, `/de` and nothing else.

**No step in the pipeline has ever rendered the catalog, a product page or the
sitemap.** That is the direct cause of BUG-01 surviving nine phases and of
BUG-08 never being detected: the Phase 9 accessibility scan covers three static
pages and no commerce surface at all.

**Fix.** Add a `services: postgres` block, run `prisma migrate deploy` against
it, seed a fixture and extend the E2E suite over `/products` and
`/products/[slug]`. `tests/audit/` is structured to be adopted for this.

### PROC-02 — Byte-exact screenshot fingerprints are an unstable gate

`tests/e2e/storefront.spec.mjs` asserts `sha256(fullPageScreenshot)` against
committed constants. Running the unmodified suite in a different environment:

```
14 passed, 6 failed
Error: visual regression detected for tr-desktop-chromium
  Expected: "678946e24f716afb177b6ada7782ac25062b064fa94db86b4febf79769b54a05"
  Received: "b5dacdc945f51d98b17e54746571bc4e303e749e6c92a3604caf49d33e09bb38"
```

Every functional assertion in that suite passed; only the six fingerprint
assertions failed, and they failed purely because font rasterization differs
between machines. A single-bit difference produces a completely different hash
with no diff to inspect, so the gate cannot distinguish a real regression from a
Chromium patch bump. It also pins the suite to whichever machine produced the
baselines.

**Fix.** Use Playwright's `toHaveScreenshot()` with `maxDiffPixelRatio`, which
stores the baseline image, produces a visual diff on failure and tolerates
sub-pixel rendering noise.

### PROC-03 — No lockfile was committed *(addressed in this branch)*

`package-lock.json` was untracked. CI runs `npm install` and then uploads the
generated lockfile as a build artifact, so dependency resolution differed
between every CI run and production, and the ranges in `devDependencies`
(`^4.10.2`, `^1.55.0`, `^9.0.0`, `^5.9.0`) could drift silently.

This branch commits the lockfile (548 locked packages, `lockfileVersion` 3,
verified with `npm ci --dry-run`). It is the one finding here that is fixed
rather than only reported, because the audit's own `npm install` produced the
file and leaving it untracked would have been the same defect.

**Remaining.** Switch the CI install step from `npm install` to `npm ci` so the
committed lockfile is actually enforced rather than merely present.

### PROC-04 — `npm run build` mutates tracked files

Next.js rewrites `tsconfig.json` (reformatting it and adding
`.next/dev/types/**/*.ts`) and `next-env.d.ts` during the build, so any build
leaves a dirty working tree and CI cannot assert a clean checkout.

**Fix.** Commit the files in the shape the build produces, or add a CI check
that fails on unexpected drift rather than absorbing it silently.

---

## Suggested order of work

1. **BUG-01** — nothing else matters if a deployed store cannot serve a product.
2. **PROC-01** — put a database in CI, so the fix for BUG-01 is enforced and
   BUG-08 and the rest stay fixed.
3. **BUG-02, BUG-07** — the front door and the error page.
4. **BUG-05, BUG-04** — cart correctness before cart features.
5. **BUG-03** — checkout, the remaining product work.
6. **BUG-06, BUG-08 … BUG-12** — accessibility and localization correctness.
7. **BUG-13 … BUG-19, PROC-02 … PROC-04** — performance, merchandising, hygiene.

## Reproducing this audit

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/ecommerce?schema=public"
export NEXT_PUBLIC_SITE_URL="https://ci.example.invalid"

./tests/audit/fixtures/setup.sh
npm run build
npm run start -- -H 127.0.0.1 -p 3000 &
npm run test:ux-audit
```

Each test in `tests/audit/ux-audit.spec.mjs` is written to pass once the
corresponding defect is fixed, so the suite doubles as the regression gate for
the remediation work.
