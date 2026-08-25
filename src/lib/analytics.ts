const ALLOWED_EVENTS = new Set([
  "view_item",
  "add_to_cart",
  "begin_checkout",
  "purchase",
]);

const SAFE_KEY = /^[a-z][a-z0-9_]{0,39}$/;
const SAFE_VALUE = /^[A-Za-z0-9 ._:/-]{1,120}$/;

export type AnalyticsConsent = {
  analytics: boolean;
};

export type AnalyticsEvent = {
  name: string;
  path: string;
  currency?: string;
  valueMinor?: number;
  properties?: Record<string, string | number | boolean>;
};

export type FirstPartyAnalyticsPayload = {
  name: string;
  path: string;
  currency?: string;
  valueMinor?: number;
  properties: Record<string, string | number | boolean>;
};

function normalizePath(value: string): string {
  const url = new URL(value, "https://analytics.invalid");
  if (url.origin !== "https://analytics.invalid") {
    throw new TypeError("Analytics path must be same-origin relative.");
  }
  return url.pathname;
}

export function buildAnalyticsPayload(
  consent: AnalyticsConsent,
  event: AnalyticsEvent,
): FirstPartyAnalyticsPayload | null {
  if (!consent.analytics) return null;
  if (!ALLOWED_EVENTS.has(event.name)) throw new TypeError("Unsupported analytics event.");

  const properties: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(event.properties ?? {})) {
    if (!SAFE_KEY.test(key)) throw new TypeError(`Unsafe analytics property key: ${key}`);
    if (typeof value === "string" && !SAFE_VALUE.test(value)) {
      throw new TypeError(`Unsafe analytics property value for ${key}`);
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      throw new TypeError(`Non-finite analytics property value for ${key}`);
    }
    properties[key] = value;
  }

  if (event.valueMinor !== undefined && (!Number.isSafeInteger(event.valueMinor) || event.valueMinor < 0)) {
    throw new TypeError("Analytics value must be a non-negative safe integer.");
  }

  const currency = event.currency?.trim().toUpperCase();
  if (currency && !/^[A-Z]{3}$/.test(currency)) throw new TypeError("Invalid analytics currency.");

  return {
    name: event.name,
    path: normalizePath(event.path),
    ...(currency ? { currency } : {}),
    ...(event.valueMinor !== undefined ? { valueMinor: event.valueMinor } : {}),
    properties,
  };
}
