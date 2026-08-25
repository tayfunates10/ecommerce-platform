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
- [ ] Production HTTPS origin, canonical, hreflang, sitemap and robots are verified on the deployed hostname
- [ ] Security headers are present in production responses
- [ ] Checkout smoke test succeeds using the configured production payment boundary without duplicate order/payment creation
- [ ] Web Vitals reporting is either intentionally disabled or confirmed same-origin
- [ ] Rollback procedure is verified before promotion
- [ ] Deployment evidence records exact Git SHA, migration result, target hostname and verification timestamp

## Deployment sequence

1. Freeze the exact candidate Git SHA after all required CI/review gates are green.
2. Build from that SHA only.
3. Configure production secrets and environment variables outside Git.
4. Run `npm run db:migrate:deploy` against the target production database.
5. Deploy the immutable build artifact.
6. Verify HTTPS, canonical origin, robots, sitemap, localized storefront routes and security headers.
7. Execute checkout, accessibility and performance smoke checks.
8. Record deployment evidence and promote the release only if all checks pass.

## Rollback procedure

1. Stop further promotion if a post-deploy gate fails.
2. Redeploy the last certified immutable application SHA.
3. Do not automatically reverse database migrations. Database rollback requires an explicit reviewed forward-fix or a separately proven reversible migration plan.
4. Re-run production smoke checks on the restored release.
5. Record incident and rollback evidence before attempting another promotion.

## Release evidence record

For each production promotion record:

- release Git SHA;
- CI run identifier and conclusion;
- deployed hostname;
- migration command/result;
- deployment timestamp;
- verification timestamp;
- SEO/security/performance/a11y/checkout smoke result;
- rollback target SHA;
- final certification decision: `PASS` or `BLOCKED`.

A release may be marked `PASS` only when every mandatory item above is verified. Any unknown or missing mandatory evidence is `BLOCKED`.
