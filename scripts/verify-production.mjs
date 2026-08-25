import { writeFile } from "node:fs/promises";

const REQUIRED_SECURITY_HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "x-frame-options",
];

const LOCALES = ["tr", "en", "de"];

function fail(message) {
  throw new Error(message);
}

function normalizeOrigin(rawValue) {
  if (!rawValue) fail("PRODUCTION_URL is required.");

  let url;
  try {
    url = new URL(rawValue);
  } catch {
    fail("PRODUCTION_URL must be a valid absolute URL.");
  }

  if (url.protocol !== "https:") fail("PRODUCTION_URL must use HTTPS.");
  if (url.username || url.password) fail("PRODUCTION_URL must not contain credentials.");
  if (url.pathname !== "/" || url.search || url.hash) {
    fail("PRODUCTION_URL must be an origin only (no path, query or fragment).");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".invalid") ||
    hostname === "example.com" ||
    hostname.endsWith(".example.com") ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  ) {
    fail("PRODUCTION_URL must point to a real production hostname.");
  }

  return url.origin;
}

function normalizeReleaseSha(rawValue) {
  if (!rawValue || !/^[0-9a-f]{40}$/i.test(rawValue)) {
    fail("RELEASE_SHA must be the exact 40-character Git commit SHA being certified.");
  }
  return rawValue.toLowerCase();
}

async function fetchChecked(url, label) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": "ecommerce-platform-production-certifier/1.0" },
  });

  if (!response.ok) fail(`${label} returned HTTP ${response.status}.`);
  if (new URL(response.url).protocol !== "https:") fail(`${label} redirected away from HTTPS.`);
  return response;
}

function getLinkTags(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

function assertSeoLinks(html, origin, locale) {
  const tags = getLinkTags(html);
  const canonicalTag = tags.find((tag) => /\brel=["']canonical["']/i.test(tag));
  const canonical = canonicalTag ? getAttribute(canonicalTag, "href") : null;
  const expectedCanonical = `${origin}/${locale}`;

  if (canonical !== expectedCanonical && canonical !== `${expectedCanonical}/`) {
    fail(`${locale} canonical mismatch: expected ${expectedCanonical}, received ${canonical ?? "missing"}.`);
  }

  const alternates = new Map();
  for (const tag of tags) {
    if (!/\brel=["']alternate["']/i.test(tag)) continue;
    const hreflang = getAttribute(tag, "hreflang") ?? getAttribute(tag, "hrefLang");
    const href = getAttribute(tag, "href");
    if (hreflang && href) alternates.set(hreflang.toLowerCase(), href);
  }

  for (const requiredLocale of [...LOCALES, "x-default"]) {
    if (!alternates.has(requiredLocale)) {
      fail(`${locale} page is missing hreflang=${requiredLocale}.`);
    }
  }
}

function assertSecurityHeaders(response, label) {
  for (const header of REQUIRED_SECURITY_HEADERS) {
    if (!response.headers.get(header)) fail(`${label} is missing security header ${header}.`);
  }

  if (response.headers.get("x-powered-by")) {
    fail(`${label} exposes X-Powered-By.`);
  }
}

const origin = normalizeOrigin(process.env.PRODUCTION_URL ?? process.argv[2]);
const releaseSha = normalizeReleaseSha(process.env.RELEASE_SHA);
const evidenceOutput = process.env.RELEASE_EVIDENCE_OUTPUT?.trim() || null;
const startedAt = new Date().toISOString();
const checks = [];

for (const locale of LOCALES) {
  const url = `${origin}/${locale}`;
  const response = await fetchChecked(url, `${locale} storefront`);
  assertSecurityHeaders(response, `${locale} storefront`);
  const html = await response.text();
  assertSeoLinks(html, origin, locale);
  checks.push({ check: `storefront:${locale}`, status: "PASS", url });
}

const robotsResponse = await fetchChecked(`${origin}/robots.txt`, "robots.txt");
assertSecurityHeaders(robotsResponse, "robots.txt");
const robots = await robotsResponse.text();
if (!robots.includes(`${origin}/sitemap.xml`)) {
  fail("robots.txt does not advertise the production sitemap URL.");
}
checks.push({ check: "robots", status: "PASS", url: `${origin}/robots.txt` });

const sitemapResponse = await fetchChecked(`${origin}/sitemap.xml`, "sitemap.xml");
assertSecurityHeaders(sitemapResponse, "sitemap.xml");
const sitemap = await sitemapResponse.text();
for (const locale of LOCALES) {
  if (!sitemap.includes(`${origin}/${locale}`)) {
    fail(`sitemap.xml is missing the ${locale} storefront URL.`);
  }
}
checks.push({ check: "sitemap", status: "PASS", url: `${origin}/sitemap.xml` });

const evidence = {
  schema: "ecommerce-production-public-smoke-v1",
  decision: "PASS",
  scope: "public-production-smoke-only",
  releaseSha,
  origin,
  startedAt,
  verifiedAt: new Date().toISOString(),
  checks,
  certificationNote:
    "This evidence covers public HTTPS/SEO/security smoke checks only. Migration, rollback compatibility, checkout/payment, accessibility and performance promotion gates remain separately required by docs/production-release.md.",
};

if (evidenceOutput) {
  await writeFile(evidenceOutput, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(evidence, null, 2));
