import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";

const copy: Record<Locale, { eyebrow: string; title: string; body: string; cta: string }> = {
  tr: {
    eyebrow: "Yeni nesil e-ticaret",
    title: "Hızlı, güvenilir ve dönüşüm odaklı alışveriş deneyimi",
    body: "Ürün, kategori, ödeme ve çok dilli SEO altyapısı production kalite kapılarıyla geliştiriliyor.",
    cta: "Ürünleri keşfet",
  },
  en: {
    eyebrow: "Next-generation commerce",
    title: "Fast, trustworthy, conversion-focused shopping",
    body: "Products, categories, checkout and multilingual SEO are being built behind production quality gates.",
    cta: "Explore products",
  },
  de: {
    eyebrow: "E-Commerce der nächsten Generation",
    title: "Schnelles, vertrauenswürdiges und conversion-starkes Shopping",
    body: "Produkte, Kategorien, Checkout und mehrsprachiges SEO werden mit Production-Qualitätsprüfungen entwickelt.",
    cta: "Produkte entdecken",
  },
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = copy[locale];

  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero__inner">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1 id="hero-title">{content.title}</h1>
          <p className="hero__copy">{content.body}</p>
          <a className="button" href={`/${locale}/products`}>
            {content.cta}
          </a>
        </div>
      </section>
    </main>
  );
}
