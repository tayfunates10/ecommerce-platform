"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import { useCart } from "@/components/storefront/cart-provider";

const copy = {
  tr: { cart: "Sepet", empty: "Sepetiniz boş.", subtotal: "Ara toplam", close: "Sepeti kapat", remove: "Kaldır", add: "Sepete ekle", soldOut: "Stokta yok", quantity: "Adet" },
  en: { cart: "Cart", empty: "Your cart is empty.", subtotal: "Subtotal", close: "Close cart", remove: "Remove", add: "Add to cart", soldOut: "Out of stock", quantity: "Quantity" },
  de: { cart: "Warenkorb", empty: "Ihr Warenkorb ist leer.", subtotal: "Zwischensumme", close: "Warenkorb schließen", remove: "Entfernen", add: "In den Warenkorb", soldOut: "Nicht auf Lager", quantity: "Menge" },
} satisfies Record<Locale, Record<string, string>>;

function formatMoney(amount: number, currency: string, locale: Locale) {
  const localeTag = locale === "tr" ? "tr-TR" : locale === "de" ? "de-DE" : "en-US";
  return new Intl.NumberFormat(localeTag, { style: "currency", currency }).format(amount);
}

export function CartButton({ locale }: { locale: Locale }) {
  const cart = useCart();
  return (
    <button className="cart-button" type="button" onClick={() => cart.setOpen(true)} aria-haspopup="dialog">
      {copy[locale].cart} <span aria-hidden="true">({cart.count})</span><span className="sr-only"> {cart.count}</span>
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
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { open, setOpen } = cart;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="cart-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <aside ref={dialogRef} className="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="cart-drawer__header">
          <h2 id="cart-title">{copy[locale].cart}</h2>
          <button ref={closeRef} className="icon-button" type="button" onClick={() => setOpen(false)} aria-label={copy[locale].close}>×</button>
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
                      aria-label={`${line.name}: ${copy[locale].quantity}`}
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
