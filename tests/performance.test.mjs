import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const performanceSource = await readFile(new URL("../src/lib/performance.ts", import.meta.url), "utf8");
const nextConfigSource = await readFile(new URL("../next.config.ts", import.meta.url), "utf8");
const productPageSource = await readFile(new URL("../src/app/[locale]/products/[slug]/page.tsx", import.meta.url), "utf8");
const layoutSource = await readFile(new URL("../src/app/[locale]/layout.tsx", import.meta.url), "utf8");

test("Core Web Vitals engineering budgets stay stricter than good thresholds", () => {
  assert.match(performanceSource, /lcpMs:\s*1800/);
  assert.match(performanceSource, /inpMs:\s*150/);
  assert.match(performanceSource, /cls:\s*0\.05/);
  assert.match(performanceSource, /initialJsGzipKb:\s*150/);
  assert.match(performanceSource, /domNodes:\s*1500/);
});

test("Next image pipeline keeps AVIF and WebP output enabled", () => {
  assert.match(nextConfigSource, /image\/avif/);
  assert.match(nextConfigSource, /image\/webp/);
});

test("product detail LCP image remains explicitly prioritized with responsive sizing", () => {
  assert.match(productPageSource, /sizes="\(max-width: 900px\) 100vw, 50vw"/);
  assert.match(productPageSource, /priority/);
});

test("web vitals collection is opt-in and same-origin constrained", () => {
  assert.match(layoutSource, /NEXT_PUBLIC_WEB_VITALS_ENDPOINT/);
  assert.match(performanceSource, /must be a same-origin absolute path/);
});
