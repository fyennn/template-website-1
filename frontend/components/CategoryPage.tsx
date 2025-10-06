import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import type { CategorySlug } from "@/lib/products";
import { PRODUCT_CATALOG } from "@/lib/products";

export type CategoryPageProps = {
  categorySlug: CategorySlug;
};

const gridClassName =
  "p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24";

export function CategoryPage({ categorySlug }: CategoryPageProps) {
  const products = PRODUCT_CATALOG[categorySlug] ?? [];

  return (
    <AppShell activeSlug={categorySlug}>
      <main className={gridClassName} data-animate-grid>
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
