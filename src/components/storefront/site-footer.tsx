import Link from "next/link";
import type { Locale } from "@/i18n/config";

const copy: Record<Locale, { rights: string; products: string; home: string; footerNav: string }> = {
  tr: { rights: "Tüm hakları saklıdır.", products: "Ürünler", home: "Ana sayfa", footerNav: "Alt menü" },
  en: { rights: "All rights reserved.", products: "Products", home: "Home", footerNav: "Footer navigation" },
  de: { rights: "Alle Rechte vorbehalten.", products: "Produkte", home: "Startseite", footerNav: "Fußnavigation" },
};

export function SiteFooter({ locale }: { locale: Locale }) {
  const labels = copy[locale];

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p>© {new Date().getUTCFullYear()} Ecommerce Platform. {labels.rights}</p>
        <nav aria-label={labels.footerNav}>
          <Link href={`/${locale}`}>{labels.home}</Link>
          <Link href={`/${locale}/products`}>{labels.products}</Link>
        </nav>
      </div>
    </footer>
  );
}
