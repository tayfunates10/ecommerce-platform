import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { listStorefrontProducts } from "@/lib/storefront-data";
import { absoluteUrl, localizedPath } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push(
      { url: absoluteUrl(localizedPath(locale)), lastModified: now, changeFrequency: "weekly", priority: 1 },
      { url: absoluteUrl(localizedPath(locale, "/products")), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    );

    const products = await listStorefrontProducts(locale);
    for (const product of products) {
      entries.push({
        url: absoluteUrl(localizedPath(locale, `/products/${product.slug}`)),
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  return entries;
}
