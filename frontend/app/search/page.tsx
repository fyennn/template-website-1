"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { ALL_PRODUCTS_WITH_CATEGORY, type CategorySlug } from "@/lib/products";
import { NAVIGATION, categoryToPath } from "@/lib/navigation";
import { useTableAccess } from "@/hooks/useTableAccess";
import { TableAccessBlocker } from "@/components/TableAccessBlocker";

const CATEGORY_LABEL_LOOKUP = NAVIGATION.reduce<Record<CategorySlug, string>>(
  (acc, item) => {
    acc[item.slug] = item.label;
    return acc;
  },
  {
    all: "All",
  } as Record<CategorySlug, string>
);

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const {
    tableAvailabilityChecked,
    currentTableSlug,
    tableActive,
  } = useTableAccess();

  const withTableQuery = useCallback(
    (path: string) => {
      if (!currentTableSlug) {
        return path;
      }
      const [base, hash] = path.split("#");
      const separator = base.includes("?") ? "&" : "?";
      return `${base}${separator}table=${encodeURIComponent(currentTableSlug)}${
        hash ? `#${hash}` : ""
      }`;
    },
    [currentTableSlug]
  );

  const resultsByCategory = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const base = trimmed.length === 0
      ? ALL_PRODUCTS_WITH_CATEGORY
      : ALL_PRODUCTS_WITH_CATEGORY.filter(({ product }) =>
          product.name.toLowerCase().includes(trimmed) ||
          product.description.toLowerCase().includes(trimmed)
        );

    const grouped = new Map<CategorySlug, typeof base>();
    base.forEach((entry) => {
      if (!grouped.has(entry.category)) {
        grouped.set(entry.category, []);
      }
      grouped.get(entry.category)?.push(entry);
    });

    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [query]);

  const shouldBlockAccess =
    tableAvailabilityChecked && (!currentTableSlug || !tableActive);

  return (
    <AppShell activeSlug="all">
      {shouldBlockAccess ? (
        <TableAccessBlocker
          tableSlug={currentTableSlug}
          retryHref={
            currentTableSlug
              ? `/search?table=${encodeURIComponent(currentTableSlug)}`
              : "/menu"
          }
        />
      ) : (
        <div className="p-4 pb-24 space-y-8">
          <div className="max-w-3xl mx-auto">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-gray-400 mb-2">
              Cari Produk
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                search
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Espresso, pistachio, merchandise…"
                className="w-full rounded-full bg-white/80 backdrop-blur px-12 py-3 text-sm text-gray-700 shadow-inner border border-white/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
              />
            </div>
          </div>

          {resultsByCategory.length === 0 ? (
            <p className="text-center text-sm text-gray-500">
              Tidak ditemukan produk yang cocok untuk{" "}
              <span className="font-semibold text-gray-700">
                {query || "kata kunci ini"}
              </span>
              .
            </p>
          ) : (
            <div className="space-y-10">
              {resultsByCategory.map(([category, entries]) => (
                <section key={category} className="space-y-4">
                  <div className="flex items-center justify-between max-w-5xl mx-auto">
                    <h2 className="text-lg font-semibold text-gray-700">
                      {CATEGORY_LABEL_LOOKUP[category] ?? category}
                    </h2>
                    <Link
                      href={withTableQuery(categoryToPath(category))}
                      className="text-xs font-medium text-[var(--primary-color)] hover:text-emerald-700"
                    >
                      Lihat kategori
                    </Link>
                  </div>
                  <div
                    className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    data-animate-grid
                  >
                    {entries.map(({ product }, index) => (
                      <ProductCard key={product.id} product={product} index={index} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
