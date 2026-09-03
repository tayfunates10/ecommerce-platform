# Usage / UI / UX audit — round 2

Second pass over the storefront, run against `main` at `59ddcc6`
("Fix: remediate storefront UX audit findings") after the round-1 findings in
`ux-audit-report.md` were remediated.

**Method.** Identical to round 1: a fresh PostgreSQL 16 database built with the
project's own `prisma migrate deploy`, seeded with `tests/audit/fixtures/`, the
app built with `npm run build` and served with `npm run start`, then driven with
`tests/audit/ux-audit.spec.mjs` (38 tests × desktop Chrome and Pixel 7) plus
targeted probes. Round 2 adds axe WCAG 2.1 A/AA scans, overflow and target-size
measurement on the two routes the suite does not cover — `/[locale]/checkout`
and the new localized 404.

## Headline

| | Round 1 | Round 2 |
| --- | ---: | ---: |
| Audit suite | 45 passed, **31 failed** | **76 passed, 0 failed** |
| Open findings | 23 | 6 (all new) |

**Every round-1 finding is fixed**, with one qualification on BUG-03 explained
below. The remediation is good work: the fixes address root causes rather than
the test assertions, and several went further than the report asked.

Round 2 found **six new defects**, all in the surface the remediation
introduced — checkout, its API, and cart persistence. None of them is a
security or pricing exploit; the server-side revalidation is sound (verified,
see NEW-05).

---

## Round-1 verification

| ID | Round-1 finding | Status | Evidence |
| --- | --- | --- | --- |
| BUG-01 | Migrations do not create the commerce schema | ✅ Fixed | `20260825000000_commerce_baseline` added; `migrate deploy` on an empty DB now yields **24 tables**; catalog/product/sitemap all 200 |
| BUG-02 | Site root returns 404 | ✅ Fixed | `src/proxy.ts` middleware; `/` → **307** → `/tr` |
| BUG-03 | Cart has no path to checkout | ⚠️ **Partially** | Checkout page, form and `/api/checkout` exist and the drawer offers "Ödemeye geç" — but production is hard-disabled; see **NEW-01** |
| BUG-04 | Cart lost on reload | ✅ Fixed | `localStorage` hydration; badge survives F5 |
| BUG-05 | Quantity field deletes lines / accepts 999,999 | ✅ Fixed | Clamped to `[1, available]`; suite B5/B6 pass |
| BUG-06 | Language switcher 404s on untranslated products | ✅ Fixed | EN/DE now resolve to `/en/products` — see **NEW-06** for the residue |
| BUG-07 | 404 page has no `lang`, chrome or localization | ✅ Fixed | `[...missing]` catch-all; `lang="tr"`, header, skip link, "Sayfa bulunamadı" |
| BUG-08 | Image-less card renders an unnamed link | ✅ Fixed | axe `link-name` clean on `/tr/products` |
| BUG-09 | Modal drawer leaves background exposed | ✅ Fixed | suite C9 passes |
| BUG-10 | Cart button announces a bare number | ✅ Fixed | accessible name now "Sepet (1) 1 ürün" |
| BUG-11 | Targets below 24×24 | ✅ Fixed | suite D2 passes; no sub-24px targets on any audited route |
| BUG-12 | Skip link lands under the sticky header | ✅ Fixed | suite C7 passes on Pixel 7 |
| BUG-13 | Above-the-fold catalog images unconditionally lazy | ✅ Fixed | `ProductCard` takes `priority`; catalog passes `priority={index < 3}` |
| BUG-14 | No count, sort, filter, search or pagination | ✅ Fixed | search field + `${count} ürün` result count |
| BUG-15 | Whole grid inside an `aria-live` region | ✅ Fixed | `aria-live` moved onto the small `.catalog-results` count — the correct scope |
| BUG-16 | No breadcrumb on product detail | ✅ Fixed | suite E4 passes |
| BUG-17 | Misleading landmark labels | ✅ Fixed | `copy.mainNav` / `labels.footerNav` |
| BUG-18 | Stock urgency invisible on cards | ✅ Fixed | "Son 2 adet" / "Only 2 left" / "Nur noch 2" at `available ≤ 5` |
| BUG-19 | `.env.example` documents a dead Web Vitals endpoint | ✅ Fixed | path removed from the example |
| PROC-01 | CI has no database | ✅ Fixed | `services: postgres:16` with a health check; CI now runs `setup.sh` **and** `npm run test:ux-audit` |
| PROC-02 | Byte-exact screenshot fingerprints | ✅ Fixed | `toHaveScreenshot()` with committed PNG baselines |
| PROC-03 | No committed lockfile | ✅ Fixed | `npm ci --no-audit --no-fund` — the half round 1 left open |
| PROC-04 | Build mutates tracked files | ✅ Fixed | working tree clean after `npm run build` |

Two fixes deserve specific credit. PROC-01 was closed properly — CI does not
just have a database, it provisions the schema, seeds the fixture and runs the
audit suite as a gate, and adds `prisma migrate diff --exit-code` so schema
drift can never silently return. And BUG-15's fix moved the live region onto
the result count rather than deleting it, which is the answer that actually
serves screen-reader users.

---

## New findings

### 🟠 NEW-01 — Production checkout dead-ends after the whole form is filled

`src/app/api/checkout/route.ts`:

```js
if (process.env.NODE_ENV === "production") {
  return NextResponse.json(
    { ok: false, error: "Payment provider is not configured for production." },
    { status: 503 },
  );
}
```

Failing closed with no payment provider configured is the **right call**. The
defect is everything around it. Under a production build — `npm run build &&
npm run start`, the project's own documented run path — a shopper can:

1. browse the catalog, add to cart, open the drawer, click "Ödemeye geç";
2. land on `/tr/checkout` and fill in email, full name, address, city and
   postal code;
3. press "Siparişi oluştur" — the button is **not disabled**
   (`submitDisabledBefore: false`);
4. and only then receive **`Payment provider is not configured for
   production.`** — raw English, on a Turkish storefront.

```
POST /api/checkout   (valid order, production build)
→ 503  {"ok":false,"error":"Payment provider is not configured for production."}
```

The unavailability is known before the user types anything, and
`checkout-form.tsx` already carries a translated `localNote` explaining it.

**Fix.** Surface the disabled state from the server before data entry — render
the checkout in an explicitly unavailable state with the localized note and no
form, or keep the form but disable submit with the reason attached. Whichever
way, the message the user reads must come from `copy[locale]`.

*Consequence for BUG-03:* the checkout stack is now wired end-to-end and works
in development, but **the storefront still cannot take an order in production.**
Any status claiming checkout is delivered should carry that qualification.

### 🟠 NEW-02 — The checkout page never shows what is being bought

`src/app/[locale]/checkout/page.tsx` renders a hero and `<CheckoutForm />`, and
nothing else. Measured on the filled checkout page:

```
showsProductName: false      showsQuantity: false      showsPrice: false
```

There is no line-item list, no quantity, no unit price, no subtotal and no
total anywhere on the page. The shopper enters their address and presses
"Siparişi oluştur" having last seen a price in the cart drawer on a previous
page.

This is a core commerce expectation, and for a storefront that ships a German
locale it also bears on the EU requirement to present the order and its total
immediately before the order button.

**Fix.** Render an order summary beside the form from `cart.lines` — name, SKU,
quantity, line total, subtotal — and keep it visible on mobile (a collapsed
"N ürün · ₺X" bar that expands is enough).

### 🟡 NEW-03 — Server exception text is rendered verbatim to shoppers

`checkout-form.tsx`:

```js
const data = await response.json();
if (!response.ok || !data.ok || !data.orderNumber) throw new Error(data.error ?? "Checkout failed.");
…
setError(cause instanceof Error ? cause.message : "Checkout failed.");
```

and the API's catch: `const message = error instanceof Error ? error.message : "Checkout failed."`.

So whatever `orchestrateCheckout` throws reaches the user's screen unchanged and
untranslated — `Insufficient inventory.`, `No active price for cart currency.`,
`Purchasable variant not found.`, or any Prisma error surfacing through the same
path. The file has full TR/EN/DE copy; none of it is used on the failure path.

**Fix.** Return a stable machine-readable `code` from the API, map codes to
localized copy in the form, and log the raw message server-side instead of
shipping it.

### 🟡 NEW-04 — A failed submit drops keyboard focus to `<body>`

The submit button carries `disabled={pending}`. Disabling the element that
currently holds focus makes the browser blur it, and focus falls to the document:

```
after failed submit → document.activeElement = BODY
```

A keyboard user who submits and fails is returned to the top of the document and
must tab through the entire header and form again to retry. The error itself is
announced correctly — it carries `role="alert"` — so this is a focus-management
defect, not an announcement one.

**Fix.** Move focus deliberately when the request settles: to the error region
(give it `tabindex="-1"`) on failure, or back to the submit button once it is
re-enabled.

### 🟡 NEW-05 — The persisted cart is trusted for display

`sanitizeStoredLines` in `cart-provider.tsx` validates the *types* of every
stored field, then clamps quantity with
`Math.min(Math.max(1, quantity), available)` — where `available` is itself read
from storage. `unitPrice` is taken from storage verbatim. Editing
`localStorage` and reloading:

```
real product: ₺4.999,90, 115 in stock
displayed after tampering: Sepet (99999) · 99999 ürün · ara toplam ₺999,99
```

**This is not a pricing exploit.** The server re-derives everything at checkout
— `setCartItemQuantity` reads `unitPrice` from the `Price` table and rejects
`available < quantity` with `Insufficient inventory.` — so a tampered cart
cannot buy anything at a wrong price or beyond stock. Verified in the source.

It is still a real defect: the UI confidently displays fabricated prices and
totals, the BUG-05 stock clamp is bypassable, and the shopper only discovers
the mismatch as a raw server error at submit time (compounding NEW-03).

**Fix.** Treat stored lines as identifiers plus quantity only, and re-fetch
price, currency, name and availability from the server on hydration. Persisting
`unitPrice` and `available` buys nothing that a lookup would not.

### 🔵 NEW-06 — The locale switcher silently relocates the shopper

BUG-06's fix stopped the switcher pointing at 404s. On a product translated only
into Turkish, the header now offers:

```
TR → /tr/products/solis-tr-only-urun
EN → /en/products          ← catalog, not this product
DE → /de/products          ← catalog, not this product
```

The link text still reads "EN", with no `aria-disabled`, no title and no
notice. A shopper clicking it expects this product in English and silently lands
on the catalog instead, with no explanation of what happened or why.

**Fix.** Mark the unavailable locales — `aria-disabled` with a short localized
explanation, or keep the redirect and announce it on arrival ("This product is
not available in English; here is the catalog").

---

## What round 2 confirms is clean

Worth recording, because these were the highest-risk areas of the remediation:

- **axe WCAG 2.1 A/AA:** zero violations on `/tr/checkout` (empty and filled)
  and the localized 404, on desktop and Pixel 7.
- **Layout:** no horizontal overflow and no interactive target under 24×24 CSS
  px on either new route, at either viewport.
- **Server-side integrity:** price is sourced from the `Price` table and stock
  is enforced inside a transaction, so the client cart is advisory only.
- **The whole round-1 suite:** 76/76.

## Suggested order of work

1. **NEW-02** — show the order summary; it is the largest gap a real shopper hits.
2. **NEW-01** — surface the production-disabled state before data entry, localized.
3. **NEW-03** — stop rendering raw server text; localize the failure path.
4. **NEW-05** — re-fetch price and availability on cart hydration.
5. **NEW-04, NEW-06** — focus restoration and the locale-switch notice.

## Reproducing

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/ecommerce?schema=public"
export NEXT_PUBLIC_SITE_URL="https://ci.example.invalid"

npx prisma migrate deploy
./tests/audit/fixtures/setup.sh
npm run build
npm run start -- -H 127.0.0.1 -p 3000 &

npm run test:ux-audit          # 76/76
```

The new findings sit outside the suite's current coverage. Extending
`tests/audit/ux-audit.spec.mjs` with a section F for the checkout route — order
summary present, submit disabled when checkout is unavailable, localized error
copy, focus after a failed submit, and hydration from a tampered
`localStorage` — would turn round 2 into a gate the same way round 1 became one.
