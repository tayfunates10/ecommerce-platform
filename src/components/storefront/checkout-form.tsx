"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "@/components/storefront/cart-provider";
import type { Locale } from "@/i18n/config";

type CheckoutErrorCode =
  | "CHECKOUT_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "INSUFFICIENT_INVENTORY"
  | "PRICE_UNAVAILABLE"
  | "VARIANT_UNAVAILABLE"
  | "RATE_LIMITED"
  | "CHECKOUT_FAILED";

type CheckoutCopy = {
  title: string;
  empty: string;
  products: string;
  email: string;
  fullName: string;
  address: string;
  city: string;
  postal: string;
  submit: string;
  submitting: string;
  success: string;
  order: string;
  localNote: string;
  unavailableTitle: string;
  summary: string;
  quantity: string;
  subtotal: string;
  total: string;
  errors: Record<CheckoutErrorCode, string>;
};

const copy: Record<Locale, CheckoutCopy> = {
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
    unavailableTitle: "Ödeme şu anda kullanılamıyor",
    summary: "Sipariş özeti",
    quantity: "Adet",
    subtotal: "Ara toplam",
    total: "Toplam",
    errors: {
      CHECKOUT_UNAVAILABLE: "Ödeme şu anda kullanılamıyor.",
      INVALID_REQUEST: "Sipariş bilgileri geçersiz. Alanları kontrol edip tekrar deneyin.",
      INSUFFICIENT_INVENTORY: "Sepetinizdeki bir ürün için yeterli stok kalmadı. Sepetinizi güncelleyin.",
      PRICE_UNAVAILABLE: "Sepetinizdeki bir ürünün güncel fiyatı bulunamadı. Sepetinizi güncelleyin.",
      VARIANT_UNAVAILABLE: "Sepetinizdeki bir ürün artık satışta değil. Sepetinizi güncelleyin.",
      RATE_LIMITED: "Çok fazla deneme yapıldı. Kısa süre sonra tekrar deneyin.",
      CHECKOUT_FAILED: "Sipariş tamamlanamadı. Lütfen tekrar deneyin.",
    },
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
    unavailableTitle: "Checkout is currently unavailable",
    summary: "Order summary",
    quantity: "Quantity",
    subtotal: "Subtotal",
    total: "Total",
    errors: {
      CHECKOUT_UNAVAILABLE: "Checkout is currently unavailable.",
      INVALID_REQUEST: "The checkout details are invalid. Review the form and try again.",
      INSUFFICIENT_INVENTORY: "An item in your cart no longer has enough stock. Update your cart and try again.",
      PRICE_UNAVAILABLE: "A current price is unavailable for an item in your cart. Update your cart and try again.",
      VARIANT_UNAVAILABLE: "An item in your cart is no longer available for sale. Update your cart and try again.",
      RATE_LIMITED: "Too many attempts were made. Please try again shortly.",
      CHECKOUT_FAILED: "Checkout could not be completed. Please try again.",
    },
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
    unavailableTitle: "Checkout ist derzeit nicht verfügbar",
    summary: "Bestellübersicht",
    quantity: "Menge",
    subtotal: "Zwischensumme",
    total: "Gesamtsumme",
    errors: {
      CHECKOUT_UNAVAILABLE: "Checkout ist derzeit nicht verfügbar.",
      INVALID_REQUEST: "Die Bestelldaten sind ungültig. Prüfen Sie das Formular und versuchen Sie es erneut.",
      INSUFFICIENT_INVENTORY: "Für einen Artikel im Warenkorb ist nicht mehr genügend Bestand verfügbar. Aktualisieren Sie den Warenkorb.",
      PRICE_UNAVAILABLE: "Für einen Artikel im Warenkorb ist kein aktueller Preis verfügbar. Aktualisieren Sie den Warenkorb.",
      VARIANT_UNAVAILABLE: "Ein Artikel im Warenkorb ist nicht mehr erhältlich. Aktualisieren Sie den Warenkorb.",
      RATE_LIMITED: "Zu viele Versuche. Bitte versuchen Sie es in Kürze erneut.",
      CHECKOUT_FAILED: "Die Bestellung konnte nicht abgeschlossen werden. Bitte versuchen Sie es erneut.",
    },
  },
};

function formatMoney(amount: number, currency: string, locale: Locale) {
  const localeTag = locale === "tr" ? "tr-TR" : locale === "de" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(localeTag, { style: "currency", currency }).format(amount);
}

function OrderSummary({ locale }: { locale: Locale }) {
  const cart = useCart();
  const content = copy[locale];

  return (
    <section className="checkout-summary" aria-labelledby="checkout-summary-title">
      <h2 id="checkout-summary-title">{content.summary}</h2>
      <ul className="checkout-summary__lines">
        {cart.lines.map((line) => (
          <li key={line.variantId}>
            <div>
              <strong>{line.name}</strong>
              <small>{line.sku}</small>
              <span>{content.quantity}: {line.quantity}</span>
            </div>
            <strong>{formatMoney(line.unitPrice * line.quantity, line.currency, locale)}</strong>
          </li>
        ))}
      </ul>
      {cart.currency ? (
        <div className="checkout-summary__totals">
          <div><span>{content.subtotal}</span><strong>{formatMoney(cart.subtotal, cart.currency, locale)}</strong></div>
          <div><span>{content.total}</span><strong>{formatMoney(cart.subtotal, cart.currency, locale)}</strong></div>
        </div>
      ) : null}
    </section>
  );
}

export function CheckoutForm({ locale, checkoutAvailable }: { locale: Locale; checkoutAvailable: boolean }) {
  const cart = useCart();
  const content = copy[locale];
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const pendingRef = useRef(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

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

  if (!checkoutAvailable) {
    return (
      <div className="checkout-grid">
        <OrderSummary locale={locale} />
        <section className="checkout-status checkout-status--unavailable" aria-labelledby="checkout-unavailable-title">
          <h2 id="checkout-unavailable-title">{content.unavailableTitle}</h2>
          <p>{content.localNote}</p>
          <Link className="button button--secondary" href={`/${locale}/products`}>{content.products}</Link>
        </section>
      </div>
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) return;
    pendingRef.current = true;
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
      const data = await response.json() as { ok?: boolean; code?: CheckoutErrorCode; orderNumber?: string };
      if (!response.ok || !data.ok || !data.orderNumber) {
        setError(content.errors[data.code ?? "CHECKOUT_FAILED"] ?? content.errors.CHECKOUT_FAILED);
        return;
      }

      for (const line of cart.lines) cart.removeLine(line.variantId);
      setOrderNumber(data.orderNumber);
    } catch {
      setError(content.errors.CHECKOUT_FAILED);
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <div className="checkout-grid">
      <OrderSummary locale={locale} />
      <form className="checkout-form" onSubmit={submit} aria-busy={pending}>
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
        {error ? <p ref={errorRef} className="checkout-error" role="alert" tabIndex={-1}>{error}</p> : null}
        <button className="button button--primary" type="submit" aria-disabled={pending}>
          {pending ? content.submitting : content.submit}
        </button>
      </form>
    </div>
  );
}
