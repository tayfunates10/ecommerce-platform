import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { listSitemapProductSlugs } from "@/lib/seo-product-data";
import { absoluteUrl, localizedPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push(
      { url: absoluteUrl(localizedPath(locale)), lastModified: now, changeFrequency: "weekly", priority: 1 },
      { url: absoluteUrl(localizedPath(locale, "/products")), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    );

    const slugs = await listSitemapProductSlugs(locale);
    for (const slug of slugs) {
      entries.push({
        url: absoluteUrl(localizedPath(locale, `/products/${slug}`)),
        lastModified: now,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }
  }

  return entries;
}
