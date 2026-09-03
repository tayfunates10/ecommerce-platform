import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const formSource = await readFile(new URL("../src/components/storefront/checkout-form.tsx", import.meta.url), "utf8");
const apiSource = await readFile(new URL("../src/app/api/checkout/route.ts", import.meta.url), "utf8");
const cartSource = await readFile(new URL("../src/components/storefront/cart-provider.tsx", import.meta.url), "utf8");

test("checkout failure path keeps keyboard focus recoverable", () => {
  assert.match(formSource, /errorRef\.current\?\.focus\(\)/);
  assert.match(formSource, /role="alert" tabIndex=\{-1\}/);
  assert.doesNotMatch(formSource, /(?:^|\s)disabled=\{pending\}/m);
});

test("checkout UI never renders raw server exception text", () => {
  assert.doesNotMatch(formSource, /data\.error/);
  assert.match(apiSource, /code: checkoutErrorCodes\.unavailable/);
  assert.match(apiSource, /code: checkoutErrorCodes\.failed/);
  assert.doesNotMatch(apiSource, /error:\s*message/);
});

test("persisted cart stores only variant identity and quantity", () => {
  assert.match(cartSource, /lines\.map\(\(\{ variantId, quantity \}\) => \(\{ variantId, quantity \}\)\)/);
  assert.match(cartSource, /fetch\("\/api\/cart\/resolve"/);
});
