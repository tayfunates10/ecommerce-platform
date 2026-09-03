import Link from "next/link";
import { CartButton } from "@/components/storefront/cart-ui";
import { LocaleNav } from "@/components/storefront/locale-nav";
import type { Locale } from "@/i18n/config";

const labels: Record<Locale, { home: string; products: string; languages: string; mainNav: string }> = {
  tr: { home: "Ana sayfa", products: "Ürünler", languages: "Dil seçimi", mainNav: "Ana menü" },
  en: { home: "Home", products: "Products", languages: "Language selection", mainNav: "Main navigation" },
  de: { home: "Startseite", products: "Produkte", languages: "Sprachauswahl", mainNav: "Hauptnavigation" },
};

export function SiteHeader({ locale }: { locale: Locale }) {
  const copy = labels[locale];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="brand" href={`/${locale}`} aria-label={copy.home}>
          Ecommerce Platform
        </Link>

        <nav className="primary-nav" aria-label={copy.mainNav}>
          <Link href={`/${locale}`}>{copy.home}</Link>
          <Link href={`/${locale}/products`}>{copy.products}</Link>
        </nav>

        <div className="site-header__actions">
          <LocaleNav locale={locale} label={copy.languages} />
          <CartButton locale={locale} />
        </div>
      </div>
    </header>
  );
}
