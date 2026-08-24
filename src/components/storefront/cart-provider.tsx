"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  variantId: string;
  slug: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  currency: string;
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

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
        const safeQuantity = Math.max(1, Math.floor(quantity));
        setLines((current) => {
          const existing = current.find((item) => item.variantId === line.variantId);
          if (!existing) return [...current, { ...line, quantity: safeQuantity }];
          return current.map((item) =>
            item.variantId === line.variantId
              ? { ...item, quantity: item.quantity + safeQuantity }
              : item,
          );
        });
        setOpen(true);
      },
      removeLine(variantId) {
        setLines((current) => current.filter((item) => item.variantId !== variantId));
      },
      setQuantity(variantId, quantity) {
        const safeQuantity = Math.floor(quantity);
        if (safeQuantity <= 0) {
          setLines((current) => current.filter((item) => item.variantId !== variantId));
          return;
        }
        setLines((current) =>
          current.map((item) => (item.variantId === variantId ? { ...item, quantity: safeQuantity } : item)),
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
