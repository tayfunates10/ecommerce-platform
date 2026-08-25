# Production Certification + Release

This document is the canonical Phase 10 release contract. A production release is not certified until every required gate below is evidenced against the exact release commit.

## Production environment contract

Required environment variables:

- `DATABASE_URL`: PostgreSQL production connection used by Prisma runtime and `prisma migrate deploy`.
- `NEXT_PUBLIC_SITE_URL`: absolute HTTPS canonical origin for metadata, hreflang, sitemap and robots.

Optional environment variable:

- `NEXT_PUBLIC_WEB_VITALS_ENDPOINT`: same-origin relative endpoint for privacy-minimal Web Vitals delivery. Leave unset to disable runtime reporting.

Production rules:

- never use localhost, `.invalid`, example credentials or development databases;
- `NEXT_PUBLIC_SITE_URL` must use HTTPS and match the public production hostname exactly;
- all `NEXT_PUBLIC_*` values required by the release must be configured **before the immutable production build is created**, because Next.js may inline them into static metadata/client bundles at build time;
- secrets must be supplied by the deployment platform and must never be committed;
- schema changes are applied with `npm run db:migrate:deploy`, never `prisma migrate dev`;
- release and rollback are tied to immutable Git commit SHAs.

## Final release gates

- [ ] Exact release HEAD passes Prisma generate + validate
- [ ] ESLint passes with zero warnings
- [ ] TypeScript typecheck passes
- [ ] Unit/domain tests pass
- [ ] Production build passes
- [ ] Performance budgets pass
- [ ] Browser E2E passes for TR/EN/DE on desktop + mobile
- [ ] WCAG automated accessibility scans pass
- [ ] Committed visual regression fingerprints pass
- [ ] Database migrations are reviewed and `prisma migrate deploy` succeeds against the target environment
- [ ] Every release migration is proven compatible with both the candidate application SHA and the designated rollback application SHA, **or** a separately reviewed and tested database remediation/forward-fix plan exists before promotion
- [ ] Production HTTPS origin, canonical, hreflang, sitemap and robots are verified on the deployed hostname
- [ ] Security headers are present in production responses
- [ ] Checkout smoke test succeeds using the configured production payment boundary without duplicate order/payment creation
- [ ] Web Vitals reporting is either intentionally disabled or confirmed same-origin
- [ ] Rollback procedure is verified before promotion
- [ ] Deployment evidence records exact Git SHA, migration result, target hostname and verification timestamp

## Deployment sequence

1. Freeze the exact candidate Git SHA after all required CI/review gates are green.
2. Configure all build-time public environment variables required by the release, including `NEXT_PUBLIC_SITE_URL` and (when enabled) `NEXT_PUBLIC_WEB_VITALS_ENDPOINT`.
3. Build the immutable production artifact from that SHA only. Do not change `NEXT_PUBLIC_*` values after this build and expect the artifact to change.
4. Configure runtime secrets outside Git.
5. Verify migration compatibility with the designated rollback SHA, or approve and test the database remediation/forward-fix plan.
6. Run `npm run db:migrate:deploy` against the target production database.
7. Deploy the immutable build artifact.
8. Verify HTTPS, canonical origin, robots, sitemap, localized storefront routes and security headers.
9. Execute checkout, accessibility and performance smoke checks.
10. Record deployment evidence and promote the release only if all checks pass.

## Rollback procedure

1. Stop further promotion if a post-deploy gate fails.
2. Confirm the database state is compatible with the designated rollback application SHA. If compatibility is not proven, do **not** perform an app-only rollback; execute the reviewed database remediation/forward-fix plan first.
3. Redeploy the last certified immutable application SHA only when the database compatibility requirement is satisfied.
4. Do not automatically reverse database migrations. Database rollback requires an explicit reviewed forward-fix or a separately proven reversible migration plan.
5. Re-run production smoke checks on the restored release.
6. Record incident and rollback evidence before attempting another promotion.

## Release evidence record

For each production promotion record:

- release Git SHA;
- CI run identifier and conclusion;
- deployed hostname;
- build-time public environment values (non-secret) relevant to the artifact;
- migration command/result;
- migration compatibility decision for the rollback SHA, or remediation-plan reference;
- deployment timestamp;
- verification timestamp;
- SEO/security/performance/a11y/checkout smoke result;
- rollback target SHA;
- final certification decision: `PASS` or `BLOCKED`.

A release may be marked `PASS` only when every mandatory item above is verified. Any unknown or missing mandatory evidence is `BLOCKED`.
