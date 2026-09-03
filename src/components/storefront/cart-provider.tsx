"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/i18n/config";

const STORAGE_KEY = "ecommerce-platform:cart:v1";

export type CartLine = {
  variantId: string;
  slug: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  available: number;
};

type StoredLine = Pick<CartLine, "variantId" | "quantity">;

type CartContextValue = {
  lines: CartLine[];
  open: boolean;
  count: number;
  subtotal: number;
  currency: string | null;
  setOpen: (open: boolean) => void;
  addLine: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeLine: (variantId: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function sanitizeStoredLines(value: unknown): StoredLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const line = candidate as Partial<StoredLine>;
    if (
      typeof line.variantId !== "string" ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(line.variantId) ||
      !Number.isSafeInteger(line.quantity) ||
      Number(line.quantity) < 1
    ) {
      return [];
    }
    return [{ variantId: line.variantId, quantity: Number(line.quantity) }];
  });
}

function sanitizeResolvedLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const line = candidate as Partial<CartLine>;
    if (
      typeof line.variantId !== "string" ||
      typeof line.slug !== "string" ||
      typeof line.name !== "string" ||
      typeof line.sku !== "string" ||
      typeof line.currency !== "string" ||
      !Number.isFinite(line.unitPrice) ||
      !Number.isSafeInteger(line.available) ||
      Number(line.available) <= 0 ||
      !Number.isSafeInteger(line.quantity) ||
      Number(line.quantity) < 1
    ) {
      return [];
    }

    const available = Number(line.available);
    return [{
      variantId: line.variantId,
      slug: line.slug,
      name: line.name,
      sku: line.sku,
      currency: line.currency,
      unitPrice: Number(line.unitPrice),
      available,
      quantity: Math.min(Number(line.quantity), available),
    }];
  });
}

export function CartProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      let storedLines: StoredLine[] = [];
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        storedLines = stored ? sanitizeStoredLines(JSON.parse(stored)) : [];
      } catch {
        storedLines = [];
      }

      if (storedLines.length === 0) {
        hydratedRef.current = true;
        if (active) setLines([]);
        return;
      }

      try {
        const response = await fetch("/api/cart/resolve", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ locale, lines: storedLines }),
        });
        if (!response.ok) throw new Error("Cart hydration failed");
        const data = await response.json() as { lines?: unknown };
        const resolved = sanitizeResolvedLines(data.lines);
        hydratedRef.current = true;
        if (active) setLines(resolved);
      } catch {
        hydratedRef.current = true;
        if (active) setLines([]);
      }
    }

    void hydrate();
    return () => {
      active = false;
    };
  }, [locale]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      const persisted = lines.map(({ variantId, quantity }) => ({ variantId, quantity }));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
    } catch {
      // Storage can be unavailable in privacy modes. The in-memory cart remains usable.
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const currency = lines[0]?.currency ?? null;

    return {
      lines,
      open,
      count,
      subtotal,
      currency,
      setOpen,
      addLine(line, quantity = 1) {
        if (!Number.isSafeInteger(line.available) || line.available <= 0) return;
        const safeQuantity = Math.min(line.available, Math.max(1, Math.floor(quantity)));
        setLines((current) => {
          const existing = current.find((item) => item.variantId === line.variantId);
          if (!existing) return [...current, { ...line, quantity: safeQuantity }];
          return current.map((item) =>
            item.variantId === line.variantId
              ? { ...item, ...line, quantity: Math.min(line.available, item.quantity + safeQuantity) }
              : item,
          );
        });
        setOpen(true);
      },
      removeLine(variantId) {
        setLines((current) => current.filter((item) => item.variantId !== variantId));
      },
      setQuantity(variantId, quantity) {
        if (!Number.isFinite(quantity)) return;
        setLines((current) =>
          current.map((item) => {
            if (item.variantId !== variantId) return item;
            const safeQuantity = Math.min(item.available, Math.max(1, Math.floor(quantity)));
            return { ...item, quantity: safeQuantity };
          }),
        );
      },
    };
  }, [lines, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}
