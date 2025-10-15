"use client";

import { useEffect, useState } from "react";
import type { NavigationItem } from "@/lib/navigation";
import { CATEGORIES_STORAGE_KEY, extractCategoryIconOverrides } from "@/lib/categoryIcons";

export function useNavigationWithIcons(baseNavigation: NavigationItem[]) {
  const [items, setItems] = useState<NavigationItem[]>(baseNavigation);

  useEffect(() => {
    if (typeof window === "undefined") {
      setItems(baseNavigation);
      return;
    }

    const applyOverrides = () => {
      try {
        const stored = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
        if (!stored) {
          setItems(baseNavigation);
          return;
        }
        const overrides = extractCategoryIconOverrides(JSON.parse(stored));
        if (!overrides || Object.keys(overrides).length === 0) {
          setItems(baseNavigation);
          return;
        }
        setItems(
          baseNavigation.map((item) => {
            const override = overrides[item.slug];
            return typeof override === "string" && override.trim()
              ? { ...item, icon: override }
              : item;
          })
        );
      } catch (error) {
        console.error("Failed to read category icon overrides", error);
        setItems(baseNavigation);
      }
    };

    applyOverrides();

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== CATEGORIES_STORAGE_KEY) {
        return;
      }
      applyOverrides();
    };

    const handleManualUpdate = () => applyOverrides();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("spm:categories-updated", handleManualUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("spm:categories-updated", handleManualUpdate);
    };
  }, [baseNavigation]);

  return items;
}
