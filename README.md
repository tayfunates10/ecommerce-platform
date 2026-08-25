# ecommerce-platform

Production-first, multilingual (TR/EN/DE) ecommerce platform focused on technical SEO, Core Web Vitals, accessibility, conversion performance and safe CI/CD delivery.

## Canonical project status

- **Verified completion on `main`: 69%**
- **Remaining on `main`: 31%**
- **Current phase:** Phase 7 — Media + Core Web Vitals
- **Current branch:** `perf/media-cwv`
- **Active PR:** #7 — Performance: media and Core Web Vitals foundation
- **Completion after Phase 7 is verified and merged:** 79%
- **Merge rule:** no phase is counted as complete until its required CI/tests pass, review blockers are resolved and the PR is merged into `main`.
- **Latest verified merge:** PR #6 merged to `main` as `a03817b5` after final CI #57 succeeded and all review threads were resolved.

## Roadmap and weights

| Phase | Weight | Status |
| --- | ---: | --- |
| 1. Requirements + architecture decisions | 5% | ✅ Complete |
| 2. Repository foundation + Next.js + CI/CD | 7% | ✅ Complete — PR #2 merged |
| 3. PostgreSQL + data model + backend | 13% | ✅ Complete — PR #3 merged |
| 4. Product/cart/inventory/order commerce core | 16% | ✅ Complete — PR #4 merged |
| 5. UI/UX + responsive storefront | 14% | ✅ Complete — PR #5 merged |
| 6. TR/EN/DE + technical SEO | 14% | ✅ Complete — PR #6 merged after CI #57 |
| 7. Media + Core Web Vitals | 10% | 🟡 Active — PR #7 |
| 8. Checkout + security + analytics | 10% | ⏳ Pending |
| 9. E2E/a11y/visual regression certification | 7% | ⏳ Pending |
| 10. Production certification + release | 4% | ⏳ Pending |
| **Total** | **100%** | **69% verified on `main`** |

## Completed phases

### Phase 2 — Production Foundation
Merged in PR #2 after dependency installation, ESLint, TypeScript typecheck, foundation tests and production build passed.

### Phase 3 — PostgreSQL + data model + backend
Merged in PR #3 after Prisma Client generation, Prisma schema validation, lint, typecheck, domain tests and production build passed.

### Phase 4 — Product/cart/inventory/order commerce core
Merged in PR #4 after final CI run #19 passed and all review threads were resolved.

### Phase 5 — UI/UX + responsive storefront
Merged in PR #5 after final CI run #37 passed and review blockers were resolved.

### Phase 6 — TR/EN/DE + technical SEO
Merged in PR #6 as `a03817b5` after CI #57 passed.

Delivered: fail-closed canonical origin, localized canonical/hreflang metadata, runtime complete translated-product sitemap, robots policy, Product/ProductGroup JSON-LD, Merchant Center-compatible product contract, catalog/product SEO templates, crawl/indexation regression tests and resolved review blockers.

## Phase 7 — Media + Core Web Vitals

Active branch: `perf/media-cwv`.  
Active PR: #7.

Implemented:

- centralized engineering performance budget with targets of LCP <= 1.8s, INP <= 150ms and CLS <= 0.05;
- explicit TTFB <= 500ms, initial client JS <= 150KB gzip and DOM <= 1500 node engineering budgets;
- Next Image AVIF/WebP output with a 75 quality allowlist;
- 30-day optimized-image cache TTL and responsive device/image size buckets;
- catalog product images remain responsive, explicitly lazy-loaded and use the shared image quality budget;
- product-detail hero image remains responsive and priority-loaded as the expected LCP media candidate;
- reusable poster-first video primitive with `preload="none"`, `playsInline` and source injection only when the element approaches the viewport;
- optional privacy-minimal Web Vitals reporter for LCP/INP/CLS only;
- RUM transport is opt-in and restricted to a same-origin path; endpoint validation rejects backslashes and verifies resolved origin;
- `sendBeacon()` now falls back to keepalive `fetch` when the browser refuses to queue the beacon;
- post-build CI budget checker measures DOM nodes and gzip size of client scripts actually referenced by prerendered HTML `<script src>` tags;
- dynamic catalog/product storefront routes are explicitly included through their client-reference manifests, and the catalog DOM envelope is coupled to the exported 48-product storefront limit;
- performance/media regression tests cover CWV budgets, image formats, product-detail LCP priority, same-origin RUM configuration and deferred video behavior;
- `.env.example` documents the required canonical site origin and optional Web Vitals endpoint.

### Latest Phase 7 CI/review status

- CI #60 failed only at ESLint because the deferred-video fallback called `setState` synchronously inside an effect; this was fixed.
- Three review blockers were addressed: dynamic storefront routes are included in the budget gate, backslash-based same-origin escape is rejected, and failed `sendBeacon` calls fall back to `fetch`.
- CI #66 and CI #68 passed dependency install, Prisma generate/validate, ESLint, TypeScript typecheck, all 20 tests and production build, then failed only at the performance-budget gate.
- CI #70 produced the requested exact chunk breakdown and again passed every gate except the unchanged 150KB initial-JS budget.
- CI #70 measured `_global-error` and `_not-found` at **181.9KB gzip** and TR/EN/DE home routes at **190.0KB gzip**.
- The dominant shared startup chunks are approximately **69.3KB + 39.5KB + 38.7KB gzip**, proving the majority of the overage is framework/runtime payload shared even by error pages rather than storefront-only code. Home adds about 8.1KB beyond that common baseline.
- The **150KB initial-JS budget has not been relaxed** and PR #7 remains unmerged.
- As the next production-side optimization, the branch now builds with `next build --webpack` instead of the default Turbopack production build. The intent is to test whether Webpack emits a materially smaller startup runtime while preserving the exact same acceptance threshold and application behavior.
- The exact-HEAD CI following this build-mode change must pass dependency install, Prisma generate/validate, ESLint, TypeScript typecheck, all tests, production build and the unchanged performance-budget gate before Phase 7 can be completed.
- Until that exact-HEAD CI succeeds, the project remains **69% verified / 31% remaining**.

### Required Phase 7 gates

- [x] Central CWV engineering budgets defined
- [x] AVIF/WebP optimized image delivery configured
- [x] Responsive product image sizing policy
- [x] Product-detail LCP image priority policy
- [x] Catalog media lazy-loading policy
- [x] Optimized image cache policy
- [x] Privacy-minimal, opt-in RUM hook
- [x] Same-origin RUM endpoint validation
- [x] Performance regression tests added
- [x] Video lazy-load/poster strategy
- [x] Post-build script/DOM budget enforcement for prerendered pages
- [x] Dynamic catalog/product routes included in performance budget enforcement
- [ ] Initial client JS <= 150KB gzip on all enforced routes
- [ ] Final Phase 7 CI passes on exact HEAD
- [ ] Final PR diff/review has no unresolved blocker
- [ ] Phase 7 PR merged to `main`

Phase 7 carries **10%**. It will move verified completion from **69% to 79% only after all required gates pass and PR #7 is merged**.

## Progress reporting rule

Every implementation phase must update this README with completed work, tests/CI results, PR/review/merge state, verified completion percentage, remaining percentage and the next planned phase.

## Next phase after Phase 7

**Phase 8 — Checkout + security + analytics (10%)**

Planned scope: production checkout orchestration, payment boundary, security headers/CSP/WAF-facing policy, rate limiting, consent-aware first-party analytics and hardened server-side event delivery.
