"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
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
  tableId: string | null;
  tableActive: boolean;
  addItem: (item: CartItem) => void;
  updateQuantity: (index: number, quantity: number) => void;
  replaceItem: (index: number, item: CartItem) => void;
  insertItemAfter: (index: number, item: CartItem) => void;
  removeItem: (index: number) => void;
  clear: () => void;
  setTableId: (tableId: string | null) => void;
  setTableActive: (active: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const TABLE_STORAGE_KEY = "spm-cart-table";
const TABLE_ACTIVE_KEY = "spm-cart-table-active";

export function CartProvider({
  children,
  initialItems = [],
}: {
  children: ReactNode;
  initialItems?: CartItem[];
}) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [tableId, setTableIdState] = useState<string | null>(null);
  const [tableActive, setTableActiveState] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const saved = window.localStorage.getItem(TABLE_STORAGE_KEY);
      if (saved) {
        setTableIdState(saved);
      }
      const activeSaved = window.localStorage.getItem(TABLE_ACTIVE_KEY);
      if (activeSaved) {
        setTableActiveState(activeSaved !== "false");
      }
    } catch (error) {
      console.error("Failed to restore table id", error);
    }
  }, []);

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

  const insertItemAfter = useCallback((index: number, item: CartItem) => {
    setItems((prev) => {
      const next = [...prev];
      const targetIndex = Math.min(next.length, index + 1);
      next.splice(targetIndex, 0, { ...item });
      return next;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const setTableId = useCallback((value: string | null) => {
    setTableIdState(value);
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (value) {
        window.localStorage.setItem(TABLE_STORAGE_KEY, value);
      } else {
        window.localStorage.removeItem(TABLE_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to persist table id", error);
    }
  }, []);

  const setTableActive = useCallback((value: boolean) => {
    setTableActiveState(value);
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(TABLE_ACTIVE_KEY, value ? "true" : "false");
    } catch (error) {
      console.error("Failed to persist table active state", error);
    }
  }, []);

  const lines = useMemo(() => deriveCartLines(items), [items]);
  const summary = useMemo(() => computeCartSummary(lines), [lines]);

  const value = useMemo(
    () => ({
      items,
      lines,
      summary,
      tableId,
      tableActive,
      addItem,
      updateQuantity,
      replaceItem,
      insertItemAfter,
      removeItem,
      clear,
      setTableId,
      setTableActive,
    }),
    [
      items,
      lines,
      summary,
      tableId,
      tableActive,
      addItem,
      updateQuantity,
      replaceItem,
      insertItemAfter,
      removeItem,
      clear,
      setTableId,
      setTableActive,
    ]
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
