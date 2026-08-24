import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/i18n/config";

const copy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    valuesTitle: string;
    values: Array<{ title: string; body: string }>;
  }
> = {
  tr: {
    eyebrow: "Yeni nesil e-ticaret",
    title: "Hızlı, güvenilir ve dönüşüm odaklı alışveriş deneyimi",
    body: "Ürün, kategori, ödeme ve çok dilli SEO altyapısı production kalite kapılarıyla geliştiriliyor.",
    cta: "Ürünleri keşfet",
    valuesTitle: "Alışveriş deneyiminin temeli",
    values: [
      { title: "Hızlı", body: "Sunucu öncelikli render ve düşük istemci JavaScript bütçesi." },
      { title: "Erişilebilir", body: "Klavye, odak yönetimi ve semantik yapı varsayılan olarak korunur." },
      { title: "Güvenilir", body: "Stok, fiyat ve sipariş kuralları transaction güvenliğiyle çalışır." },
    ],
  },
  en: {
    eyebrow: "Next-generation commerce",
    title: "Fast, trustworthy, conversion-focused shopping",
    body: "Products, categories, checkout and multilingual SEO are being built behind production quality gates.",
    cta: "Explore products",
    valuesTitle: "Built for a better shopping experience",
    values: [
      { title: "Fast", body: "Server-first rendering with a deliberately small client JavaScript budget." },
      { title: "Accessible", body: "Keyboard, focus and semantic behavior are protected by default." },
      { title: "Reliable", body: "Inventory, pricing and order rules execute behind transactional safeguards." },
    ],
  },
  de: {
    eyebrow: "E-Commerce der nächsten Generation",
    title: "Schnelles, vertrauenswürdiges und conversion-starkes Shopping",
    body: "Produkte, Kategorien, Checkout und mehrsprachiges SEO werden mit Production-Qualitätsprüfungen entwickelt.",
    cta: "Produkte entdecken",
    valuesTitle: "Die Basis für ein besseres Einkaufserlebnis",
    values: [
      { title: "Schnell", body: "Server-first Rendering mit bewusst kleinem Client-JavaScript-Budget." },
      { title: "Barrierearm", body: "Tastatur, Fokus und semantische Struktur werden standardmäßig geschützt." },
      { title: "Zuverlässig", body: "Bestand, Preise und Bestellungen laufen mit transaktionalen Schutzmechanismen." },
    ],
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
          <div className="hero__content">
            <p className="eyebrow">{content.eyebrow}</p>
            <h1 id="hero-title">{content.title}</h1>
            <p className="hero__copy">{content.body}</p>
            <Link className="button" href={`/${locale}/products`}>
              {content.cta}
            </Link>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <div className="hero__visual-card" />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="values-title">
        <div className="container">
          <h2 id="values-title" className="section-title">
            {content.valuesTitle}
          </h2>
          <div className="value-grid">
            {content.values.map((value) => (
              <article className="value-card" key={value.title}>
                <h3>{value.title}</h3>
                <p>{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
