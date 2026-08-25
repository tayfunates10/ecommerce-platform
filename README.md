# ecommerce-platform

Production-first, multilingual (TR/EN/DE) ecommerce platform focused on technical SEO, Core Web Vitals, accessibility, conversion performance and safe CI/CD delivery.

## Canonical project status

- **Verified completion on `main`: 55%**
- **Remaining on `main`: 45%**
- **Current phase:** TR/EN/DE + technical SEO
- **Current branch:** `seo/i18n-foundation`
- **Active PR:** #6 — SEO: multilingual technical foundation
- **Completion after this phase is verified and merged:** 69%
- **Merge rule:** no phase is counted as complete until its required CI/tests pass and the PR is merged into `main`.
- **Latest verified CI evidence:** Phase 6 final implementation HEAD `dc72a048` passed CI run #56: dependency installation, Prisma Client generation/schema validation, ESLint, TypeScript typecheck, tests and production build all succeeded.
- **Review status:** all four Phase 6 review threads are resolved; no unresolved blocking review thread remains.
- **Latest verified merge:** PR #5 merged to `main` as commit `5946c36d`.

## Roadmap and weights

| Phase | Weight | Status |
| --- | ---: | --- |
| 1. Requirements + architecture decisions | 5% | ✅ Complete |
| 2. Repository foundation + Next.js + CI/CD | 7% | ✅ Complete — PR #2 merged |
| 3. PostgreSQL + data model + backend | 13% | ✅ Complete — PR #3 merged |
| 4. Product/cart/inventory/order commerce core | 16% | ✅ Complete — PR #4 merged |
| 5. UI/UX + responsive storefront | 14% | ✅ Complete — PR #5 merged after CI #37 |
| 6. TR/EN/DE + technical SEO | 14% | 🟢 Merge candidate — implementation HEAD passed CI #56, review blockers resolved |
| 7. Media + Core Web Vitals | 10% | ⏳ Pending |
| 8. Checkout + security + analytics | 10% | ⏳ Pending |
| 9. E2E/a11y/visual regression certification | 7% | ⏳ Pending |
| 10. Production certification + release | 4% | ⏳ Pending |
| **Total** | **100%** | **55% verified on `main`** |

## Completed phases

### Phase 2 — Production Foundation
Merged in PR #2 after dependency installation, ESLint, TypeScript typecheck, foundation tests and production build passed.

### Phase 3 — PostgreSQL + data model + backend
Merged in PR #3 after Prisma Client generation, Prisma schema validation, lint, typecheck, domain tests and production build passed.

### Phase 4 — Product/cart/inventory/order commerce core
Merged in PR #4 after final CI run #19 passed and all review threads were resolved.

### Phase 5 — UI/UX + responsive storefront
Merged in PR #5 after final CI run #37 passed and review blockers were resolved.

Delivered: accessible responsive storefront shell, real database-backed product listing/detail read model, localized TR/EN/DE navigation, stock-aware purchase controls, cart drawer interactions, responsive safeguards and honest empty states.

## Phase 6 — TR/EN/DE + technical SEO

Active branch: `seo/i18n-foundation`.

Implemented:

- shared production site URL / absolute URL SEO helpers;
- fail-closed canonical origin requiring an explicit HTTPS `NEXT_PUBLIC_SITE_URL`;
- localized canonical URL construction;
- reciprocal TR/EN/DE hreflang plus `x-default` helpers;
- product hreflang restricted to translations that actually exist;
- locale-layout metadata base, canonical, alternates and Open Graph metadata;
- localized catalog SEO metadata template;
- production `robots.ts` policy with sitemap declaration;
- localized runtime sitemap for home, catalog and every translated active product URL without the storefront 48-item cap or build-time database dependency;
- localized product metadata generated from real product data;
- Product JSON-LD with SKU, brand, image and Offer price/currency/availability;
- ProductGroup/hasVariant JSON-LD for products with multiple sellable variants;
- Merchant Center-compatible normalized product data contract;
- crawl/indexation regression tests for hreflang, robots, sitemap completeness, canonical metadata, structured data, fail-closed origin and merchant fields;
- JSON-LD `<` escaping to avoid script-breakout injection;
- duplicate JSON-LD field construction removed after CI #54 TypeScript validation caught spread overwrite risk.

### Required Phase 6 gates

- [x] Dependency installation passes on final implementation HEAD — CI #56
- [x] Prisma Client generation/validation passes — CI #56
- [x] ESLint passes with zero warnings — CI #56
- [x] TypeScript typecheck passes — CI #56
- [x] Tests pass — CI #56
- [x] Production build passes — CI #56
- [x] Localized canonical URL foundation
- [x] Reciprocal TR/EN/DE hreflang + x-default foundation
- [x] Product hreflang only targets available translations
- [x] robots policy + runtime sitemap endpoint
- [x] Complete translated-product sitemap query without 48-item storefront cap
- [x] Product structured data foundation using real commerce data
- [x] ProductGroup/variant structured data where multiple sellable variants exist
- [x] Catalog/product SEO templates completed
- [x] Merchant Center-compatible product data contract
- [x] Crawl/indexation quality tests
- [x] PR review/diff blockers identified so far are resolved
- [ ] Phase 6 PR merged to `main`

The implementation HEAD passed all required quality gates. This documentation-only progress commit must also pass repository CI before PR #6 is merged. Only after merge will this README report **69% verified / 31% remaining**.

## Progress reporting rule

Every implementation phase must update this README with completed work, tests/CI results, PR/review/merge state, verified completion percentage, remaining percentage and the next planned phase.

## Next phase after Phase 6

**Phase 7 — Media + Core Web Vitals (10%)**

Planned scope: responsive AVIF/WebP image delivery, media budgets, video loading strategy, font and LCP hardening, script/DOM budgets, RUM hooks and automated Core Web Vitals regression gates.
