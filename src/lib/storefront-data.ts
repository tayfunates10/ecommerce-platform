import type { Locale } from "@/i18n/config";

export const STOREFRONT_PRODUCT_LIMIT = 48;
export const STOREFRONT_PAGE_SIZE = 24;

type ProductReadRecord = {
  id: string;
  slug: string;
  sku: string;
  brand: string | null;
  translations: Array<{ name: string; description: string; shortCopy: string | null }>;
  media: Array<{ url: string; alt: string | null; width: number | null; height: number | null }>;
  variants: Array<{
    id: string;
    sku: string;
    title: string | null;
    prices: Array<{ amount: { toString(): string }; currency: string }>;
    inventory: { quantity: number; reserved: number } | null;
  }>;
};

export type StorefrontVariant = {
  id: string;
  sku: string;
  title: string | null;
  price: number;
  currency: string;
  available: number;
};

export type StorefrontProduct = {
  id: string;
  slug: string;
  sku: string;
  brand: string | null;
  name: string;
  description: string;
  shortCopy: string | null;
  image: { url: string; alt: string | null; width: number | null; height: number | null } | null;
  variant: StorefrontVariant | null;
  variants: StorefrontVariant[];
};

export type StorefrontProductPage = {
  items: StorefrontProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
};

const dbLocale: Record<Locale, "TR" | "EN" | "DE"> = { tr: "TR", en: "EN", de: "DE" };
const preferredCurrency: Record<Locale, "TRY" | "USD" | "EUR"> = { tr: "TRY", en: "USD", de: "EUR" };

function serializeProduct(product: ProductReadRecord): StorefrontProduct | null {
  const translation = product.translations[0];
  if (!translation) return null;
  const media = product.media[0];
  const variants = product.variants.flatMap((variant) => {
    const price = variant.prices[0];
    if (!price) return [];
    const inventory = variant.inventory;
    return [{
      id: variant.id,
      sku: variant.sku,
      title: variant.title,
      price: Number(price.amount.toString()),
      currency: price.currency,
      available: inventory ? Math.max(0, inventory.quantity - inventory.reserved) : 0,
    } satisfies StorefrontVariant];
  });

  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    brand: product.brand,
    name: translation.name,
    description: translation.description,
    shortCopy: translation.shortCopy,
    image: media ? { url: media.url, alt: media.alt, width: media.width, height: media.height } : null,
    variant: variants[0] ?? null,
    variants,
  };
}

function productInclude(locale: Locale) {
  return {
    translations: { where: { locale: dbLocale[locale] }, take: 1 },
    media: { orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }], take: 1 },
    variants: {
      where: { active: true },
      orderBy: { createdAt: "asc" as const },
      take: 1,
      include: {
        inventory: true,
        prices: { where: { currency: preferredCurrency[locale] }, orderBy: { validFrom: "desc" as const }, take: 1 },
      },
    },
  };
}

export async function listStorefrontProductPage(
  locale: Locale,
  options: { query?: string; page?: number; pageSize?: number } = {},
): Promise<StorefrontProductPage> {
  const query = (options.query ?? "").trim().slice(0, 100);
  const requestedPage = Number.isSafeInteger(options.page) && (options.page ?? 0) > 0 ? Number(options.page) : 1;
  const pageSize = Math.min(STOREFRONT_PRODUCT_LIMIT, Math.max(1, options.pageSize ?? STOREFRONT_PAGE_SIZE));

  if (!process.env.DATABASE_URL) {
    return { items: [], total: 0, page: 1, pageSize, totalPages: 1, query };
  }

  const { db } = await import("@/lib/db");
  const translationWhere = query
    ? {
        locale: dbLocale[locale],
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { description: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : { locale: dbLocale[locale] };
  const where = {
    status: "ACTIVE" as const,
    translations: { some: translationWhere },
  };

  const total = await db.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const products = await db.product.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: productInclude(locale),
  });

  return {
    items: products.map(serializeProduct).filter((product): product is StorefrontProduct => product !== null),
    total,
    page,
    pageSize,
    totalPages,
    query,
  };
}

export async function listStorefrontProducts(locale: Locale): Promise<StorefrontProduct[]> {
  const result = await listStorefrontProductPage(locale, { page: 1, pageSize: STOREFRONT_PRODUCT_LIMIT });
  return result.items;
}

export async function getStorefrontProduct(locale: Locale, slug: string): Promise<StorefrontProduct | null> {
  if (!process.env.DATABASE_URL) return null;
  const { db } = await import("@/lib/db");
  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    include: {
      translations: { where: { locale: dbLocale[locale] }, take: 1 },
      media: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
      variants: { where: { active: true }, orderBy: { createdAt: "asc" }, include: {
        inventory: true,
        prices: { where: { currency: preferredCurrency[locale] }, orderBy: { validFrom: "desc" }, take: 1 },
      } },
    },
  });
  return product ? serializeProduct(product) : null;
}
