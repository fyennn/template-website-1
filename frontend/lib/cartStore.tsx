"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { CartItem } from "@/lib/cart";
import {
  deriveCartLines,
  computeCartSummary,
  type DerivedCartLine,
  type CartSummary,
} from "@/lib/cart";

export type CartContextValue = {
  items: CartItem[];
  lines: DerivedCartLine[];
  summary: CartSummary;
  addItem: (item: CartItem) => void;
  updateQuantity: (index: number, quantity: number) => void;
  replaceItem: (index: number, item: CartItem) => void;
  removeItem: (index: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  initialItems = [],
}: {
  children: ReactNode;
  initialItems?: CartItem[];
}) {
  const [items, setItems] = useState<CartItem[]>(initialItems);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    setItems((prev) =>
      prev.map((entry, idx) =>
        idx === index
          ? { ...entry, quantity: Math.max(1, quantity) }
          : entry
      )
    );
  }, []);

  const replaceItem = useCallback((index: number, item: CartItem) => {
    setItems((prev) =>
      prev.map((entry, idx) => (idx === index ? { ...item } : entry))
    );
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo(() => deriveCartLines(items), [items]);
  const summary = useMemo(() => computeCartSummary(lines), [lines]);

  const value = useMemo(
    () => ({ items, lines, summary, addItem, updateQuantity, replaceItem, removeItem, clear }),
    [items, lines, summary, addItem, updateQuantity, replaceItem, removeItem, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart harus dipakai di dalam CartProvider");
  }
  return ctx;
}
