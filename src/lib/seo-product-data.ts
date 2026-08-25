import type { Locale } from "@/i18n/config";

const dbLocale: Record<Locale, "TR" | "EN" | "DE"> = { tr: "TR", en: "EN", de: "DE" };
const appLocale: Record<"TR" | "EN" | "DE", Locale> = { TR: "tr", EN: "en", DE: "de" };

export async function listSitemapProductSlugs(locale: Locale): Promise<string[]> {
  if (!process.env.DATABASE_URL) return [];
  const { db } = await import("@/lib/db");
  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      translations: { some: { locale: dbLocale[locale] } },
    },
    orderBy: { id: "asc" },
    select: { slug: true },
  });
  return products.map(({ slug }) => slug);
}

export async function getProductTranslationLocales(slug: string): Promise<Locale[]> {
  if (!process.env.DATABASE_URL) return [];
  const { db } = await import("@/lib/db");
  const product = await db.product.findFirst({
    where: { slug, status: "ACTIVE" },
    select: { translations: { select: { locale: true } } },
  });
  return product?.translations.map(({ locale }) => appLocale[locale]) ?? [];
}
