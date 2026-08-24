import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/storefront/cart-ui";
import { isLocale, type Locale } from "@/i18n/config";
import { getStorefrontProduct } from "@/lib/storefront-data";

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

  return (
    <main id="main-content">
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
