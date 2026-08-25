import type { Locale } from "@/i18n/config";

export const siteName = "Ecommerce Platform";

function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for canonical SEO URLs");
  }
  const url = new URL(configured);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS outside localhost");
  }
  return url.toString().replace(/\/$/, "");
}

export const siteUrl = resolveSiteUrl();

export const localeTags: Record<Locale, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
};

export function localizedPath(locale: Locale, pathname = "") {
  const suffix = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `/${locale}${pathname ? suffix : ""}`;
}

export function absoluteUrl(pathname: string) {
  return `${siteUrl}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function localeAlternates(pathname = "", availableLocales: readonly Locale[] = ["tr", "en", "de"]) {
  const entries = Object.fromEntries(
    availableLocales.map((locale) => [locale, absoluteUrl(localizedPath(locale, pathname))]),
  ) as Partial<Record<Locale | "x-default", string>>;
  const fallback = availableLocales.includes("tr") ? "tr" : availableLocales[0];
  if (fallback) entries["x-default"] = absoluteUrl(localizedPath(fallback, pathname));
  return entries;
}
