# ecommerce-platform

Production-first, multilingual (TR/EN/DE) ecommerce platform focused on technical SEO, Core Web Vitals, accessibility, conversion performance, transactional commerce safety and fail-closed CI/CD delivery.

## Canonical project status

- **Verified completion on `main`: 96%**
- **Remaining: 4%**
- **Verified phase state:** Phases 1–9 complete; Phase 10 production certification/release remains open.
- **Current quality-remediation branch:** `fix/ux-audit-remediation`
- **Active remediation PR:** PR #12 — `Fix: remediate storefront UX audit findings`
- **Production-release PR:** PR #10 — `Release: production certification and final readiness` (must be synchronized with `main` after remediation and still requires real production evidence).
- **Latest `main` merge:** PR #11 usage/UI/UX audit merged as `fa00bcff` on top of the verified Phase 9 merge `61fe9ccf`.
- **Progress rule:** fixes/audits do not increase the phase percentage. The project moves from **96% to 100% only after Phase 10 has real production deployment/readiness evidence, final CI is green and the release PR is merged.**

## Roadmap and weights

| Phase | Weight | Status |
| --- | ---: | --- |
| 1. Requirements + architecture decisions | 5% | ✅ Complete |
| 2. Repository foundation + Next.js + CI/CD | 7% | ✅ Complete — PR #2 |
| 3. PostgreSQL + data model + backend | 13% | ✅ Complete — PR #3 |
| 4. Product/cart/inventory/order commerce core | 16% | ✅ Complete — PR #4 |
| 5. UI/UX + responsive storefront | 14% | ✅ Complete — PR #5 |
| 6. TR/EN/DE + technical SEO | 14% | ✅ Complete — PR #6 |
| 7. Media + Core Web Vitals | 10% | ✅ Complete — PR #7 |
| 8. Checkout + security + analytics | 10% | ✅ Complete — PR #8 |
| 9. E2E/a11y/visual regression certification | 7% | ✅ Complete — PR #9, CI #97 |
| 10. Production certification + release | 4% | 🟡 Active / production evidence blocked |
| **Total** | **100%** | **96% verified on `main`** |

## Verified phase history

- **Phase 2:** production Next.js/TypeScript/CI foundation.
- **Phase 3:** PostgreSQL/Prisma commerce data model and backend foundation.
- **Phase 4:** transactional cart, inventory, pricing and order core.
- **Phase 5:** responsive database-backed storefront and accessible cart UI.
- **Phase 6:** localized canonical/hreflang, sitemap/robots, Product/ProductGroup JSON-LD and Merchant contract.
- **Phase 7:** AVIF/WebP media policy, deferred media, CWV engineering budgets and 150KB gzip initial-JS gate.
- **Phase 8:** fail-closed payment boundary, distributed PostgreSQL rate limiting, analytics persistence, hardened security headers and checkout orchestration.
- **Phase 9:** Playwright desktop/mobile TR/EN/DE certification, axe WCAG checks, keyboard/focus coverage and committed screenshot regression evidence. PR #9 merged as `61fe9ccf` after exact-head CI #97 success.

## Usage / UI / UX audit remediation

PR #11 added the reproducible audit harness and findings report, then merged to `main` as `fa00bcff`. The initial database-backed audit result was **45 passed / 31 failed (76 total)**.

PR #12 remediates those findings without weakening the assertions. Implemented work includes:

- reviewed full commerce baseline migration plus the existing checkout/security migration;
- PostgreSQL 16 CI service, migration deploy from an empty database and Prisma/database **zero-drift** enforcement;
- lockfile-enforced `npm ci` and a tracked-file clean-production-build gate;
- audit fixtures that use the committed migration path and real DB-backed catalog data;
- correct `src/proxy.ts` locale routing, localized catch-all 404 behavior and navigable not-found UX;
- persistent cart state, bounded quantities, explicit item removal and server-side stock/price revalidation;
- cart → localized checkout → existing commerce orchestrator integration, with production payment remaining fail-closed without a configured real gateway;
- locale-switch dead-end protection for partially translated products;
- accessible drawer inert/focus behavior, named media links, distinguishable landmarks and keyboard skip navigation;
- catalog search, result count, pagination, above-the-fold image priority and specific low-stock messaging;
- product breadcrumbs plus `BreadcrumbList` structured data;
- responsive touch targets, 200% reflow support and narrow-phone sticky-header compaction;
- Playwright `toHaveScreenshot()` pixel-diff baselines for TR/EN/DE desktop + mobile instead of brittle byte-level image hashes;
- CI restored to **`contents: read`** after the one-time baseline bootstrap.

### Latest remediation evidence

Exact remediation HEAD `4d9b7a8aa473a502b3eb17b00f3d2cade23a7628` passed **CI #153** before this README evidence commit:

- Prisma generate/validate: ✅
- committed migrations on empty PostgreSQL: ✅
- Prisma/database zero drift: ✅
- audit fixture seed: ✅
- lint: ✅
- typecheck: ✅
- unit/domain tests: **24/24 PASS**
- production build: ✅
- build leaves tracked files clean: ✅
- performance budgets: ✅
- browser E2E/accessibility/visual regression: **20/20 PASS**
- database-backed usage/UI/UX audit: **76/76 PASS**
- review blockers: **0 open**

This README commit requires one fresh exact-head CI run before PR #12 can be merged. PR #12 must not be merged on older CI evidence.

## Phase 10 — Production certification + release (remaining 4%)

PR #10 contains the release contract, migration/release checklist, final security/performance/SEO/a11y/checkout verification, immutable-SHA deployment sequence, rollback requirements and fail-closed production evidence verifier.

The remaining 4% cannot be marked complete using synthetic/example targets. Required real evidence includes a real HTTPS production hostname/deployment target, exact deployed release SHA, production migration result, canonical/hreflang/robots/sitemap/security-header smoke checks, checkout/payment readiness, performance/accessibility smoke evidence and a verified rollback target with database compatibility.

After PR #12 merges, Phase 10 must first be synchronized with the new `main`, revalidated, and only then completed/merged when those real production requirements are satisfied.

## Progress reporting rule

Every stage records completed work, CI/test evidence, total verified percentage, remaining percentage and the next required step. A PR is never merged while its exact-head mandatory CI is pending or red.
