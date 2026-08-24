import type { Locale } from "@/i18n/config";

export type StorefrontProduct = {
  id: string;
  slug: string;
  sku: string;
  brand: string | null;
  name: string;
  description: string;
  shortCopy: string | null;
  image: { url: string; alt: string | null; width: number | null; height: number | null } | null;
  variant: {
    id: string;
    sku: string;
    title: string | null;
    price: number;
    currency: string;
    available: number;
  } | null;
};

const dbLocale: Record<Locale, "TR" | "EN" | "DE"> = {
  tr: "TR",
  en: "EN",
  de: "DE",
};

const preferredCurrency: Record<Locale, "TRY" | "USD" | "EUR"> = {
  tr: "TRY",
  en: "USD",
  de: "EUR",
};

function serializeProduct(product: any, locale: Locale): StorefrontProduct | null {
  const translation = product.translations[0];
  if (!translation) return null;

  const variant = product.variants[0];
  const price = variant?.prices?.[0];
  const inventory = variant?.inventory;
  const media = product.media?.[0];

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    name: translation.name,
    description: translation.description,
    shortCopy: translation.shortCopy,
    image: media
      ? { url: media.url, alt: media.alt, width: media.width, height: media.height }
      : null,
    variant:
      variant && price
        ? {
            id: variant.id,
            sku: variant.sku,
            title: variant.title,
            price: Number(price.amount.toString()),
            currency: price.currency,
            available: inventory ? Math.max(0, inventory.quantity - inventory.reserved) : 0,
          }
        : null,
  };
}

function canReadDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function listStorefrontProducts(locale: Locale): Promise<StorefrontProduct[]> {
  if (!canReadDatabase()) return [];

  const { db } = await import("@/lib/db");
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    take: 48,
    include: {
      translations: { where: { locale: dbLocale[locale] }, take: 1 },
      media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
      variants: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        include: {
          inventory: true,
          prices: {
            where: { currency: preferredCurrency[locale] },
            orderBy: { validFrom: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  return products
    .map((product) => serializeProduct(product, locale))
    .filter((product): product is StorefrontProduct => product !== null);
}

export async function getStorefrontProduct(locale: Locale, slug: string): Promise<StorefrontProduct | null> {
  if (!canReadDatabase()) return null;

  const { db } = await import("@/lib/db");
  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      translations: { where: { locale: dbLocale[locale] }, take: 1 },
      media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
      variants: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        include: {
          inventory: true,
          prices: {
            where: { currency: preferredCurrency[locale] },
            orderBy: { validFrom: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  return product ? serializeProduct(product, locale) : null;
}
