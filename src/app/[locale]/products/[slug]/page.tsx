import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/storefront/cart-ui";
import { isLocale, type Locale } from "@/i18n/config";
import { performanceBudget } from "@/lib/performance";
import { getStorefrontProduct } from "@/lib/storefront-data";
import { getProductTranslationLocales } from "@/lib/seo-product-data";
import { absoluteUrl, localeAlternates, localizedPath, siteName } from "@/lib/seo";

function formatMoney(amount: number, currency: string, locale: Locale) {
  const localeTag = locale === "tr" ? "tr-TR" : locale === "de" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(localeTag, { style: "currency", currency }).format(amount);
}

const labels = {
  tr: { home: "Ana sayfa", products: "Ürünler", back: "Ürünlere dön", stock: "Stok", available: "adet mevcut", unavailable: "Stokta yok", sku: "SKU", breadcrumb: "İçerik zinciri" },
  en: { home: "Home", products: "Products", back: "Back to products", stock: "Stock", available: "available", unavailable: "Out of stock", sku: "SKU", breadcrumb: "Breadcrumb" },
  de: { home: "Startseite", products: "Produkte", back: "Zurück zu Produkten", stock: "Bestand", available: "verfügbar", unavailable: "Nicht auf Lager", sku: "SKU", breadcrumb: "Breadcrumb" },
} satisfies Record<Locale, Record<string, string>>;

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const product = await getStorefrontProduct(locale, slug);
  if (!product) return { robots: { index: false, follow: false } };

  const pathname = `/products/${product.slug}`;
  const description = product.shortCopy ?? product.description;
  const image = product.image?.url;
  const availableLocales = await getProductTranslationLocales(product.slug);

  return {
    title: product.name,
    description,
    alternates: {
      canonical: absoluteUrl(localizedPath(locale, pathname)),
      languages: localeAlternates(pathname, availableLocales),
    },
    openGraph: {
      type: "website",
      siteName,
      title: product.name,
      description,
      url: absoluteUrl(localizedPath(locale, pathname)),
      images: image ? [{ url: image, alt: product.image?.alt ?? product.name }] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const product = await getStorefrontProduct(locale, slug);
  if (!product) notFound();
  const variant = product.variant;
  const copy = labels[locale];
  const homeUrl = absoluteUrl(localizedPath(locale));
  const catalogUrl = absoluteUrl(localizedPath(locale, "/products"));
  const productUrl = absoluteUrl(localizedPath(locale, `/products/${product.slug}`));
  const commonProductData = {
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: product.image ? [product.image.url] : undefined,
  };
  const variantNodes = product.variants.map((item) => ({
    "@type": "Product",
    name: item.title ? `${product.name} - ${item.title}` : product.name,
    description: product.description,
    sku: item.sku,
    ...commonProductData,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: item.currency,
      price: item.price.toFixed(2),
      availability: item.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      sku: item.sku,
    },
  }));

  const productStructuredData = product.variants.length > 1
    ? {
        "@context": "https://schema.org",
        "@type": "ProductGroup",
        name: product.name,
        description: product.description,
        productGroupID: product.sku,
        ...commonProductData,
        hasVariant: variantNodes,
      }
    : {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        sku: product.sku,
        ...commonProductData,
        offers: variantNodes[0]?.offers,
      };

  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: copy.home, item: homeUrl },
      { "@type": "ListItem", position: 2, name: copy.products, item: catalogUrl },
      { "@type": "ListItem", position: 3, name: product.name, item: productUrl },
    ],
  };

  return (
    <main id="main-content" tabIndex={-1}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData).replace(/</g, "\\u003c") }}
      />
      <section className="section product-detail">
        <div className="container">
          <nav className="breadcrumb" aria-label={copy.breadcrumb}>
            <ol>
              <li><Link href={`/${locale}`}>{copy.home}</Link></li>
              <li><Link href={`/${locale}/products`}>{copy.products}</Link></li>
              <li aria-current="page">{product.name}</li>
            </ol>
          </nav>
          <Link className="text-link" href={`/${locale}/products`}>{copy.back}</Link>
          <div className="product-detail__grid">
            <div className="product-detail__media">
              {product.image ? (
                <Image
                  src={product.image.url}
                  alt={product.image.alt ?? product.name}
                  width={product.image.width ?? 1200}
                  height={product.image.height ?? 1200}
                  sizes="(max-width: 900px) 100vw, 50vw"
                  quality={performanceBudget.productImageQuality}
                  priority
                />
              ) : (
                <div className="product-detail__placeholder" aria-hidden="true" />
              )}
            </div>
            <div className="product-detail__content">
              {product.brand && <p className="eyebrow">{product.brand}</p>}
              <h1>{product.name}</h1>
              {product.shortCopy && <p className="product-detail__lead">{product.shortCopy}</p>}
              <p>{product.description}</p>

              {variant ? (
                <div className="purchase-panel">
                  <strong className="purchase-panel__price">{formatMoney(variant.price, variant.currency, locale)}</strong>
                  <dl className="purchase-panel__meta">
                    <div><dt>{copy.sku}</dt><dd>{variant.sku}</dd></div>
                    <div><dt>{copy.stock}</dt><dd>{variant.available > 0 ? `${variant.available} ${copy.available}` : copy.unavailable}</dd></div>
                  </dl>
                  <AddToCartButton
                    locale={locale}
                    disabled={variant.available <= 0}
                    item={{
                      variantId: variant.id,
                      slug: product.slug,
                      name: product.name,
                      sku: variant.sku,
                      unitPrice: variant.price,
                      currency: variant.currency,
                      available: variant.available,
                    }}
                  />
                </div>
              ) : (
                <p className="stock stock--out">{copy.unavailable}</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
