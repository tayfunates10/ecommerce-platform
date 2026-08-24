"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";

const languageNames: Record<Locale, string> = { tr: "TR", en: "EN", de: "DE" };

function localeHref(pathname: string, targetLocale: Locale) {
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
          href={localeHref(pathname, targetLocale)}
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
