"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type OrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  unitPriceLabel: string;
  linePriceLabel: string;
  options: string[];
  category?: string;
  image?: string;
};

export type CustomerInfo = {
  name?: string;
  phone?: string;
  email?: string;
  notes?: string;
};

export type OrderEntry = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  tableId: string | null;
  customerInfo?: CustomerInfo;
  subtotal: number;
  subtotalLabel: string;
  serviceCharge?: number;
  serviceChargeLabel?: string;
  serviceChargeRate?: number;
  tax: number;
  taxLabel: string;
  taxRate?: number;
  total: number;
  totalLabel: string;
  status: "pending" | "preparing" | "ready" | "served" | "cancelled";
  paymentMethod?: "cash" | "card" | "qris" | "transfer";
  paymentStatus?: "pending" | "paid" | "failed";
  estimatedTime?: number; // dalam menit
  actualServedTime?: string;
  notes?: string;
  items: OrderItem[];
};

type OrdersContextValue = {
  orders: OrderEntry[];
  addOrder: (order: OrderEntry) => void;
  updateOrderStatus: (id: string, status: OrderEntry["status"]) => void;
  markServed: (id: string) => void;
  clearOrders: () => void;
};

const STORAGE_KEY = "spm-orders";

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<OrderEntry[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const readFromStorage = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as OrderEntry[];
          setOrders(parsed);
        } else {
          setOrders([]);
        }
      } catch (error) {
        console.error("Failed to parse orders", error);
      }
    };

    readFromStorage();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        readFromStorage();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error("Failed to persist orders", error);
    }
  }, [orders]);

  const addOrder = useCallback((order: OrderEntry) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderEntry["status"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id 
          ? { 
              ...order, 
              status, 
              updatedAt: new Date().toISOString(),
              actualServedTime: status === "served" ? new Date().toISOString() : order.actualServedTime
            } 
          : order
      )
    );
  }, []);

  const markServed = useCallback((id: string) => {
    updateOrderStatus(id, "served");
  }, [updateOrderStatus]);

  const clearOrders = useCallback(() => setOrders([]), []);

  const value = useMemo(
    () => ({ orders, addOrder, updateOrderStatus, markServed, clearOrders }),
    [orders, addOrder, updateOrderStatus, markServed, clearOrders]
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders must be used within OrdersProvider");
  }
  return ctx;
}
