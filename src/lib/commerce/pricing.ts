export const SUPPORTED_CURRENCIES = ["TRY", "EUR", "USD"] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export type Money = Readonly<{
  amountMinor: number;
  currency: SupportedCurrency;
}>;

export type CartLineInput = Readonly<{
  unitPriceMinor: number;
  quantity: number;
}>;

const SUPPORTED_CURRENCY_SET = new Set<string>(SUPPORTED_CURRENCIES);

function assertMinorAmount(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("Money amount must be a non-negative safe integer.");
  }
}

export function normalizeCurrency(currency: string): SupportedCurrency {
  const value = currency.trim().toUpperCase();
  if (!SUPPORTED_CURRENCY_SET.has(value)) {
    throw new TypeError(
      `Currency must be one of the supported ISO-4217 codes: ${SUPPORTED_CURRENCIES.join(", ")}.`,
    );
  }
  return value as SupportedCurrency;
}

export function lineTotalMinor(line: CartLineInput): number {
  assertMinorAmount(line.unitPriceMinor);
  if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0) {
    throw new RangeError("Quantity must be a positive safe integer.");
  }

  const total = line.unitPriceMinor * line.quantity;
  if (!Number.isSafeInteger(total)) {
    throw new RangeError("Line total exceeds the safe integer range.");
  }
  return total;
}

export function cartSubtotalMinor(lines: readonly CartLineInput[]): number {
  return lines.reduce((sum, line) => {
    const next = sum + lineTotalMinor(line);
    if (!Number.isSafeInteger(next)) {
      throw new RangeError("Cart subtotal exceeds the safe integer range.");
    }
    return next;
  }, 0);
}

export function money(amountMinor: number, currency: string): Money {
  assertMinorAmount(amountMinor);
  return { amountMinor, currency: normalizeCurrency(currency) };
}
