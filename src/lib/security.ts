export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
] as const;

export const RATE_LIMIT_POLICIES = {
  checkout: { windowMs: 60_000, maxRequests: 12 },
  payment: { windowMs: 60_000, maxRequests: 8 },
  analytics: { windowMs: 60_000, maxRequests: 120 },
} as const;

export type RateLimitScope = keyof typeof RATE_LIMIT_POLICIES;

export function normalizeRateLimitKey(scope: RateLimitScope, rawKey: string): string {
  const key = rawKey.trim();
  if (!/^[A-Za-z0-9:._-]{8,160}$/.test(key)) {
    throw new TypeError("Invalid rate-limit identity key.");
  }
  return `${scope}:${key}`;
}
