import assert from "node:assert/strict";
import test from "node:test";

import {
  InventoryError,
  availableStock,
  releaseInventory,
  reserveInventory,
} from "../src/lib/commerce/inventory.ts";
import {
  cartSubtotalMinor,
  lineTotalMinor,
  money,
  normalizeCurrency,
} from "../src/lib/commerce/pricing.ts";
import {
  buildOrderRequestFingerprint,
  normalizeIdempotencyKey,
} from "../src/lib/commerce/order-idempotency.ts";

test("inventory reserves only available stock and releases safely", () => {
  const initial = { quantity: 10, reserved: 3 };
  assert.equal(availableStock(initial), 7);
  assert.deepEqual(reserveInventory(initial, 4), { quantity: 10, reserved: 7 });
  assert.deepEqual(releaseInventory({ quantity: 10, reserved: 7 }, 2), {
    quantity: 10,
    reserved: 5,
  });
  assert.throws(
    () => reserveInventory(initial, 8),
    (error) => error instanceof InventoryError && error.code === "OUT_OF_STOCK",
  );
});

test("inventory fails closed on corrupt persisted state", () => {
  for (const state of [
    { quantity: 10, reserved: -1 },
    { quantity: -1, reserved: 0 },
    { quantity: 2, reserved: 3 },
    { quantity: 1.5, reserved: 0 },
  ]) {
    assert.throws(
      () => availableStock(state),
      (error) => error instanceof InventoryError && error.code === "INVALID_STATE",
    );
  }
});

test("pricing uses integer minor units and rejects invalid quantities", () => {
  assert.equal(lineTotalMinor({ unitPriceMinor: 1299, quantity: 3 }), 3897);
  assert.equal(
    cartSubtotalMinor([
      { unitPriceMinor: 1299, quantity: 2 },
      { unitPriceMinor: 500, quantity: 1 },
    ]),
    3098,
  );
  assert.deepEqual(money(3098, "try"), { amountMinor: 3098, currency: "TRY" });
  assert.equal(normalizeCurrency(" eur "), "EUR");
  assert.throws(() => normalizeCurrency("ABC"), TypeError);
  assert.throws(() => normalizeCurrency("ZZZ"), TypeError);
  assert.throws(() => lineTotalMinor({ unitPriceMinor: 100, quantity: 0 }));
});

test("order idempotency contract normalizes keys and fingerprints requests", () => {
  assert.equal(normalizeIdempotencyKey("  order-1234  "), "order-1234");
  assert.equal(
    buildOrderRequestFingerprint({
      customerId: "cust-1",
      cartId: "cart-1",
      currency: "try",
      subtotalMinor: 3098,
    }),
    "cust-1:cart-1:TRY:3098",
  );
  assert.throws(() => normalizeIdempotencyKey("short"));
});
