"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/storefront/cart-provider";
import type { Locale } from "@/i18n/config";

const copy = {
  tr: {
    title: "Siparişi tamamla",
    empty: "Sepetiniz boş.",
    products: "Ürünlere dön",
    email: "E-posta",
    fullName: "Ad soyad",
    address: "Adres",
    city: "Şehir",
    postal: "Posta kodu",
    submit: "Siparişi oluştur",
    submitting: "Sipariş oluşturuluyor…",
    success: "Siparişiniz oluşturuldu",
    order: "Sipariş numarası",
    localNote: "Yerel geliştirmede ödeme güvenli test sağlayıcısıyla simüle edilir. Production ortamında gerçek ödeme sağlayıcısı yapılandırılmadan sipariş gönderilemez.",
  },
  en: {
    title: "Complete checkout",
    empty: "Your cart is empty.",
    products: "Back to products",
    email: "Email",
    fullName: "Full name",
    address: "Address",
    city: "City",
    postal: "Postal code",
    submit: "Create order",
    submitting: "Creating order…",
    success: "Your order was created",
    order: "Order number",
    localNote: "In local development, payment is simulated with a safe test gateway. Production checkout stays disabled until a real payment provider is configured.",
  },
  de: {
    title: "Bestellung abschließen",
    empty: "Ihr Warenkorb ist leer.",
    products: "Zurück zu Produkten",
    email: "E-Mail",
    fullName: "Vor- und Nachname",
    address: "Adresse",
    city: "Stadt",
    postal: "Postleitzahl",
    submit: "Bestellung erstellen",
    submitting: "Bestellung wird erstellt…",
    success: "Ihre Bestellung wurde erstellt",
    order: "Bestellnummer",
    localNote: "In der lokalen Entwicklung wird die Zahlung mit einem sicheren Test-Gateway simuliert. In Produktion bleibt der Checkout deaktiviert, bis ein echter Zahlungsanbieter konfiguriert ist.",
  },
} satisfies Record<Locale, Record<string, string>>;

export function CheckoutForm({ locale }: { locale: Locale }) {
  const cart = useCart();
  const content = copy[locale];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  if (orderNumber) {
    return (
      <div className="checkout-status" role="status">
        <h2>{content.success}</h2>
        <p>{content.order}: <strong>{orderNumber}</strong></p>
        <Link className="button button--secondary" href={`/${locale}/products`}>{content.products}</Link>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="checkout-status">
        <p>{content.empty}</p>
        <Link className="button button--secondary" href={`/${locale}/products`}>{content.products}</Link>
      </div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const idempotencyKey = crypto.randomUUID();

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          email: String(form.get("email") ?? ""),
          fullName: String(form.get("fullName") ?? ""),
          address: String(form.get("address") ?? ""),
          city: String(form.get("city") ?? ""),
          postalCode: String(form.get("postalCode") ?? ""),
          idempotencyKey,
          lines: cart.lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
        }),
      });
      const data = await response.json() as { ok?: boolean; error?: string; orderNumber?: string };
      if (!response.ok || !data.ok || !data.orderNumber) throw new Error(data.error ?? "Checkout failed.");

      for (const line of cart.lines) cart.removeLine(line.variantId);
      setOrderNumber(data.orderNumber);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Checkout failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={submit}>
      <h2>{content.title}</h2>
      <p className="checkout-note">{content.localNote}</p>
      <label>
        <span>{content.email}</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span>{content.fullName}</span>
        <input name="fullName" autoComplete="name" required minLength={2} maxLength={120} />
      </label>
      <label>
        <span>{content.address}</span>
        <input name="address" autoComplete="street-address" required minLength={3} maxLength={240} />
      </label>
      <div className="checkout-form__row">
        <label>
          <span>{content.city}</span>
          <input name="city" autoComplete="address-level2" required minLength={2} maxLength={120} />
        </label>
        <label>
          <span>{content.postal}</span>
          <input name="postalCode" autoComplete="postal-code" maxLength={20} />
        </label>
      </div>
      {error ? <p className="checkout-error" role="alert">{error}</p> : null}
      <button className="button button--primary" type="submit" disabled={pending}>
        {pending ? content.submitting : content.submit}
      </button>
    </form>
  );
}
