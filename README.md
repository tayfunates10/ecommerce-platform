# ecommerce-platform

Production-first, multilingual (TR/EN/DE) ecommerce platform focused on technical SEO, Core Web Vitals, accessibility, conversion performance and safe CI/CD delivery.

## Canonical project status

- **Verified completion on `main`: 25%**
- **Remaining on `main`: 75%**
- **Current phase:** Product/cart/inventory/order commerce core
- **Current branch:** `commerce/core-services`
- **Active PR:** #4
- **Completion after this phase is verified and merged:** 41%
- **Merge rule:** no phase is counted as complete until its required CI/tests pass and the PR is merged into `main`.
- **Latest verified CI evidence:** run #15 on commit `a1e6b8f` passed dependency installation, Prisma Client generation, Prisma schema validation, ESLint, TypeScript typecheck, commerce tests and production build.
- **Current review status:** CI #15 was green, but merge was intentionally blocked by unresolved review defects covering corrupt inventory state validation and unsupported currency acceptance. Commits `1c31109`, `f341c40` and `e5a0d22` implement fail-closed inventory validation, an explicit supported ISO-4217 currency set (`TRY`, `EUR`, `USD`) and regression tests. A fresh final-HEAD CI run is required before merge.

## Roadmap and weights

| Phase | Weight | Status |
| --- | ---: | --- |
| 1. Requirements + architecture decisions | 5% | ✅ Complete |
| 2. Repository foundation + Next.js + CI/CD | 7% | ✅ Complete — PR #2 merged |
| 3. PostgreSQL + data model + backend | 13% | ✅ Complete — PR #3 merged |
| 4. Product/cart/inventory/order commerce core | 16% | 🟡 In progress — PR #4 |
| 5. UI/UX + responsive storefront | 14% | ⏳ Pending |
| 6. TR/EN/DE + technical SEO | 14% | ⏳ Pending |
| 7. Media + Core Web Vitals | 10% | ⏳ Pending |
| 8. Checkout + security + analytics | 10% | ⏳ Pending |
| 9. E2E/a11y/visual regression certification | 7% | ⏳ Pending |
| 10. Production certification + release | 4% | ⏳ Pending |
| **Total** | **100%** | **25% verified** |

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

## Phase 3 — PostgreSQL + data model + backend

Completed and merged in PR #3.

Verified gates:

- [x] Dependency installation succeeds with Prisma toolchain
- [x] Prisma Client generation succeeds
- [x] Prisma schema validation succeeds
- [x] ESLint passes with zero warnings
- [x] TypeScript typecheck passes
- [x] Foundation/domain tests pass
- [x] Production build passes
- [x] PR review/diff has no blocking defect
- [x] PR #3 merged to `main`

Delivered backend foundation:

- Prisma ORM 7.9.1 with PostgreSQL driver adapter architecture.
- Explicit generated Prisma Client output for Prisma 7.
- PostgreSQL environment contract and production-safe database singleton.
- Product, variant, category and localized translation models.
- Price, inventory, customer, address, cart, order, payment and shipment models.
- Promotion attribution, product media and localized SEO persistence contracts.
- CI gates for Prisma Client generation and schema validation.

## Phase 4 — Product/cart/inventory/order commerce core

Implemented on `commerce/core-services`:

- Inventory availability calculation.
- Fail-closed inventory reservation and release rules.
- Fail-closed validation for persisted inventory state: quantity/reserved must be non-negative safe integers and reserved cannot exceed quantity.
- Integer minor-unit pricing helpers to avoid floating-point money errors.
- Cart line/subtotal calculation with safe-integer overflow protection.
- Explicit supported ISO-4217 currency contract for `TRY`, `EUR` and `USD`; arbitrary three-letter codes are rejected.
- Order idempotency key validation and deterministic request fingerprint contract.
- Database-backed cart item mutation inside a transaction with product, price and available-stock validation.
- Transactional order creation from persisted cart state.
- Deterministic order number derived from the validated idempotency key, making retries resolve to the same order.
- Serializable order transaction boundary.
- Concurrency-safe inventory reservation using one atomic conditional PostgreSQL UPDATE per variant; insufficient stock causes transaction rollback.
- Cart clearing only after order creation succeeds inside the same transaction.
- Prisma-compatible JSON input contracts for shipping and billing checkout payloads.
- Automated tests covering stock, corrupt persisted inventory state, pricing, supported currencies and idempotency behavior.
- Node 22 TypeScript stripping enabled for zero-dependency domain tests with erasable TypeScript syntax.

### Latest Phase 4 CI evidence

CI run #15 on commit `a1e6b8f`:

- Dependency installation: **PASS**
- Prisma Client generation: **PASS**
- Prisma schema validation: **PASS**
- ESLint: **PASS**
- TypeScript typecheck: **PASS**
- Commerce tests: **PASS**
- Production build: **PASS**

Review after CI #15 found two merge blockers that CI did not cover:

1. corrupt persisted inventory state could overstate availability when `reserved` was negative or otherwise invalid;
2. arbitrary three-letter currency codes such as `ABC` could pass the ISO-4217-shaped validation.

Fixes now applied on the branch:

- `1c31109`: validates persisted inventory state and throws `INVALID_STATE` before availability/reservation/release calculations;
- `f341c40`: constrains runtime currency normalization to supported ISO-4217 codes `TRY`, `EUR`, `USD`;
- `e5a0d22`: adds regression tests for negative/oversubscribed/fractional inventory state and invalid currency codes.

A fresh CI run must pass on the new final HEAD before the review gate can be considered satisfied.

### Required Phase 4 gates

- [ ] Dependency installation succeeds on final Phase 4 HEAD
- [ ] Prisma Client generation succeeds on final Phase 4 HEAD
- [ ] Prisma schema validation succeeds on final Phase 4 HEAD
- [ ] Commerce core tests pass on final Phase 4 HEAD
- [ ] ESLint passes with zero warnings on final Phase 4 HEAD
- [ ] TypeScript typecheck passes on final Phase 4 HEAD
- [ ] Production build passes on final Phase 4 HEAD
- [x] Database-backed cart/order transaction services complete
- [x] Concurrency-safe inventory transaction path complete
- [x] Review blockers identified on CI #15 have code fixes and regression coverage
- [ ] PR review/diff has no unresolved blocking defect on final HEAD
- [ ] Phase 4 PR merged to `main`

Only after every item above is satisfied will this README report **41% verified / 59% remaining**.

## Progress reporting rule

Every implementation phase must update this README with:

1. completed work,
2. tests and CI results,
3. PR/review/merge state,
4. verified total completion percentage,
5. remaining percentage,
6. the next planned phase.

## Next phase after Phase 4

**Phase 5 — UI/UX + responsive storefront (14%)**

Planned scope: production storefront components, product/category UX, responsive product gallery, conversion-focused purchase flow, accessible navigation, cart drawer and visual layout quality gates.
