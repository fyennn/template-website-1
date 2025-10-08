"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { formatCurrency, ALL_PRODUCTS_WITH_CATEGORY } from "@/lib/products";
import { categoryToPath } from "@/lib/navigation";
import { useCart } from "@/lib/cartStore";

export default function CartPage() {
  const router = useRouter();
  const { lines, summary, updateQuantity, removeItem } = useCart();
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  const recommendations = useMemo(() => {
    const seen = new Set<string>();
    return ALL_PRODUCTS_WITH_CATEGORY.filter(({ product }) => {
      if (seen.has(product.id)) {
        return false;
      }
      seen.add(product.id);
      return true;
    })
      .filter(({ product }) => !lines.some((line) => line.productId === product.id))
      .slice(0, 3);
  }, [lines]);

  if (lines.length === 0) {
    return (
      <AppShell
        activeSlug="pistachio-series"
        hideNavigation
        hideSearch
        title="Checkout"
        hideCartFab
        backHref={categoryToPath("all")}
        hideLocation
      >
        <main className="p-6">
          <div className="max-w-2xl mx-auto text-center bg-white/70 backdrop-blur rounded-3xl shadow-sm p-10">
            <p className="text-lg font-semibold text-gray-700">
              Keranjangmu masih kosong.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Jelajahi menu dan temukan minuman favoritmu.
            </p>
            <Link
              href={categoryToPath("all")}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-color)] text-white px-6 py-3 text-sm font-semibold mt-6"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Kembali ke Menu
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeSlug="pistachio-series"
      hideNavigation
      hideSearch
      title="Checkout"
      hideCartFab
      backHref={categoryToPath("all")}
      hideLocation
    >
      <div className="grid gap-6 p-4 pb-32 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <article className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Detail Pesanan
            </p>

            <div className="space-y-6">
              {lines.map((line) => (
                <div
                  key={`${line.productId}-${line.cartIndex}`}
                  className="rounded-2xl border border-white/70 bg-white/60 p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl shadow-inner">
                        <Image
                          src={line.product.image}
                          alt={line.product.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-gray-800">
                          {line.product.name}
                        </h2>
                        <p className="text-xs text-gray-500">
                          {line.product.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="cart-quantity-button h-8 w-8 rounded-full border flex items-center justify-center"
                          onClick={() => {
                            if (line.quantity - 1 <= 0) {
                              setPendingRemove(line.cartIndex);
                              return;
                            }
                            updateQuantity(line.cartIndex, line.quantity - 1);
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="text-sm font-semibold text-gray-700">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="cart-quantity-button h-8 w-8 rounded-full border flex items-center justify-center"
                          onClick={() => updateQuantity(line.cartIndex, line.quantity + 1)}
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Subtotal</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {line.lineTotalLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 text-xs text-gray-600">
                    {line.options.map((option) => (
                      <div key={option.group + option.label} className="flex justify-between">
                        <span className="font-medium text-gray-500">
                          {option.group}
                        </span>
                        <span>
                          {option.label}
                          {option.priceDelta
                            ? ` (${formatCurrency(option.priceDelta)})`
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    <Link
                      href={`/products/${line.productId}?redirect=${encodeURIComponent(
                        "/cart"
                      )}&updateIndex=${line.cartIndex}&qty=${line.quantity}&selected=${encodeURIComponent(
                        JSON.stringify(line.options)
                      )}`}
                      className="cart-back-link text-emerald-600 hover:text-emerald-700"
                    >
                      Ubah
                    </Link>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      className="cart-remove-button inline-flex items-center gap-1 text-red-400 hover:text-red-600"
                      onClick={() => setPendingRemove(line.cartIndex)}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {recommendations.length > 0 ? (
            <section className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                    Menu Special Hari Ini
                  </p>
                  <p className="text-base font-semibold text-gray-800 mt-1">
                    Rekomendasi tambahan khusus untukmu
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-animate-grid>
                {recommendations.map(({ product }, index) => (
                  <ProductCard
                    key={`recommend-${product.id}`}
                    product={product}
                    index={index}
                    redirectTo="/cart"
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Ada tambahan lainnya?
              </p>
              <p className="text-xs text-gray-500">
                Kamu bisa tambahin juga loh
              </p>
            </div>
            <Link
              href={categoryToPath("all")}
              className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-2 text-xs font-semibold hover:bg-emerald-100"
            >
              Tambah
              <span className="material-symbols-outlined text-sm">add</span>
            </Link>
          </section>

          <section className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Voucher Diskon</p>
              <button
                type="button"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Gunakan
              </button>
            </div>
            <input
              type="text"
              placeholder="Masukkan kode voucher"
              className="w-full rounded-full border border-white/60 bg-white/70 px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
          </section>

          <section className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Metode Pembayaran</p>
            <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-600">qr_code_2</span>
                QRIS
              </span>
              <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
            </div>
          </section>
        </section>

        <aside className="rounded-3xl bg-white/85 backdrop-blur shadow-lg border border-white/60 p-6 space-y-6 h-fit">
          <div>
            <p className="text-sm font-semibold text-gray-700">Ringkasan Pesanan</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{summary.subtotalLabel}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Pajak (10%)</span>
                <span>{summary.taxLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/60">
            <span className="text-base font-semibold text-gray-700">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {summary.totalLabel}
            </span>
          </div>

          <button
            type="button"
            className="cart-checkout-button w-full px-5 py-3 text-sm font-semibold text-white transition"
            onClick={() => router.push("/payment/qris")}
          >
            Pesan Sekarang
          </button>
        </aside>
      </div>

      {pendingRemove !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 p-6 shadow-xl space-y-4">
            <p className="text-sm font-semibold text-gray-800">
              Hapus pesanan ini dari keranjang?
            </p>
            <p className="text-xs text-gray-500">
              Kamu masih bisa menambahkannya kembali kapan saja di halaman menu.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                onClick={() => setPendingRemove(null)}
              >
                Batalkan
              </button>
              <button
                type="button"
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-600"
                onClick={() => {
                  removeItem(pendingRemove);
                  setPendingRemove(null);
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
