import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/storefront/product-card";
import { isLocale, type Locale } from "@/i18n/config";
import { absoluteUrl, localeAlternates, localizedPath, siteName } from "@/lib/seo";
import { listStorefrontProductPage } from "@/lib/storefront-data";

const copy: Record<Locale, {
  eyebrow: string;
  title: string;
  body: string;
  emptyTitle: string;
  emptyBody: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchButton: string;
  localeFallbackNotice: string;
  results: (count: number) => string;
  previous: string;
  next: string;
}> = {
  tr: {
    eyebrow: "Katalog",
    title: "Ürünler",
    body: "Güncel stok ve fiyat bilgileriyle satışa açık ürünleri keşfedin.",
    emptyTitle: "Ürün bulunamadı",
    emptyBody: "Aramanızı değiştirin veya daha sonra tekrar kontrol edin.",
    searchLabel: "Ürün ara",
    searchPlaceholder: "Ürün adı veya açıklama",
    searchButton: "Ara",
    localeFallbackNotice: "Bu ürün seçtiğiniz dilde kullanılamıyor. Bu nedenle o dildeki ürün kataloğunu gösteriyoruz.",
    results: (count) => `${count} ürün`,
    previous: "Önceki",
    next: "Sonraki",
  },
  en: {
    eyebrow: "Catalog",
    title: "Products",
    body: "Explore products currently available for sale with live stock and pricing data.",
    emptyTitle: "No products found",
    emptyBody: "Change your search or check again later.",
    searchLabel: "Search products",
    searchPlaceholder: "Product name or description",
    searchButton: "Search",
    localeFallbackNotice: "This product is not available in the selected language, so we are showing the localized product catalog instead.",
    results: (count) => `${count} products`,
    previous: "Previous",
    next: "Next",
  },
  de: {
    eyebrow: "Katalog",
    title: "Produkte",
    body: "Entdecken Sie aktuell verfügbare Produkte mit Bestands- und Preisdaten.",
    emptyTitle: "Keine Produkte gefunden",
    emptyBody: "Ändern Sie Ihre Suche oder versuchen Sie es später erneut.",
    searchLabel: "Produkte suchen",
    searchPlaceholder: "Produktname oder Beschreibung",
    searchButton: "Suchen",
    localeFallbackNotice: "Dieses Produkt ist in der ausgewählten Sprache nicht verfügbar. Deshalb zeigen wir stattdessen den lokalisierten Produktkatalog.",
    results: (count) => `${count} Produkte`,
    previous: "Zurück",
    next: "Weiter",
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
    alternates: { canonical: url, languages: localeAlternates(pathname) },
    openGraph: { type: "website", siteName, title: content.title, description: content.body, url },
  };
}

function catalogHref(locale: Locale, query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return `/${locale}/products${suffix ? `?${suffix}` : ""}`;
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string; notice?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { q = "", page: pageParam = "1", notice } = await searchParams;
  const requestedPage = /^\d+$/.test(pageParam) ? Number(pageParam) : 1;
  const content = copy[locale];
  const result = await listStorefrontProductPage(locale, { query: q, page: requestedPage });

  return (
    <main id="main-content" tabIndex={-1}>
      <section className="page-hero" aria-labelledby="catalog-title">
        <div className="container page-hero__inner">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1 id="catalog-title">{content.title}</h1>
          <p>{content.body}</p>
        </div>
      </section>

      <section className="section">
        <div className="container catalog-layout">
          {notice === "product-unavailable" ? (
            <p className="catalog-notice" role="status">{content.localeFallbackNotice}</p>
          ) : null}

          <form className="catalog-toolbar" method="get" action={`/${locale}/products`}>
            <label htmlFor="catalog-search" className="sr-only">{content.searchLabel}</label>
            <input
              id="catalog-search"
              type="search"
              name="q"
              defaultValue={result.query}
              placeholder={content.searchPlaceholder}
              maxLength={100}
            />
            <button className="button button--secondary" type="submit">{content.searchButton}</button>
          </form>

          <p className="catalog-results" aria-live="polite">{content.results(result.total)}</p>

          {result.items.length > 0 ? (
            <>
              <div className="product-grid">
                {result.items.map((product, index) => (
                  <ProductCard key={product.id} product={product} locale={locale} priority={index < 3} />
                ))}
              </div>
              {result.totalPages > 1 && (
                <nav className="pagination" aria-label={locale === "tr" ? "Katalog sayfaları" : locale === "de" ? "Katalogseiten" : "Catalog pages"}>
                  {result.page > 1 ? <Link href={catalogHref(locale, result.query, result.page - 1)}>{content.previous}</Link> : <span />}
                  <span aria-current="page">{result.page} / {result.totalPages}</span>
                  {result.page < result.totalPages ? <Link href={catalogHref(locale, result.query, result.page + 1)}>{content.next}</Link> : <span />}
                </nav>
              )}
            </>
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
