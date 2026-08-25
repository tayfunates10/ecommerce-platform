# ecommerce-platform

Production-first, multilingual (TR/EN/DE) ecommerce platform focused on technical SEO, Core Web Vitals, accessibility, conversion performance and safe CI/CD delivery.

## Canonical project status

- **Verified completion on `main`: 89%**
- **Remaining on `main`: 11%**
- **Current phase:** Phase 9 — E2E / accessibility / visual regression certification
- **Current branch:** `qa/e2e-a11y-visual`
- **Active PR:** PR #9 — browser certification
- **Completion after Phase 9 is verified and merged:** 96%
- **Merge rule:** no phase is counted as complete until required CI/tests pass, review blockers are resolved and the PR is merged into `main`.
- **Latest verified merge:** PR #8 merged to `main` as `778ba649` after final exact-head CI #86 passed and all review threads were resolved.

## Roadmap and weights

| Phase | Weight | Status |
| --- | ---: | --- |
| 1. Requirements + architecture decisions | 5% | ✅ Complete |
| 2. Repository foundation + Next.js + CI/CD | 7% | ✅ Complete — PR #2 merged |
| 3. PostgreSQL + data model + backend | 13% | ✅ Complete — PR #3 merged |
| 4. Product/cart/inventory/order commerce core | 16% | ✅ Complete — PR #4 merged |
| 5. UI/UX + responsive storefront | 14% | ✅ Complete — PR #5 merged |
| 6. TR/EN/DE + technical SEO | 14% | ✅ Complete — PR #6 merged |
| 7. Media + Core Web Vitals | 10% | ✅ Complete — PR #7 merged after CI #74 |
| 8. Checkout + security + analytics | 10% | ✅ Complete — PR #8 merged after CI #86 |
| 9. E2E/a11y/visual regression certification | 7% | 🟡 Active |
| 10. Production certification + release | 4% | ⏳ Pending |
| **Total** | **100%** | **89% verified on `main`** |

## Completed phases

### Phase 2 — Production Foundation
Merged in PR #2 after dependency installation, ESLint, TypeScript typecheck, foundation tests and production build passed.

### Phase 3 — PostgreSQL + data model + backend
Merged in PR #3 after Prisma Client generation, Prisma schema validation, lint, typecheck, domain tests and production build passed.

### Phase 4 — Commerce Core
Merged in PR #4 after final CI #19 passed and all review threads were resolved. Includes product/cart/inventory/order rules, transactional order creation and concurrency-safe inventory reservation.

### Phase 5 — Responsive Storefront
Merged in PR #5 after final CI #37 passed and review blockers were resolved. Includes real catalog/product data, responsive product UI and accessible cart interactions.

### Phase 6 — TR/EN/DE + Technical SEO
Merged in PR #6 after CI #57 passed. Includes fail-closed canonical origin, localized canonical/hreflang metadata, complete translated-product sitemap, robots policy, Product/ProductGroup JSON-LD, Merchant Center contract and crawl/indexation tests.

### Phase 7 — Media + Core Web Vitals
Merged in PR #7 as `5f7bed01` after exact-head CI #74 passed and all review threads were resolved.

Delivered: LCP/INP/CLS engineering budgets, AVIF/WebP media policy, responsive/lazy media, product-detail LCP priority, deferred video, privacy-minimal Web Vitals RUM, same-origin transport validation, Webpack production build, post-build DOM and modern-browser initial-JS enforcement, dynamic route coverage and unchanged **150KB gzip initial-JS** gate.

### Phase 8 — Checkout + security + analytics
Merged in PR #8 as `778ba649` after production-path CI #85 and final README-evidence CI #86 both passed and all review threads were resolved.

Delivered: fail-closed payment boundary, validated payment fingerprints/callbacks, PostgreSQL-backed distributed rate limiting, consent-aware analytics persistence, hardened security headers/CSP, production checkout orchestration and regression coverage.

## Phase 9 — E2E / accessibility / visual regression certification

Active branch: `qa/e2e-a11y-visual`.

Implemented in the active branch:

- Playwright browser certification harness;
- desktop Chromium and Pixel 7 mobile viewport projects;
- TR/EN/DE localized home-route E2E coverage;
- WCAG 2 A/AA + WCAG 2.1 A/AA automated axe scans;
- keyboard skip-link/focus certification;
- locale-navigation regression coverage;
- horizontal-overflow and key-layout visual-contract checks;
- full-page screenshot evidence attached per locale/viewport;
- Playwright HTML report, traces/videos on failure and browser-certification artifacts retained by CI.

### Latest CI evidence

- CI #88 passed dependency install, Prisma generate/validate, lint, typecheck, all **24/24 unit/domain tests**, production build and performance budgets.
- Browser certification then ran **20 tests**; 14 passed and the six TR/EN/DE desktop/mobile keyboard skip-navigation cases failed because `#main-content` was not programmatically focusable after activating the skip link.
- Production accessibility fix applied on all storefront `main#main-content` targets using `tabIndex={-1}`. The browser test itself was not weakened.
- A fresh exact-head CI run is required before merge.

### Required Phase 9 gates

- [x] Browser E2E harness added
- [x] Desktop + mobile viewport coverage added
- [x] TR/EN/DE storefront smoke coverage added
- [x] Automated accessibility scans added
- [x] Keyboard/focus checks added
- [x] Visual layout contract + screenshot evidence added
- [x] CI wired to install Chromium and enforce browser suite
- [ ] Exact-head CI passes all legacy + browser certification gates
- [ ] Review blockers resolved
- [ ] Phase 9 PR merged to `main`

Phase 9 carries **7%**. It moves verified completion from **89% to 96% only after all required gates pass and the Phase 9 PR is merged**.

## Progress reporting rule

Every implementation phase updates this README with completed work, tests/CI results, PR/review/merge state, verified completion percentage, remaining percentage and the next planned phase.

## Next phase after Phase 9

**Phase 10 — Production certification + release (4%)**

Planned scope: production environment contract, migration/release checklist, security/performance/SEO/a11y final gates, deployment/release evidence, rollback/readiness verification and final production certification.
