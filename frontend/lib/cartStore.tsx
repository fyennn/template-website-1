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

export type PaymentMethodKey = "qris" | "cash" | "card";

export type CartContextValue = {
  items: CartItem[];
  lines: DerivedCartLine[];
  summary: CartSummary;
  tableId: string | null;
  tableActive: boolean;
  paymentMethod: PaymentMethodKey | null;
  addItem: (item: CartItem) => void;
  updateQuantity: (index: number, quantity: number) => void;
  replaceItem: (index: number, item: CartItem) => void;
  insertItemAfter: (index: number, item: CartItem) => void;
  removeItem: (index: number) => void;
  clear: () => void;
  setTableId: (tableId: string | null) => void;
  setTableActive: (active: boolean) => void;
  setPaymentMethod: (method: PaymentMethodKey | null) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const TABLE_STORAGE_KEY = "spm-cart-table";
const TABLE_ACTIVE_KEY = "spm-cart-table-active";
const PAYMENT_METHOD_KEY = "spm-cart-payment-method";

const isPaymentMethodKey = (value: unknown): value is PaymentMethodKey =>
  value === "qris" || value === "cash" || value === "card";

const normalizeCartOptions = (options: CartItem["options"]) =>
  options
    .map((option) => ({
      group: option.group,
      label: option.label,
      priceDelta: option.priceDelta ?? 0,
    }))
    .sort((a, b) => {
      if (a.group === b.group) {
        if (a.label === b.label) {
          return a.priceDelta - b.priceDelta;
        }
        return a.label.localeCompare(b.label);
      }
      return a.group.localeCompare(b.group);
    });

const buildCartKey = (item: CartItem) =>
  `${item.productId}::${normalizeCartOptions(item.options)
    .map(
      (option) =>
        `${option.group}>>${option.label}>>${option.priceDelta.toString()}`
    )
    .join("|")}`;

const mergeCartItems = (items: CartItem[]): CartItem[] => {
  const order: string[] = [];
  const map = new Map<string, CartItem>();

  items.forEach((item) => {
    const key = buildCartKey(item);
    if (!map.has(key)) {
      order.push(key);
      map.set(key, { ...item, options: [...item.options] });
    } else {
      const existing = map.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      }
    }
  });

  return order.map((key) => {
    const entry = map.get(key)!;
    return { ...entry, options: [...entry.options] };
  });
};

const cartItemsEqual = (left: CartItem, right: CartItem) =>
  buildCartKey(left) === buildCartKey(right);

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
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethodKey | null>(null);

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
      const storedPayment = window.localStorage.getItem(PAYMENT_METHOD_KEY);
      if (isPaymentMethodKey(storedPayment)) {
        setPaymentMethodState(storedPayment);
      }
    } catch (error) {
      console.error("Failed to restore cart state", error);
    }
  }, []);

  useEffect(() => {
    setItems((prev) => {
      const merged = mergeCartItems(prev);
      if (merged.length !== prev.length) {
        return merged;
      }
      const isIdentical = merged.every(
        (item, index) =>
          cartItemsEqual(item, prev[index]) &&
          item.quantity === prev[index].quantity &&
          item.notes === prev[index].notes
      );
      return isIdentical ? prev : merged;
    });
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((entry) =>
        cartItemsEqual(entry, item)
      );
      if (existingIndex === -1) {
        return [...prev, item];
      }
      return prev.map((entry, index) =>
        index === existingIndex
          ? { ...entry, quantity: entry.quantity + item.quantity }
          : entry
      );
    });
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

  const setPaymentMethod = useCallback((method: PaymentMethodKey | null) => {
    setPaymentMethodState(method);
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (method) {
        window.localStorage.setItem(PAYMENT_METHOD_KEY, method);
      } else {
        window.localStorage.removeItem(PAYMENT_METHOD_KEY);
      }
    } catch (error) {
      console.error("Failed to persist payment method", error);
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
      paymentMethod,
      addItem,
      updateQuantity,
      replaceItem,
      insertItemAfter,
      removeItem,
      clear,
      setTableId,
      setTableActive,
      setPaymentMethod,
    }),
    [
      items,
      lines,
      summary,
      tableId,
      tableActive,
      paymentMethod,
      addItem,
      updateQuantity,
      replaceItem,
      insertItemAfter,
      removeItem,
      clear,
      setTableId,
      setTableActive,
      setPaymentMethod,
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
