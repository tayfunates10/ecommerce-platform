# Production Certification + Release

This document is the canonical Phase 10 release contract. A production release is not certified until every mandatory gate is evidenced against the exact release commit and real production environment.

## Production environment contract

Required environment variables:

- `DATABASE_URL`: PostgreSQL production connection used by Prisma runtime and `prisma migrate deploy`.
- `NEXT_PUBLIC_SITE_URL`: absolute HTTPS canonical origin for metadata, hreflang, sitemap and robots.

Optional environment variable:

- `NEXT_PUBLIC_WEB_VITALS_ENDPOINT`: same-origin relative endpoint for privacy-minimal Web Vitals delivery. Leave unset to disable runtime reporting.

Production rules:

- never use localhost, `.local`, `.test`, `.invalid`, example domains, IP literals, example credentials or development databases as production evidence;
- `NEXT_PUBLIC_SITE_URL` must use HTTPS and match the public production hostname exactly;
- all required `NEXT_PUBLIC_*` values must be configured **before** the immutable production build is created because Next.js may inline them into static metadata/client bundles;
- secrets must be supplied by the deployment platform and must never be committed;
- schema changes are applied with `npm run db:migrate:deploy`, never `prisma migrate dev`;
- release and rollback are tied to immutable Git commit SHAs.

## Final release gates

- [ ] Exact release HEAD passes Prisma generate + validate
- [ ] Committed migrations apply to an empty PostgreSQL database
- [ ] Prisma/database drift is zero
- [ ] ESLint passes with zero warnings
- [ ] TypeScript typecheck passes
- [ ] Unit/domain tests pass
- [ ] Production build passes and leaves tracked files clean
- [ ] Performance budgets pass
- [ ] Browser E2E passes for TR/EN/DE on desktop + mobile
- [ ] WCAG automated accessibility scans pass
- [ ] Committed Playwright visual regression baselines pass
- [ ] Database-backed 76-assertion usage/UI/UX audit passes
- [ ] Database migrations are reviewed and `prisma migrate deploy` succeeds against the real target environment
- [ ] Every release migration is proven compatible with both the candidate application SHA and the designated rollback application SHA, **or** a separately reviewed/tested database remediation or forward-fix plan exists before promotion
- [ ] Production HTTPS origin, canonical, hreflang, sitemap and robots are verified on the deployed hostname
- [ ] Mandatory security headers are present in production responses and framework disclosure headers remain absent
- [ ] Checkout smoke succeeds through the configured production payment boundary without duplicate order/payment creation
- [ ] Web Vitals reporting is either intentionally disabled or confirmed same-origin
- [ ] Rollback procedure is verified before promotion
- [ ] Deployment evidence records exact Git SHA, migration result, target hostname and verification timestamp

## Deployment sequence

1. Freeze the exact candidate Git SHA after repository-controlled CI/review gates are green.
2. Configure all build-time public environment variables, including `NEXT_PUBLIC_SITE_URL` and, when enabled, `NEXT_PUBLIC_WEB_VITALS_ENDPOINT`.
3. Build the immutable production artifact from that SHA only. Do not mutate `NEXT_PUBLIC_*` values after build and assume the artifact changed.
4. Configure runtime secrets outside Git.
5. Verify migration compatibility with the designated rollback SHA, or approve/test the database remediation/forward-fix plan.
6. Run `npm run db:migrate:deploy` against the target production database.
7. Deploy the immutable build artifact.
8. Verify HTTPS, canonical origin, robots, sitemap, localized storefront routes and security headers.
9. Execute checkout, accessibility and performance smoke checks.
10. Record deployment evidence and promote only if every mandatory gate passes.

## Automated public production smoke evidence

After the exact candidate SHA is deployed to the real public production hostname, run:

```bash
PRODUCTION_URL="https://your-real-production-domain.tld" \
RELEASE_SHA="<40-character-candidate-sha>" \
RELEASE_EVIDENCE_OUTPUT="production-public-smoke.json" \
npm run release:verify:production
```

The hostname in the example is a placeholder. Replace it with the real production hostname. `PRODUCTION_URL` must resolve as a real HTTPS origin. Localhost, reserved/test/example domains, IP literals, credentials, URL paths, query strings and fragments are rejected. `RELEASE_SHA` must be the exact 40-character Git SHA being certified.

The verifier fails closed unless all of the following public checks pass:

- TR/EN/DE storefronts return successful HTTPS responses;
- redirects remain on the exact production origin;
- localized canonical URLs point to that production origin;
- each localized home page advertises correct TR/EN/DE and `x-default` hreflang targets;
- mandatory security headers are present and `X-Powered-By` is absent;
- `robots.txt` advertises the production sitemap;
- `sitemap.xml` is reachable and includes all three localized storefront roots;
- public requests complete inside the verifier timeout instead of hanging indefinitely.

When `RELEASE_EVIDENCE_OUTPUT` is provided, the command writes SHA-bound JSON evidence with schema `ecommerce-production-public-smoke-v1`. A `PASS` covers **only public HTTPS/SEO/security smoke checks**. It does not certify production migrations, rollback/database compatibility, payment idempotency, accessibility or performance promotion gates; those remain independently mandatory.

## Rollback procedure

1. Stop further promotion if a post-deploy gate fails.
2. Confirm the database state is compatible with the designated rollback application SHA. If compatibility is not proven, do **not** perform an app-only rollback; execute the reviewed database remediation/forward-fix plan first.
3. Redeploy the last certified immutable application SHA only when database compatibility is satisfied.
4. Do not automatically reverse database migrations. Database rollback requires an explicit reviewed forward-fix or separately proven reversible migration plan.
5. Re-run production smoke checks on the restored release.
6. Record incident and rollback evidence before another promotion attempt.

## Release evidence record

For each production promotion record:

- release Git SHA;
- CI run identifier and conclusion;
- deployed hostname;
- build-time public environment values relevant to the immutable artifact (non-secret only);
- migration command/result;
- migration compatibility decision for the rollback SHA, or remediation-plan reference;
- deployment timestamp;
- verification timestamp;
- SEO/security/performance/a11y/checkout smoke result;
- rollback target SHA;
- final certification decision: `PASS` or `BLOCKED`.

A release may be marked `PASS` only when every mandatory item above is verified. Any unknown or missing mandatory evidence is `BLOCKED`.
