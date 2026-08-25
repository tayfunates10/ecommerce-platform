import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const seoSource = await readFile(new URL("../src/lib/seo.ts", import.meta.url), "utf8");
const sitemapSource = await readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8");
const sitemapDataSource = await readFile(new URL("../src/lib/seo-product-data.ts", import.meta.url), "utf8");
const robotsSource = await readFile(new URL("../src/app/robots.ts", import.meta.url), "utf8");
const productSource = await readFile(new URL("../src/app/[locale]/products/[slug]/page.tsx", import.meta.url), "utf8");
const catalogSource = await readFile(new URL("../src/app/[locale]/products/page.tsx", import.meta.url), "utf8");
const merchantSource = await readFile(new URL("../src/lib/merchant-product.ts", import.meta.url), "utf8");

test("hreflang set includes tr, en, de and x-default", () => {
  for (const locale of ["tr", "en", "de", "x-default"]) assert.match(seoSource, new RegExp(`\\"${locale}\\"`));
});

test("database-backed sitemap is runtime-generated from an uncapped translated-product query", () => {
  assert.match(sitemapSource, /dynamic = \"force-dynamic\"/);
  assert.match(sitemapSource, /listSitemapProductSlugs/);
  assert.doesNotMatch(sitemapDataSource, /take:\s*48/);
  assert.match(sitemapDataSource, /translations:\s*\{\s*some:/);
});

test("robots declares sitemap and allows storefront crawling", () => {
  assert.match(robotsSource, /sitemap/);
  assert.match(robotsSource, /allow/);
});

test("catalog and product routes expose localized canonical metadata", () => {
  assert.match(catalogSource, /canonical:/);
  assert.match(catalogSource, /localeAlternates/);
  assert.match(productSource, /canonical:/);
  assert.match(productSource, /getProductTranslationLocales/);
});

test("product structured data supports ProductGroup and escaped JSON-LD", () => {
  assert.match(productSource, /ProductGroup/);
  assert.match(productSource, /hasVariant/);
  assert.ok(productSource.includes("replace(/</g"));
});

test("merchant contract carries required commerce fields", () => {
  for (const field of ["availability", "price", "brand", "mpn", "imageLink"]) assert.match(merchantSource, new RegExp(field));
});

test("canonical origin fails closed instead of defaulting to example.com", () => {
  assert.match(seoSource, /NEXT_PUBLIC_SITE_URL is required/);
  assert.doesNotMatch(seoSource, /https:\/\/example\.com/);
});
