"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";

const languageNames: Record<Locale, string> = { tr: "TR", en: "EN", de: "DE" };

function localeHref(pathname: string, currentLocale: Locale, targetLocale: Locale) {
  if (targetLocale === currentLocale) return pathname || `/${targetLocale}`;

  const productDetail = pathname.match(/^\/(?:tr|en|de)\/products\/[^/]+\/?$/);
  if (productDetail) {
    // A product can be translated into only a subset of locales. The header is
    // layout-level and cannot safely assume translation availability, so it
    // fails open to the localized catalog instead of emitting a dead product URL.
    return `/${targetLocale}/products`;
  }

  const segments = pathname.split("/");
  if (segments.length > 1) segments[1] = targetLocale;
  return segments.join("/") || `/${targetLocale}`;
}

export function LocaleNav({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();

  return (
    <nav className="locale-nav" aria-label={label}>
      {(Object.keys(languageNames) as Locale[]).map((targetLocale) => (
        <Link
          key={targetLocale}
          href={localeHref(pathname, locale, targetLocale)}
          hrefLang={targetLocale}
          lang={targetLocale}
          aria-current={targetLocale === locale ? "page" : undefined}
        >
          {languageNames[targetLocale]}
        </Link>
      ))}
    </nav>
  );
}
