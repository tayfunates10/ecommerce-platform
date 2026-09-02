# Usage / UI / UX audit suite

An exploratory browser suite that exercises the real shopping journey, the
responsive layout, keyboard and screen-reader affordances, and the localized
content surface. Unlike `tests/e2e/storefront.spec.mjs` — which certifies the
three static home routes — this suite drives the database-backed catalog,
product detail and cart, so it needs a seeded database.

It is **not** wired into CI. Its failures are the audit's findings, documented
in `docs/ux-audit-report.md`. Each test is written to pass once the
corresponding defect is fixed, so the suite doubles as a regression gate for the
remediation work.

## Running it

```bash
export DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/ecommerce?schema=public"
export NEXT_PUBLIC_SITE_URL="https://ci.example.invalid"

./tests/audit/fixtures/setup.sh      # schema + catalog fixture + placeholder media
npm run build
npm run start -- -H 127.0.0.1 -p 3000 &

npm run test:ux-audit
```

`PLAYWRIGHT_CHROMIUM_PATH` can point the suite at a pre-installed Chromium when
`npx playwright install` is unavailable.

## Fixture coverage

The seed is chosen to expose real-world catalog states:

| Product | State it exercises |
| --- | --- |
| `aurora-kablosuz-kulaklik` | fully translated, in stock, has media |
| `nimbus-laptop-stand` | low stock (2 available) |
| `vertex-mekanik-klavye` | fully reserved, i.e. out of stock |
| `solis-tr-only-urun` | translated in TR only, media without alt text |
| `zenith-no-image` | translated everywhere, no media at all |
