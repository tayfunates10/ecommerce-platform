"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { useCart } from "@/components/storefront/cart-provider";

const copy = {
  tr: { cart: "Sepet", empty: "Sepetiniz boş.", subtotal: "Ara toplam", close: "Sepeti kapat", remove: "Kaldır", add: "Sepete ekle", soldOut: "Stokta yok" },
  en: { cart: "Cart", empty: "Your cart is empty.", subtotal: "Subtotal", close: "Close cart", remove: "Remove", add: "Add to cart", soldOut: "Out of stock" },
  de: { cart: "Warenkorb", empty: "Ihr Warenkorb ist leer.", subtotal: "Zwischensumme", close: "Warenkorb schließen", remove: "Entfernen", add: "In den Warenkorb", soldOut: "Nicht auf Lager" },
} satisfies Record<Locale, Record<string, string>>;

function formatMoney(amount: number, currency: string, locale: Locale) {
  const localeTag = locale === "tr" ? "tr-TR" : locale === "de" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(localeTag, { style: "currency", currency }).format(amount);
}

export function CartButton({ locale }: { locale: Locale }) {
  const cart = useCart();
  return (
    <button className="cart-button" type="button" onClick={() => cart.setOpen(true)} aria-haspopup="dialog">
      {copy[locale].cart} <span aria-label={`${cart.count}`}>({cart.count})</span>
    </button>
  );
}

export function AddToCartButton({
  locale,
  item,
  disabled = false,
}: {
  locale: Locale;
  item: { variantId: string; slug: string; name: string; sku: string; unitPrice: number; currency: string };
  disabled?: boolean;
}) {
  const cart = useCart();
  return (
    <button
      className="button button--primary"
      type="button"
      disabled={disabled}
      onClick={() => cart.addLine(item)}
    >
      {disabled ? copy[locale].soldOut : copy[locale].add}
    </button>
  );
}

export function CartDrawer({ locale }: { locale: Locale }) {
  const cart = useCart();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!cart.open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") cart.setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [cart]);

  if (!cart.open) return null;

  return (
    <div className="cart-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) cart.setOpen(false);
    }}>
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="cart-drawer__header">
          <h2 id="cart-title">{copy[locale].cart}</h2>
          <button ref={closeRef} className="icon-button" type="button" onClick={() => cart.setOpen(false)} aria-label={copy[locale].close}>×</button>
        </div>
        {cart.lines.length === 0 ? (
          <p className="cart-empty">{copy[locale].empty}</p>
        ) : (
          <>
            <ul className="cart-lines">
              {cart.lines.map((line) => (
                <li key={line.variantId} className="cart-line">
                  <div>
                    <strong>{line.name}</strong>
                    <small>{line.sku}</small>
                  </div>
                  <div className="cart-line__controls">
                    <input
                      aria-label={`${line.name} quantity`}
                      type="number"
                      min={1}
                      step={1}
                      value={line.quantity}
                      onChange={(event) => cart.setQuantity(line.variantId, Number(event.target.value))}
                    />
                    <span>{formatMoney(line.unitPrice * line.quantity, line.currency, locale)}</span>
                    <button type="button" className="text-button" onClick={() => cart.removeLine(line.variantId)}>{copy[locale].remove}</button>
                  </div>
                </li>
              ))}
            </ul>
            {cart.currency && (
              <div className="cart-total">
                <span>{copy[locale].subtotal}</span>
                <strong>{formatMoney(cart.subtotal, cart.currency, locale)}</strong>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
