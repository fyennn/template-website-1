import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import type { CategorySlug } from "@/lib/products";
import { PRODUCT_CATALOG } from "@/lib/products";
import { NAVIGATION } from "@/lib/navigation";

export type CategoryPageProps = {
  categorySlug: CategorySlug;
};

const gridClassName =
  "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

export function CategoryPage({ categorySlug }: CategoryPageProps) {
  if (categorySlug === "all") {
    const navigableCategories = NAVIGATION.filter((item) => item.slug !== "all");

    return (
      <AppShell activeSlug={categorySlug}>
        <div className="space-y-10 p-4 pb-24">
          {navigableCategories.map((navItem) => {
            const categoryProducts = PRODUCT_CATALOG[navItem.slug] ?? [];
            if (categoryProducts.length === 0) {
              return null;
            }
            return (
              <section key={navItem.slug} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-700">
                      {navItem.label}
                    </h2>
                  </div>
                  <Link
                    href={navItem.href}
                    className="text-xs font-medium text-[var(--primary-color)] hover:text-emerald-700"
                  >
                    Lihat kategori
                  </Link>
                </div>
                <div className={`${gridClassName}`} data-animate-grid>
                  {categoryProducts.map((product, index) => (
                    <ProductCard
                      key={`${navItem.slug}-${product.id}`}
                      product={product}
                      index={index}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </AppShell>
    );
  }

  const products = PRODUCT_CATALOG[categorySlug] ?? [];

  return (
    <AppShell activeSlug={categorySlug}>
      <main className={`p-4 pb-24 ${gridClassName}`} data-animate-grid>
        {products.length > 0 ? (
          products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))
        ) : (
          <p className="text-sm text-gray-500">
            Produk belum tersedia untuk kategori ini.
          </p>
        )}
      </main>
    </AppShell>
  );
}
