import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { performanceBudget } from "@/lib/performance";
import type { StorefrontProduct } from "@/lib/storefront-data";

function formatMoney(amount: number, currency: string, locale: Locale) {
  const localeTag = locale === "tr" ? "tr-TR" : locale === "de" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(localeTag, { style: "currency", currency }).format(amount);
}

export function ProductCard({ product, locale }: { product: StorefrontProduct; locale: Locale }) {
  return (
    <article className="product-card">
      <Link className="product-card__media" href={`/${locale}/products/${product.slug}`}>
        {product.image ? (
          <Image
            src={product.image.url}
            alt={product.image.alt ?? product.name}
            width={product.image.width ?? 800}
            height={product.image.height ?? 800}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={performanceBudget.productImageQuality}
            loading="lazy"
          />
        ) : (
          <div className="product-card__placeholder" aria-hidden="true" />
        )}
      </Link>
      <div className="product-card__body">
        {product.brand && <p className="product-card__brand">{product.brand}</p>}
        <h2><Link href={`/${locale}/products/${product.slug}`}>{product.name}</Link></h2>
        {product.shortCopy && <p>{product.shortCopy}</p>}
        {product.variant ? (
          <div className="product-card__price-row">
            <strong>{formatMoney(product.variant.price, product.variant.currency, locale)}</strong>
            <span className={product.variant.available > 0 ? "stock stock--in" : "stock stock--out"}>
              {product.variant.available > 0
                ? locale === "tr" ? "Stokta" : locale === "de" ? "Auf Lager" : "In stock"
                : locale === "tr" ? "Tükendi" : locale === "de" ? "Ausverkauft" : "Sold out"}
            </span>
          </div>
        ) : (
          <p className="stock stock--out">
            {locale === "tr" ? "Satışa hazır değil" : locale === "de" ? "Noch nicht verkaufsbereit" : "Not ready for sale"}
          </p>
        )}
      </div>
    </article>
  );
}
