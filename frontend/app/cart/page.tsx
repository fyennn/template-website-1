"use client";

import Link from "next/link";
import Image from "next/image";
import { AppShell } from "@/components/AppShell";
import { formatCurrency } from "@/lib/products";
import { useCart } from "@/lib/cartStore";

export default function CartPage() {
  const { lines, summary, updateQuantity, removeItem } = useCart();

  if (lines.length === 0) {
    return (
      <AppShell activeSlug="pistachio-series">
        <main className="p-6">
          <div className="max-w-2xl mx-auto text-center bg-white/70 backdrop-blur rounded-3xl shadow-sm p-10">
            <p className="text-lg font-semibold text-gray-700">
              Keranjangmu masih kosong.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Jelajahi menu dan temukan minuman favoritmu.
            </p>
            <Link
              href="/"
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
    <AppShell activeSlug="pistachio-series">
      <div className="grid gap-6 p-4 pb-32 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          {lines.map((line) => (
            <article
              key={`${line.productId}-${line.cartIndex}`}
              className="rounded-3xl bg-white/80 backdrop-blur shadow-sm px-4 py-4 sm:px-6 flex gap-4"
            >
              <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl shadow-inner">
                <Image
                  src={line.product.image}
                  alt={line.product.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-800">
                      {line.product.name}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {line.product.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cart-remove-button text-xs text-red-400 hover:text-red-600"
                    onClick={() => removeItem(line.cartIndex)}
                  >
                    Hapus
                  </button>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-gray-600">
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

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="cart-quantity-button h-8 w-8 rounded-full border border-amber-300 text-amber-600 flex items-center justify-center"
                      onClick={() => updateQuantity(line.cartIndex, line.quantity - 1)}
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="text-sm font-semibold text-gray-700">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      className="cart-quantity-button h-8 w-8 rounded-full border border-amber-300 text-amber-600 flex items-center justify-center"
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
            </article>
          ))}
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
            className="cart-checkout-button w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:from-amber-600 hover:to-amber-500 transition"
          >
            Lanjut ke Pembayaran
          </button>
          <Link
            href="/"
            className="cart-back-link flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-700"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Kembali belanja
          </Link>
        </aside>
      </div>
    </AppShell>
  );
}
