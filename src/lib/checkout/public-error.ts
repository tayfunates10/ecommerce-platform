export const checkoutErrorCodes = {
  unavailable: "CHECKOUT_UNAVAILABLE",
  invalidRequest: "INVALID_REQUEST",
  failed: "CHECKOUT_FAILED",
} as const;

export type PublicCheckoutErrorCode = (typeof checkoutErrorCodes)[keyof typeof checkoutErrorCodes];
