"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";

const copy: Record<Locale, { eyebrow: string; title: string; body: string; home: string; products: string }> = {
  tr: {
    eyebrow: "404",
    title: "Sayfa bulunamadı",
    body: "Aradığınız sayfa kaldırılmış, taşınmış veya hiç var olmamış olabilir.",
    home: "Ana sayfaya dön",
    products: "Ürünleri keşfet",
  },
  en: {
    eyebrow: "404",
    title: "Page not found",
    body: "The page you are looking for may have been removed, moved, or never existed.",
    home: "Back to home",
    products: "Browse products",
  },
  de: {
    eyebrow: "404",
    title: "Seite nicht gefunden",
    body: "Die gesuchte Seite wurde möglicherweise entfernt, verschoben oder existierte nie.",
    home: "Zur Startseite",
    products: "Produkte ansehen",
  },
};

export default function LocaleNotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = params?.locale && isLocale(params.locale) ? params.locale : "tr";
  const content = copy[locale];

  return (
    <main id="main-content" tabIndex={-1} className="not-found-page">
      <section className="section" aria-labelledby="not-found-title">
        <div className="container not-found-page__inner">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1 id="not-found-title">{content.title}</h1>
          <p>{content.body}</p>
          <div className="not-found-page__actions">
            <Link className="button button--primary" href={`/${locale}`}>{content.home}</Link>
            <Link className="button button--secondary" href={`/${locale}/products`}>{content.products}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
