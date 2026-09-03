import { createHash } from "node:crypto";
import type { PaymentGateway, PaymentIntentInput } from "./payment-boundary";

/**
 * Development-only gateway for local end-to-end checkout testing.
 * It must never be selected in a production runtime.
 */
export const localPaymentGateway: PaymentGateway = {
  async createIntent(input: Readonly<PaymentIntentInput>) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Local payment gateway is disabled in production.");
    }

    const reference = createHash("sha256")
      .update(`${input.orderId}:${input.idempotencyKey}:${input.amountMinor}:${input.currency}`)
      .digest("hex")
      .slice(0, 32);

    return {
      providerReference: `local-${reference}`,
      status: "authorized" as const,
    };
  },
};
