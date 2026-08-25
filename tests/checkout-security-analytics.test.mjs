import assert from "node:assert/strict";
import test from "node:test";

import {
  PaymentBoundaryError,
  createPaymentIntent,
  normalizePaymentIntent,
  paymentRequestFingerprint,
} from "../src/lib/checkout/payment-boundary.ts";
import { buildAnalyticsPayload } from "../src/lib/analytics.ts";
import { RATE_LIMIT_POLICIES, SECURITY_HEADERS, normalizeRateLimitKey } from "../src/lib/security.ts";

test("payment boundary normalizes supported currency and fingerprints deterministically", () => {
  const input = {
    orderId: "order_12345678",
    amountMinor: 259900,
    currency: " try ",
    idempotencyKey: "checkout_12345678",
    returnUrl: "https://shop.example/checkout/return",
  };
  assert.equal(normalizePaymentIntent(input).currency, "TRY");
  assert.equal(paymentRequestFingerprint(input), paymentRequestFingerprint({ ...input }));
  assert.throws(
    () => normalizePaymentIntent({ ...input, amountMinor: 0 }),
    (error) => error instanceof PaymentBoundaryError && error.code === "INVALID_REQUEST",
  );
  assert.throws(
    () => normalizePaymentIntent({ ...input, returnUrl: "http://shop.example/return" }),
    PaymentBoundaryError,
  );
});

test("payment boundary rejects malformed provider responses", async () => {
  const input = {
    orderId: "order_12345678",
    amountMinor: 1000,
    currency: "EUR",
    idempotencyKey: "checkout_12345678",
    returnUrl: "https://shop.example/checkout/return",
  };
  await assert.rejects(
    () => createPaymentIntent({ createIntent: async () => ({ providerReference: "bad", status: "authorized" }) }, input),
    (error) => error instanceof PaymentBoundaryError && error.code === "INVALID_PROVIDER_RESPONSE",
  );
});

test("analytics is consent-aware and strips query strings", () => {
  assert.equal(
    buildAnalyticsPayload({ analytics: false }, { name: "view_item", path: "/products/a?email=x@example.com" }),
    null,
  );
  assert.deepEqual(
    buildAnalyticsPayload(
      { analytics: true },
      { name: "purchase", path: "/checkout/success?secret=1", currency: "try", valueMinor: 5000, properties: { item_count: 2 } },
    ),
    {
      name: "purchase",
      path: "/checkout/success",
      currency: "TRY",
      valueMinor: 5000,
      properties: { item_count: 2 },
    },
  );
  assert.throws(
    () => buildAnalyticsPayload({ analytics: true }, { name: "identify_user", path: "/" }),
    TypeError,
  );
});

test("security policies are fail-closed and rate limits are finite", () => {
  const headerMap = new Map(SECURITY_HEADERS.map((entry) => [entry.key, entry.value]));
  assert.match(headerMap.get("Content-Security-Policy") ?? "", /frame-ancestors 'none'/);
  assert.match(headerMap.get("Strict-Transport-Security") ?? "", /max-age=63072000/);
  assert.ok(RATE_LIMIT_POLICIES.payment.maxRequests < RATE_LIMIT_POLICIES.analytics.maxRequests);
  assert.equal(normalizeRateLimitKey("checkout", "customer:12345678"), "checkout:customer:12345678");
  assert.throws(() => normalizeRateLimitKey("payment", "short"), TypeError);
});
