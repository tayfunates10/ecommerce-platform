import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { isLocale, type Locale } from "@/i18n/config";
import { absoluteUrl, localeAlternates, localizedPath, siteName } from "@/lib/seo";
import { listStorefrontProducts } from "@/lib/storefront-data";

const copy: Record<Locale, { eyebrow: string; title: string; body: string; emptyTitle: string; emptyBody: string }> = {
  tr: {
    eyebrow: "Katalog",
    title: "Ürünler",
    body: "Güncel stok ve fiyat bilgileriyle satışa açık ürünleri keşfedin.",
    emptyTitle: "Henüz yayınlanmış ürün yok",
    emptyBody: "Satışa açılan gerçek ürünler burada otomatik olarak görünecek.",
  },
  en: {
    eyebrow: "Catalog",
    title: "Products",
    body: "Explore products currently available for sale with live stock and pricing data.",
    emptyTitle: "No published products yet",
    emptyBody: "Real products will appear here automatically when they are activated for sale.",
  },
  de: {
    eyebrow: "Katalog",
    title: "Produkte",
    body: "Entdecken Sie aktuell verfügbare Produkte mit Bestands- und Preisdaten.",
    emptyTitle: "Noch keine veröffentlichten Produkte",
    emptyBody: "Echte Produkte erscheinen hier automatisch, sobald sie für den Verkauf aktiviert werden.",
  },
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const content = copy[locale];
  const pathname = "/products";
  const url = absoluteUrl(localizedPath(locale, pathname));

  return {
    title: `${content.title} | ${siteName}`,
    description: content.body,
    alternates: {
      canonical: url,
      languages: localeAlternates(pathname),
    },
    openGraph: {
      type: "website",
      siteName,
      title: content.title,
      description: content.body,
      url,
    },
  };
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = copy[locale];
  const products = await listStorefrontProducts(locale);

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
          {products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="catalog-empty">
              <div className="catalog-empty__media" aria-hidden="true" />
              <div>
                <h2>{content.emptyTitle}</h2>
                <p>{content.emptyBody}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
