const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;

export function normalizeIdempotencyKey(value: string): string {
  const key = value.trim();
  if (!IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new TypeError(
      "Idempotency key must be 8-128 characters and contain only letters, numbers, dot, underscore, colon or hyphen.",
    );
  }
  return key;
}

export function buildOrderRequestFingerprint(input: {
  customerId?: string | null;
  cartId: string;
  currency: string;
  subtotalMinor: number;
}): string {
  const customer = input.customerId?.trim() || "guest";
  const cartId = input.cartId.trim();
  const currency = input.currency.trim().toUpperCase();

  if (!cartId) throw new TypeError("cartId is required.");
  if (!/^[A-Z]{3}$/.test(currency)) throw new TypeError("Invalid currency.");
  if (!Number.isSafeInteger(input.subtotalMinor) || input.subtotalMinor < 0) {
    throw new RangeError("subtotalMinor must be a non-negative safe integer.");
  }

  return `${customer}:${cartId}:${currency}:${input.subtotalMinor}`;
}
