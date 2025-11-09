"use client";

import { useEffect, useMemo, useState } from "react";
import {
  loadAdminProductsFromStorage,
  createCatalogFromAdminProducts,
  PRODUCTS_EVENT,
  PRODUCTS_STORAGE_KEY,
  DEFAULT_ADMIN_PRODUCTS,
  type AdminProductRecord,
} from "@/lib/products";

export function useProductCatalogData() {
  const [adminProducts, setAdminProducts] = useState<AdminProductRecord[]>(() =>
    DEFAULT_ADMIN_PRODUCTS.map((product) => ({ ...product }))
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const sync = () => {
      setAdminProducts(loadAdminProductsFromStorage());
    };
    sync();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === PRODUCTS_STORAGE_KEY) {
        sync();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(PRODUCTS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(PRODUCTS_EVENT, sync);
    };
  }, []);

  const catalogData = useMemo(() => {
    if (!adminProducts || adminProducts.length === 0) {
      return createCatalogFromAdminProducts(DEFAULT_ADMIN_PRODUCTS);
    }
    return createCatalogFromAdminProducts(adminProducts);
  }, [adminProducts]);

  return {
    adminProducts,
    ...catalogData,
  };
}
