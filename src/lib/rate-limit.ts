import { db } from "@/lib/db";

export type RateLimitPolicy = {
  limit: number;
  windowMs: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

function assertPolicy(policy: RateLimitPolicy): void {
  if (!Number.isSafeInteger(policy.limit) || policy.limit <= 0) throw new RangeError("Rate limit must be positive.");
  if (!Number.isSafeInteger(policy.windowMs) || policy.windowMs <= 0) throw new RangeError("Rate-limit window must be positive.");
}

function assertIdentity(identity: string): string {
  const normalized = identity.trim();
  if (!/^[A-Za-z0-9._:@-]{3,160}$/.test(normalized)) throw new TypeError("Invalid rate-limit identity.");
  return normalized;
}

export async function enforceDistributedRateLimit(
  namespace: string,
  identity: string,
  policy: RateLimitPolicy,
  now = new Date(),
): Promise<RateLimitDecision> {
  assertPolicy(policy);
  const safeIdentity = assertIdentity(identity);
  const safeNamespace = namespace.trim();
  if (!/^[a-z][a-z0-9_-]{1,39}$/.test(safeNamespace)) throw new TypeError("Invalid rate-limit namespace.");

  const windowStartMs = Math.floor(now.getTime() / policy.windowMs) * policy.windowMs;
  const windowStart = new Date(windowStartMs);
  const expiresAt = new Date(windowStartMs + policy.windowMs);
  const key = `${safeNamespace}:${safeIdentity}`;

  const rows = await db.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimitBucket" ("key", "windowStart", "count", "expiresAt")
    VALUES (${key}, ${windowStart}, 1, ${expiresAt})
    ON CONFLICT ("key", "windowStart") DO UPDATE
      SET "count" = "RateLimitBucket"."count" + 1,
          "expiresAt" = EXCLUDED."expiresAt"
    RETURNING "count"
  `;

  const count = rows[0]?.count;
  if (!Number.isSafeInteger(count) || count <= 0) throw new Error("Rate-limit store returned an invalid count.");

  return {
    allowed: count <= policy.limit,
    remaining: Math.max(0, policy.limit - count),
    retryAfterMs: Math.max(0, expiresAt.getTime() - now.getTime()),
  };
}
