export const performanceBudget = {
  lcpMs: 1800,
  inpMs: 150,
  cls: 0.05,
  ttfbMs: 500,
  initialJsGzipKb: 150,
  domNodes: 1500,
  productImageQuality: 75,
} as const;

export type CoreWebVitalName = "LCP" | "INP" | "CLS";

export function isWithinCoreWebVitalBudget(name: CoreWebVitalName, value: number) {
  if (!Number.isFinite(value) || value < 0) return false;
  if (name === "LCP") return value <= performanceBudget.lcpMs;
  if (name === "INP") return value <= performanceBudget.inpMs;
  return value <= performanceBudget.cls;
}

export function normalizeWebVitalsEndpoint(value: string | undefined) {
  const endpoint = value?.trim();
  if (!endpoint) return null;
  if (!endpoint.startsWith("/") || endpoint.startsWith("//")) {
    throw new Error("NEXT_PUBLIC_WEB_VITALS_ENDPOINT must be a same-origin absolute path beginning with '/'.");
  }
  return endpoint;
}
