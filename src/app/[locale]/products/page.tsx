import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";

const copy: Record<Locale, { eyebrow: string; title: string; body: string; emptyTitle: string; emptyBody: string }> = {
  tr: {
    eyebrow: "Katalog",
    title: "Ürünler",
    body: "Ürün kataloğu erişilebilir, hızlı ve filtrelenebilir bir mağaza deneyimi için hazırlanıyor.",
    emptyTitle: "Ürün verisi bekleniyor",
    emptyBody: "Gerçek ürünlar yayınlandığında bu alan veritabanından beslenen responsive ürün kartlarını gösterecek.",
  },
  en: {
    eyebrow: "Catalog",
    title: "Products",
    body: "The catalog is being prepared for an accessible, fast and filter-ready storefront experience.",
    emptyTitle: "Awaiting product data",
    emptyBody: "Once real products are published, this area will render responsive product cards backed by the database.",
  },
  de: {
    eyebrow: "Katalog",
    title: "Produkte",
    body: "Der Katalog wird für ein barrierearmes, schnelles und filterfähiges Storefront-Erlebnis vorbereitet.",
    emptyTitle: "Produktdaten stehen noch aus",
    emptyBody: "Sobald echte Produkte veröffentlicht sind, zeigt dieser Bereich responsive Produktkarten aus der Datenbank.",
  },
};

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = copy[locale];

  return (
    <main id="main-content">
      <section className="page-hero" aria-labelledby="catalog-title">
        <div className="container page-hero__inner">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1 id="catalog-title">{content.title}</h1>
          <p>{content.body}</p>
        </div>
      </section>

      <section className="section" aria-live="polite">
        <div className="container catalog-layout">
          <div className="catalog-toolbar" aria-hidden="true">
            <span className="catalog-toolbar__line" />
            <span className="catalog-toolbar__line catalog-toolbar__line--short" />
          </div>
          <div className="catalog-empty">
            <div className="catalog-empty__media" aria-hidden="true" />
            <div>
              <h2>{content.emptyTitle}</h2>
              <p>{content.emptyBody}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
