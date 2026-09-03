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
const REQUEST_TIMEOUT_MS = 10_000;

function fail(message) {
  throw new Error(message);
}

function isIpLiteral(hostname) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

function isReservedHostname(hostname) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIpLiteral(host)) return true;

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".test") ||
    host.endsWith(".invalid") ||
    host === "example.com" ||
    host.endsWith(".example.com") ||
    host === "example.net" ||
    host.endsWith(".example.net") ||
    host === "example.org" ||
    host.endsWith(".example.org")
  ) {
    return true;
  }

  return false;
}

function normalizeOrigin(rawValue) {
  const value = rawValue?.trim();
  if (!value) fail("PRODUCTION_URL is required.");

  let url;
  try {
    url = new URL(value);
  } catch {
    fail("PRODUCTION_URL must be a valid absolute URL.");
  }

  if (url.protocol !== "https:") fail("PRODUCTION_URL must use HTTPS.");
  if (url.username || url.password) fail("PRODUCTION_URL must not contain credentials.");
  if (url.pathname !== "/" || url.search || url.hash) {
    fail("PRODUCTION_URL must be an origin only (no path, query or fragment).");
  }
  if (isReservedHostname(url.hostname)) {
    fail("PRODUCTION_URL must point to a real public production hostname.");
  }

  return url.origin;
}

function normalizeReleaseSha(rawValue) {
  const value = rawValue?.trim();
  if (!value || !/^[0-9a-f]{40}$/i.test(value)) {
    fail("RELEASE_SHA must be the exact 40-character Git commit SHA being certified.");
  }
  return value.toLowerCase();
}

async function fetchChecked(url, label, expectedOrigin) {
  let response;
  try {
    response = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "ecommerce-platform-production-certifier/1.1" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error?.name === "TimeoutError" ? "timed out" : "failed";
    fail(`${label} request ${reason}.`);
  }

  if (!response.ok) fail(`${label} returned HTTP ${response.status}.`);

  const finalUrl = new URL(response.url);
  if (finalUrl.protocol !== "https:") fail(`${label} redirected away from HTTPS.`);
  if (finalUrl.origin !== expectedOrigin) {
    fail(`${label} redirected away from the certified production origin.`);
  }

  return response;
}

function getLinkTags(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);
}

function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"));
  return match?.[1] ?? null;
}

function normalizeHref(value, origin) {
  if (!value) return null;
  try {
    return new URL(value, origin).href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function assertSeoLinks(html, origin, locale) {
  const tags = getLinkTags(html);
  const canonicalTag = tags.find((tag) => /\brel=["']canonical["']/i.test(tag));
  const canonical = canonicalTag ? normalizeHref(getAttribute(canonicalTag, "href"), origin) : null;
  const expectedCanonical = `${origin}/${locale}`;

  if (canonical !== expectedCanonical) {
    fail(`${locale} canonical mismatch: expected ${expectedCanonical}, received ${canonical ?? "missing"}.`);
  }

  const alternates = new Map();
  for (const tag of tags) {
    if (!/\brel=["']alternate["']/i.test(tag)) continue;
    const hreflang = getAttribute(tag, "hreflang") ?? getAttribute(tag, "hrefLang");
    const href = normalizeHref(getAttribute(tag, "href"), origin);
    if (hreflang && href) alternates.set(hreflang.toLowerCase(), href);
  }

  const expectedAlternates = new Map([
    ["tr", `${origin}/tr`],
    ["en", `${origin}/en`],
    ["de", `${origin}/de`],
    ["x-default", `${origin}/tr`],
  ]);

  for (const [hreflang, expectedHref] of expectedAlternates) {
    const actual = alternates.get(hreflang);
    if (actual !== expectedHref) {
      fail(`${locale} hreflang=${hreflang} mismatch: expected ${expectedHref}, received ${actual ?? "missing"}.`);
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

const productionUrl = process.env.PRODUCTION_URL?.trim() || process.argv[2];
const origin = normalizeOrigin(productionUrl);
const releaseSha = normalizeReleaseSha(process.env.RELEASE_SHA);
const evidenceOutput = process.env.RELEASE_EVIDENCE_OUTPUT?.trim() || null;
const startedAt = new Date().toISOString();
const checks = [];

for (const locale of LOCALES) {
  const url = `${origin}/${locale}`;
  const response = await fetchChecked(url, `${locale} storefront`, origin);
  assertSecurityHeaders(response, `${locale} storefront`);
  const html = await response.text();
  assertSeoLinks(html, origin, locale);
  checks.push({ check: `storefront:${locale}`, status: "PASS", url });
}

const robotsUrl = `${origin}/robots.txt`;
const robotsResponse = await fetchChecked(robotsUrl, "robots.txt", origin);
assertSecurityHeaders(robotsResponse, "robots.txt");
const robots = await robotsResponse.text();
if (!robots.includes(`${origin}/sitemap.xml`)) {
  fail("robots.txt does not advertise the production sitemap URL.");
}
checks.push({ check: "robots", status: "PASS", url: robotsUrl });

const sitemapUrl = `${origin}/sitemap.xml`;
const sitemapResponse = await fetchChecked(sitemapUrl, "sitemap.xml", origin);
assertSecurityHeaders(sitemapResponse, "sitemap.xml");
const sitemap = await sitemapResponse.text();
for (const locale of LOCALES) {
  if (!sitemap.includes(`${origin}/${locale}`)) {
    fail(`sitemap.xml is missing the ${locale} storefront URL.`);
  }
}
checks.push({ check: "sitemap", status: "PASS", url: sitemapUrl });

const evidence = {
  schema: "ecommerce-production-public-smoke-v1",
  decision: "PASS",
  scope: "public-production-smoke-only",
  releaseSha,
  origin,
  requestTimeoutMs: REQUEST_TIMEOUT_MS,
  startedAt,
  verifiedAt: new Date().toISOString(),
  checks,
};

if (evidenceOutput) {
  await writeFile(evidenceOutput, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(evidence, null, 2));
