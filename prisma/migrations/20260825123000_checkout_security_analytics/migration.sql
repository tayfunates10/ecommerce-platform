CREATE TABLE IF NOT EXISTS "RateLimitBucket" (
  "key" TEXT NOT NULL,
  "windowStart" TIMESTAMPTZ NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("key", "windowStart")
);

CREATE INDEX IF NOT EXISTS "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

CREATE TABLE IF NOT EXISTS "AnalyticsEventDelivery" (
  "id" TEXT PRIMARY KEY,
  "eventName" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "currency" VARCHAR(3),
  "valueMinor" BIGINT,
  "properties" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "AnalyticsEventDelivery_createdAt_idx" ON "AnalyticsEventDelivery"("createdAt");
