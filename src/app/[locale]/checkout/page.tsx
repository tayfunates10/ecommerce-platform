import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { isLocale, type Locale } from "@/i18n/config";

const copy: Record<Locale, { eyebrow: string; title: string; body: string }> = {
  tr: { eyebrow: "Güvenli ödeme", title: "Sipariş bilgileri", body: "Sepetiniz sunucuda güncel fiyat ve stok bilgileriyle yeniden doğrulanır." },
  en: { eyebrow: "Secure checkout", title: "Order details", body: "Your cart is revalidated on the server against current pricing and inventory." },
  de: { eyebrow: "Sicherer Checkout", title: "Bestelldaten", body: "Ihr Warenkorb wird serverseitig anhand aktueller Preise und Bestände erneut geprüft." },
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const content = copy[locale];

  return (
    <main id="main-content" tabIndex={-1}>
      <section className="page-hero" aria-labelledby="checkout-title">
        <div className="container page-hero__inner">
          <p className="eyebrow">{content.eyebrow}</p>
          <h1 id="checkout-title">{content.title}</h1>
          <p>{content.body}</p>
        </div>
      </section>
      <section className="section">
        <div className="container checkout-layout">
          <CheckoutForm locale={locale} />
        </div>
      </section>
    </main>
  );
}
