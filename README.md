# ecommerce-platform

Production-first, multilingual (TR/EN/DE) ecommerce platform focused on technical SEO, Core Web Vitals, accessibility, conversion performance and safe CI/CD delivery.

## Canonical project status

- **Verified completion on `main`: 5%**
- **Remaining on `main`: 95%**
- **Current phase:** Production Foundation
- **Current PR:** #2 — `foundation/production-baseline`
- **Completion after this PR is verified and merged:** 12%
- **Merge rule:** no phase is counted as complete until its required CI/tests pass and the PR is merged into `main`.

## Roadmap and weights

| Phase | Weight | Status |
| --- | ---: | --- |
| 1. Requirements + architecture decisions | 5% | ✅ Complete |
| 2. Repository foundation + Next.js + CI/CD | 7% | 🟡 PR #2 in progress |
| 3. PostgreSQL + data model + backend | 13% | ⏳ Pending |
| 4. Product/cart/inventory/order commerce core | 16% | ⏳ Pending |
| 5. UI/UX + responsive storefront | 14% | ⏳ Pending |
| 6. TR/EN/DE + technical SEO | 14% | ⏳ Pending |
| 7. Media + Core Web Vitals | 10% | ⏳ Pending |
| 8. Checkout + security + analytics | 10% | ⏳ Pending |
| 9. E2E/a11y/visual regression certification | 7% | ⏳ Pending |
| 10. Production certification + release | 4% | ⏳ Pending |
| **Total** | **100%** | **5% verified** |

## Phase 2 — Production Foundation

Implemented on PR #2:

- Next.js **16.2.11 Active LTS** pinned for the current security baseline.
- React / React DOM 19.2 pinned.
- Strict TypeScript configuration.
- App Router and Server Component-first structure.
- TR/EN/DE canonical locale configuration.
- Locale-aware `proxy.ts`; default storefront locale is Turkish (`/tr`).
- Accessible locale root layout, skip-link and semantic storefront shell.
- Product catalog route foundation.
- Responsive CSS guardrails designed to prevent horizontal overflow.
- Fluid typography and responsive container rules.
- Reduced-motion and keyboard focus accessibility primitives.
- AVIF/WebP image defaults.
- ESLint + typecheck + Node test + production build scripts.
- GitHub Actions CI quality workflow.

### Required Phase 2 gates

- [ ] Dependency installation succeeds
- [ ] ESLint passes with zero warnings
- [ ] TypeScript typecheck passes
- [ ] Foundation tests pass
- [ ] Production build passes
- [ ] PR review/diff has no blocking defect
- [ ] PR #2 merged to `main`

Only after every item above is satisfied will this README report **12% verified / 88% remaining**.

## Progress reporting rule

Every implementation phase must update this README with:

1. completed work,
2. tests and CI results,
3. PR/review/merge state,
4. verified total completion percentage,
5. remaining percentage,
6. the next planned phase.

## Next phase after PR #2

**Phase 3 — PostgreSQL + data model + backend (13%)**

Planned scope includes products, variants, categories, inventory, prices, customers, carts, orders, payments, shipping records, promotions, translations, media and SEO data contracts.
