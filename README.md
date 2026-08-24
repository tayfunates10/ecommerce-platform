# ecommerce-platform

Production-first, multilingual (TR/EN/DE) ecommerce platform focused on technical SEO, Core Web Vitals, accessibility, conversion performance and safe CI/CD delivery.

## Canonical project status

- **Verified completion on `main`: 12%**
- **Remaining on `main`: 88%**
- **Current phase:** PostgreSQL + data model + backend
- **Current PR:** #3 — `backend/postgresql-domain-foundation`
- **Completion after this PR is verified and merged:** 25%
- **Merge rule:** no phase is counted as complete until its required CI/tests pass and the PR is merged into `main`.

## Roadmap and weights

| Phase | Weight | Status |
| --- | ---: | --- |
| 1. Requirements + architecture decisions | 5% | ✅ Complete |
| 2. Repository foundation + Next.js + CI/CD | 7% | ✅ Complete — PR #2 merged |
| 3. PostgreSQL + data model + backend | 13% | 🟡 PR #3 in progress |
| 4. Product/cart/inventory/order commerce core | 16% | ⏳ Pending |
| 5. UI/UX + responsive storefront | 14% | ⏳ Pending |
| 6. TR/EN/DE + technical SEO | 14% | ⏳ Pending |
| 7. Media + Core Web Vitals | 10% | ⏳ Pending |
| 8. Checkout + security + analytics | 10% | ⏳ Pending |
| 9. E2E/a11y/visual regression certification | 7% | ⏳ Pending |
| 10. Production certification + release | 4% | ⏳ Pending |
| **Total** | **100%** | **12% verified** |

## Phase 2 — Production Foundation

Completed and merged in PR #2.

Verified gates:

- [x] Dependency installation succeeds
- [x] ESLint passes with zero warnings
- [x] TypeScript typecheck passes
- [x] Foundation tests pass
- [x] Production build passes
- [x] PR review/diff has no blocking defect
- [x] PR #2 merged to `main`

Delivered foundation:

- Next.js 16.2.11 + React 19.2 production baseline.
- Strict TypeScript, App Router and Server Component-first structure.
- TR/EN/DE locale-ready routing and locale-aware proxy.
- Accessible semantic storefront shell and product route foundation.
- Responsive zero-overflow CSS guardrails, fluid typography and reduced-motion support.
- AVIF/WebP image defaults.
- GitHub Actions gates for install, lint, typecheck, tests and production build.

## Phase 3 — PostgreSQL + data model + backend

Implemented on PR #3 so far:

- Prisma ORM 7.9.1 with PostgreSQL driver adapter architecture.
- Explicit generated Prisma Client output for Prisma 7.
- PostgreSQL environment contract and database scripts.
- Production-safe Prisma singleton with required `DATABASE_URL` fail-closed runtime behavior.
- Product, variant, category and localized translation models.
- Price and inventory models.
- Customer and address models.
- Cart and cart-item persistence models.
- Order, order-item, payment and shipment records.
- Promotion attribution.
- Product media metadata.
- Localized product/category SEO persistence contracts.
- CI gates for Prisma Client generation and schema validation.

### Required Phase 3 gates

- [ ] Dependency installation succeeds with Prisma toolchain
- [ ] Prisma Client generation succeeds
- [ ] Prisma schema validation succeeds
- [ ] ESLint passes with zero warnings
- [ ] TypeScript typecheck passes
- [ ] Foundation/domain tests pass
- [ ] Production build passes
- [ ] PR review/diff has no blocking defect
- [ ] PR #3 merged to `main`

Only after every item above is satisfied will this README report **25% verified / 75% remaining**.

## Progress reporting rule

Every implementation phase must update this README with:

1. completed work,
2. tests and CI results,
3. PR/review/merge state,
4. verified total completion percentage,
5. remaining percentage,
6. the next planned phase.

## Next phase after PR #3

**Phase 4 — Product/cart/inventory/order commerce core (16%)**

Planned scope: repository/services around the persisted domain, product catalog queries, inventory reservation rules, cart mutations, pricing snapshots, order creation/idempotency and transactional stock handling.
