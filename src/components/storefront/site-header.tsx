import Link from "next/link";
import type { Locale } from "@/i18n/config";

const labels: Record<Locale, { home: string; products: string; languages: string }> = {
  tr: { home: "Ana sayfa", products: "Ürünler", languages: "Dil seçimi" },
  en: { home: "Home", products: "Products", languages: "Language selection" },
  de: { home: "Startseite", products: "Produkte", languages: "Sprachauswahl" },
};

const languageNames: Record<Locale, string> = {
  tr: "TR",
  en: "EN",
  de: "DE",
};

export function SiteHeader({ locale }: { locale: Locale }) {
  const copy = labels[locale];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="brand" href={`/${locale}`} aria-label={copy.home}>
          Ecommerce Platform
        </Link>

        <nav className="primary-nav" aria-label={copy.products}>
          <Link href={`/${locale}`}>{copy.home}</Link>
          <Link href={`/${locale}/products`}>{copy.products}</Link>
        </nav>

        <nav className="locale-nav" aria-label={copy.languages}>
          {(Object.keys(languageNames) as Locale[]).map((targetLocale) => (
            <Link
              key={targetLocale}
              href={`/${targetLocale}`}
              hrefLang={targetLocale}
              lang={targetLocale}
              aria-current={targetLocale === locale ? "page" : undefined}
            >
              {languageNames[targetLocale]}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
