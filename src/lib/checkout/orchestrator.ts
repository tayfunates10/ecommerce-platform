import { db } from "@/lib/db";
import { createOrderFromCart } from "@/lib/commerce/services";
import { RATE_LIMIT_POLICIES } from "@/lib/security";
import { enforceDistributedRateLimit } from "@/lib/rate-limit";
import {
  createPaymentIntent,
  paymentRequestFingerprint,
  type PaymentGateway,
} from "./payment-boundary";

const DECIMAL_MONEY = /^(\d+)(?:\.(\d{1,2}))?$/;

function decimalToMinor(value: string): number {
  const match = DECIMAL_MONEY.exec(value);
  if (!match) throw new RangeError("Order total is not a supported monetary value.");
  const minor = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(minor) || minor <= 0) throw new RangeError("Order total must be a positive safe integer amount.");
  return minor;
}

export type CheckoutInput = {
  cartId: string;
  idempotencyKey: string;
  email: string;
  locale: "TR" | "EN" | "DE";
  shippingData: Record<string, string | number | boolean>;
  billingData: Record<string, string | number | boolean>;
  customerId?: string | null;
  rateLimitIdentity: string;
  returnUrl: string;
  paymentProvider: string;
};

export async function orchestrateCheckout(gateway: PaymentGateway, input: CheckoutInput) {
  const checkoutLimit = await enforceDistributedRateLimit(
    "checkout",
    input.rateLimitIdentity,
    { limit: RATE_LIMIT_POLICIES.checkout.maxRequests, windowMs: RATE_LIMIT_POLICIES.checkout.windowMs },
  );
  if (!checkoutLimit.allowed) throw new Error("Checkout rate limit exceeded.");

  const order = await createOrderFromCart({
    cartId: input.cartId,
    idempotencyKey: input.idempotencyKey,
    email: input.email,
    locale: input.locale,
    shippingData: input.shippingData,
    billingData: input.billingData,
    customerId: input.customerId,
  });

  const amountMinor = decimalToMinor(order.grandTotal.toString());
  const paymentLimit = await enforceDistributedRateLimit(
    "payment",
    input.rateLimitIdentity,
    { limit: RATE_LIMIT_POLICIES.payment.maxRequests, windowMs: RATE_LIMIT_POLICIES.payment.windowMs },
  );
  if (!paymentLimit.allowed) throw new Error("Payment rate limit exceeded.");

  const paymentInput = {
    orderId: order.id,
    amountMinor,
    currency: order.currency,
    idempotencyKey: input.idempotencyKey,
    returnUrl: input.returnUrl,
  };
  const fingerprint = paymentRequestFingerprint(paymentInput);
  const intent = await createPaymentIntent(gateway, paymentInput);

  const existing = await db.payment.findFirst({
    where: {
      orderId: order.id,
      provider: input.paymentProvider,
      providerRef: intent.providerReference,
    },
  });

  const payment = existing ?? await db.payment.create({
    data: {
      orderId: order.id,
      provider: input.paymentProvider,
      providerRef: intent.providerReference,
      status: intent.status === "authorized" ? "AUTHORIZED" : "PENDING",
      amount: order.grandTotal,
      currency: order.currency,
      metadata: {
        requestFingerprint: fingerprint,
        idempotencyKey: input.idempotencyKey,
        returnUrl: input.returnUrl,
      },
    },
  });

  return { order, payment, intent };
}
