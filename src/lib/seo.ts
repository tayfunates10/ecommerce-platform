import type { Locale } from "@/i18n/config";

export const siteName = "Ecommerce Platform";
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com").replace(/\/$/, "");

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

export function localeAlternates(pathname = "") {
  return {
    tr: absoluteUrl(localizedPath("tr", pathname)),
    en: absoluteUrl(localizedPath("en", pathname)),
    de: absoluteUrl(localizedPath("de", pathname)),
    "x-default": absoluteUrl(localizedPath("tr", pathname)),
  };
}
