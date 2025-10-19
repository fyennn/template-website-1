"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cartStore";

const TABLES_STORAGE_KEY = "spm-admin-tables";

type TableAccessState = {
  tableAvailabilityChecked: boolean;
  currentTableSlug: string | null;
  tableActive: boolean;
};

export function useTableAccess(): TableAccessState {
  const searchParams = useSearchParams();
  const { tableId, tableActive, setTableId, setTableActive } = useCart();
  const [currentTableSlug, setCurrentTableSlug] = useState<string | null>(null);
  const [tableAvailabilityChecked, setTableAvailabilityChecked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const tableParam = searchParams?.get("table");
    const slug = tableParam && tableParam.trim().length > 0 ? tableParam : null;

    if (slug) {
      setCurrentTableSlug(slug);

      let nextActive = true;
      let usableTableId: string | null = slug;

      try {
        const raw = window.localStorage.getItem(TABLES_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Array<{ slug: string; active?: boolean }>;
          const match = parsed.find((entry) => entry.slug === slug);
          if (match) {
            nextActive = match.active !== false;
            if (!nextActive) {
              usableTableId = null;
            }
          } else {
            nextActive = false;
            usableTableId = null;
          }
        }
      } catch (error) {
        console.error("Failed to read table configuration", error);
      }

      if (usableTableId !== tableId) {
        setTableId(usableTableId);
      }
      setTableActive(nextActive);
    } else {
      setCurrentTableSlug(null);
      if (tableId !== null) {
        setTableId(null);
      }
      setTableActive(true);
    }

    setTableAvailabilityChecked(true);
  }, [searchParams, setTableActive, setTableId, tableId]);

  return {
    tableAvailabilityChecked,
    currentTableSlug,
    tableActive,
  };
}
