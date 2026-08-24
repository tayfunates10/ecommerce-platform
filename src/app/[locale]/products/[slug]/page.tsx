import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/storefront/cart-ui";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontProduct } from "@/lib/storefront-data";
import { absoluteUrl, localeAlternates, localizedPath, siteName } from "@/lib/seo";

function formatMoney(amount: number, currency: string, locale: Locale) {
  const localeTag = locale === "tr" ? "tr-TR" : locale === "de" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(localeTag, { style: "currency", currency }).format(amount);
}

const labels = {
  tr: { back: "Ürünlere dön", stock: "Stok", available: "adet mevcut", unavailable: "Stokta yok", sku: "SKU" },
  en: { back: "Back to products", stock: "Stock", available: "available", unavailable: "Out of stock", sku: "SKU" },
  de: { back: "Zurück zu Produkten", stock: "Bestand", available: "verfügbar", unavailable: "Nicht auf Lager", sku: "SKU" },
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

  return {
    title: product.name,
    description,
    alternates: {
      canonical: absoluteUrl(localizedPath(locale, pathname)),
      languages: localeAlternates(pathname),
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
  const productUrl = absoluteUrl(localizedPath(locale, `/products/${product.slug}`));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    image: product.image ? [product.image.url] : undefined,
    offers: variant
      ? {
          "@type": "Offer",
          url: productUrl,
          priceCurrency: variant.currency,
          price: variant.price.toFixed(2),
          availability: variant.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          sku: variant.sku,
        }
      : undefined,
  };

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <section className="section product-detail">
        <div className="container">
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
