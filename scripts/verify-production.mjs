import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function fail(message) {
  throw new Error(message);
}

function isIpLiteral(hostname) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

function canonicalHostname(hostname) {
  return hostname
    .toLowerCase()
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "");
}

function isReservedHostname(hostname) {
  const host = canonicalHostname(hostname);
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

export function normalizeOrigin(rawValue) {
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

export function normalizeReleaseSha(rawValue) {
  const value = rawValue?.trim();
  if (!value || !/^[0-9a-f]{40}$/i.test(value)) {
    fail("RELEASE_SHA must be the exact 40-character Git commit SHA being certified.");
  }
  return value.toLowerCase();
}

async function fetchOnce(url, label, fetchImpl = fetch) {
  try {
    return await fetchImpl(url, {
      redirect: "manual",
      headers: { "user-agent": "ecommerce-platform-production-certifier/1.4" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const reason = error?.name === "TimeoutError" ? "timed out" : "failed";
    fail(`${label} request ${reason}.`);
  }
}

export async function fetchChecked(url, label, expectedOrigin, fetchImpl = fetch) {
  let currentUrl = new URL(url);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    if (currentUrl.protocol !== "https:") fail(`${label} redirected away from HTTPS.`);
    if (currentUrl.origin !== expectedOrigin) {
      fail(`${label} redirected away from the certified production origin.`);
    }

    const response = await fetchOnce(currentUrl, label, fetchImpl);

    if (REDIRECT_STATUSES.has(response.status)) {
      if (redirectCount === MAX_REDIRECTS) fail(`${label} exceeded ${MAX_REDIRECTS} redirects.`);
      const location = response.headers.get("location");
      if (!location) fail(`${label} returned a redirect without a Location header.`);

      let nextUrl;
      try {
        nextUrl = new URL(location, currentUrl);
      } catch {
        fail(`${label} returned an invalid redirect Location.`);
      }

      if (nextUrl.protocol !== "https:") fail(`${label} redirected away from HTTPS.`);
      if (nextUrl.origin !== expectedOrigin) {
        fail(`${label} redirected away from the certified production origin.`);
      }
      currentUrl = nextUrl;
      continue;
    }

    if (!response.ok) fail(`${label} returned HTTP ${response.status}.`);
    return response;
  }

  fail(`${label} exceeded ${MAX_REDIRECTS} redirects.`);
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

export function assertSeoLinks(html, origin, locale) {
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

export function assertSecurityHeaders(response, label) {
  for (const header of REQUIRED_SECURITY_HEADERS) {
    if (!response.headers.get(header)) fail(`${label} is missing security header ${header}.`);
  }

  if (response.headers.get("x-powered-by")) {
    fail(`${label} exposes X-Powered-By.`);
  }
}

export function assertReleaseIdentity(response, label, releaseSha) {
  const deployedSha = response.headers.get("x-release-sha")?.trim().toLowerCase() ?? null;
  if (deployedSha !== releaseSha) {
    fail(`${label} release identity mismatch: expected ${releaseSha}, received ${deployedSha ?? "missing"}.`);
  }
}

export function assertRobotsSitemap(robots, expectedSitemapUrl) {
  const advertised = robots
    .split(/\r?\n/)
    .map((line) => line.replace(/#.*$/, "").trim())
    .filter(Boolean)
    .map((line) => line.match(/^sitemap\s*:\s*(\S+)\s*$/i)?.[1] ?? null)
    .filter(Boolean);

  if (!advertised.includes(expectedSitemapUrl)) {
    fail("robots.txt does not advertise the production sitemap URL with an active Sitemap directive.");
  }
}

export function assertSitemapRoots(sitemap, origin) {
  const locations = new Set(
    [...sitemap.matchAll(/<loc\b[^>]*>\s*([^<]+?)\s*<\/loc>/gi)]
      .map((match) => normalizeHref(match[1], origin))
      .filter(Boolean),
  );

  for (const locale of LOCALES) {
    const expected = `${origin}/${locale}`;
    if (!locations.has(expected)) {
      fail(`sitemap.xml is missing the exact ${locale} storefront root URL.`);
    }
  }
}

export async function runProductionVerification({
  productionUrl,
  releaseSha: releaseShaRaw,
  evidenceOutput = null,
  fetchImpl = fetch,
} = {}) {
  const origin = normalizeOrigin(productionUrl);
  const releaseSha = normalizeReleaseSha(releaseShaRaw);
  const startedAt = new Date().toISOString();
  const checks = [];

  for (const locale of LOCALES) {
    const url = `${origin}/${locale}`;
    const response = await fetchChecked(url, `${locale} storefront`, origin, fetchImpl);
    assertSecurityHeaders(response, `${locale} storefront`);
    assertReleaseIdentity(response, `${locale} storefront`, releaseSha);
    const html = await response.text();
    assertSeoLinks(html, origin, locale);
    checks.push({ check: `storefront:${locale}`, status: "PASS", url });
  }

  const robotsUrl = `${origin}/robots.txt`;
  const robotsResponse = await fetchChecked(robotsUrl, "robots.txt", origin, fetchImpl);
  assertSecurityHeaders(robotsResponse, "robots.txt");
  assertReleaseIdentity(robotsResponse, "robots.txt", releaseSha);
  const robots = await robotsResponse.text();
  assertRobotsSitemap(robots, `${origin}/sitemap.xml`);
  checks.push({ check: "robots", status: "PASS", url: robotsUrl });

  const sitemapUrl = `${origin}/sitemap.xml`;
  const sitemapResponse = await fetchChecked(sitemapUrl, "sitemap.xml", origin, fetchImpl);
  assertSecurityHeaders(sitemapResponse, "sitemap.xml");
  assertReleaseIdentity(sitemapResponse, "sitemap.xml", releaseSha);
  const sitemap = await sitemapResponse.text();
  assertSitemapRoots(sitemap, origin);
  checks.push({ check: "sitemap", status: "PASS", url: sitemapUrl });

  const evidence = {
    schema: "ecommerce-production-public-smoke-v1",
    decision: "PASS",
    scope: "public-production-smoke-only",
    releaseSha,
    origin,
    requestTimeoutMs: REQUEST_TIMEOUT_MS,
    maxRedirects: MAX_REDIRECTS,
    startedAt,
    verifiedAt: new Date().toISOString(),
    checks,
  };

  if (evidenceOutput) {
    await writeFile(evidenceOutput, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  }

  return evidence;
}

async function main() {
  const productionUrl = process.env.PRODUCTION_URL?.trim() || process.argv[2];
  const releaseSha = process.env.RELEASE_SHA;
  const evidenceOutput = process.env.RELEASE_EVIDENCE_OUTPUT?.trim() || null;
  const evidence = await runProductionVerification({ productionUrl, releaseSha, evidenceOutput });
  console.log(JSON.stringify(evidence, null, 2));
}

const isDirectExecution = process.argv[1]
  ? import.meta.url === pathToFileURL(resolve(process.argv[1])).href
  : false;

if (isDirectExecution) {
  try {
    await main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
