import { createHash } from "node:crypto";

const SUPPORTED_CURRENCIES = new Set(["TRY", "EUR", "USD"]);
const PROVIDER_REFERENCE = /^[A-Za-z0-9._:-]{8,128}$/;

export type PaymentIntentInput = {
  orderId: string;
  amountMinor: number;
  currency: string;
  idempotencyKey: string;
  returnUrl: string;
};

export type PaymentIntent = {
  providerReference: string;
  status: "requires_action" | "authorized";
  redirectUrl?: string;
};

export interface PaymentGateway {
  createIntent(input: Readonly<PaymentIntentInput>): Promise<PaymentIntent>;
}

export class PaymentBoundaryError extends Error {
  readonly code: "INVALID_REQUEST" | "INVALID_PROVIDER_RESPONSE";

  constructor(code: PaymentBoundaryError["code"], message: string) {
    super(message);
    this.name = "PaymentBoundaryError";
    this.code = code;
  }
}

function assertHttpsReturnUrl(value: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new PaymentBoundaryError("INVALID_REQUEST", "Return URL must be absolute.");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new PaymentBoundaryError("INVALID_REQUEST", "Return URL must use HTTPS without credentials.");
  }
}

export function normalizePaymentIntent(input: PaymentIntentInput): PaymentIntentInput {
  const currency = input.currency.trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.has(currency)) {
    throw new PaymentBoundaryError("INVALID_REQUEST", "Unsupported payment currency.");
  }
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new PaymentBoundaryError("INVALID_REQUEST", "Payment amount must be a positive safe integer.");
  }
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(input.idempotencyKey)) {
    throw new PaymentBoundaryError("INVALID_REQUEST", "Invalid payment idempotency key.");
  }
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(input.orderId)) {
    throw new PaymentBoundaryError("INVALID_REQUEST", "Invalid order identifier.");
  }
  assertHttpsReturnUrl(input.returnUrl);
  return { ...input, currency };
}

export function paymentRequestFingerprint(input: PaymentIntentInput): string {
  const normalized = normalizePaymentIntent(input);
  return createHash("sha256")
    .update(
      `${normalized.orderId}:${normalized.amountMinor}:${normalized.currency}:${normalized.idempotencyKey}:${normalized.returnUrl}`,
    )
    .digest("hex");
}

export async function createPaymentIntent(
  gateway: PaymentGateway,
  input: PaymentIntentInput,
): Promise<PaymentIntent> {
  const normalized = normalizePaymentIntent(input);
  const result = await gateway.createIntent(Object.freeze({ ...normalized }));

  if (!PROVIDER_REFERENCE.test(result.providerReference)) {
    throw new PaymentBoundaryError("INVALID_PROVIDER_RESPONSE", "Payment provider reference is invalid.");
  }
  if (result.status !== "authorized" && result.status !== "requires_action") {
    throw new PaymentBoundaryError("INVALID_PROVIDER_RESPONSE", "Payment provider status is invalid.");
  }
  if (result.status === "requires_action") {
    if (!result.redirectUrl) {
      throw new PaymentBoundaryError("INVALID_PROVIDER_RESPONSE", "Payment action URL is required.");
    }
    let redirect: URL;
    try {
      redirect = new URL(result.redirectUrl);
    } catch {
      throw new PaymentBoundaryError("INVALID_PROVIDER_RESPONSE", "Payment action URL is invalid.");
    }
    if (redirect.protocol !== "https:" || redirect.username || redirect.password) {
      throw new PaymentBoundaryError("INVALID_PROVIDER_RESPONSE", "Payment action URL must be HTTPS.");
    }
  }

  return result;
}
