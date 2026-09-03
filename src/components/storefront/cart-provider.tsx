"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

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

function sanitizeStoredLines(value: unknown): CartLine[] {
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
      (line.available ?? 0) <= 0 ||
      !Number.isSafeInteger(line.quantity)
    ) {
      return [];
    }
    return [{
      variantId: line.variantId,
      slug: line.slug,
      name: line.name,
      sku: line.sku,
      currency: line.currency,
      unitPrice: Number(line.unitPrice),
      available: Number(line.available),
      quantity: Math.min(Math.max(1, Number(line.quantity)), Number(line.available)),
    }];
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        setLines(stored ? sanitizeStoredLines(JSON.parse(stored)) : []);
      } catch {
        setLines([]);
      } finally {
        hydratedRef.current = true;
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
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
