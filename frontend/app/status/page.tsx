"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { useOrders } from "@/lib/orderStore";

export default function OrderStatusPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get("orderId") ?? null;
  const { orders } = useOrders();

  const order = useMemo(() => {
    if (!orderId) {
      return null;
    }
    return orders.find((entry) => entry.id === orderId) ?? null;
  }, [orders, orderId]);

  if (!orderId || !order) {
    return (
      <AppShell
        activeSlug="pistachio-series"
        hideNavigation
        hideSearch
        hideCartFab
        hideLocation
        backHref="/menu"
        title="Status Pesanan"
      >
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md rounded-3xl bg-white/80 backdrop-blur shadow-lg border border-emerald-50/80 p-8 text-center space-y-4">
            <span className="material-symbols-outlined text-emerald-500 text-4xl">receipt_long</span>
            <p className="text-lg font-semibold text-gray-700">Pesanan tidak ditemukan</p>
            <p className="text-sm text-gray-500">
              Pastikan kamu mengakses tautan status dari halaman pembayaran setelah konfirmasi.
            </p>
            <Link
              href="/menu"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Kembali ke Menu
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeSlug="pistachio-series"
      hideNavigation
      hideSearch
      hideCartFab
      hideLocation
      backHref="/menu"
      title="Status Pesanan"
    >
      <div className="max-w-3xl mx-auto p-6 pb-24 space-y-6">
        <section className="rounded-3xl bg-white/85 backdrop-blur shadow-lg border border-emerald-50/80 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Order ID</p>
              <p className="text-lg font-semibold text-gray-700">{order.id}</p>
              <p className="text-xs text-gray-500">
                {new Date(order.createdAt).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Meja</p>
              <p className="text-sm font-semibold text-emerald-600">{order.tableId ?? "Take Away"}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                  order.status === "served"
                    ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                    : "bg-amber-100 text-amber-600 border border-amber-200"
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {order.status === "served" ? "check_circle" : "hourglass_top"}
                </span>
                {order.status === "served" ? "Sedang Diantar" : "Menunggu Diproses"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Ringkasan</p>
            <div className="space-y-2 text-sm text-gray-600">
              {order.items.map((item) => (
                <div key={`${order.id}-${item.name}`} className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-700">
                      {item.name} <span className="text-xs text-gray-500">x{item.quantity}</span>
                    </p>
                    {item.options.length > 0 ? (
                      <ul className="text-xs text-gray-500 list-disc ml-4">
                        {item.options.map((opt, index) => (
                          <li key={index}>{opt}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <span className="font-semibold text-gray-700">{item.linePriceLabel}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500">
            <div className="space-y-1">
              <div className="flex gap-4">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-700">{order.subtotalLabel}</span>
              </div>
              <div className="flex gap-4">
                <span>Pajak (10%)</span>
                <span className="font-semibold text-gray-700">{order.taxLabel}</span>
              </div>
              <div className="flex gap-4 text-emerald-600 font-semibold text-base">
                <span>Total</span>
                <span>{order.totalLabel}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-xs text-gray-500">
              <p className="font-semibold text-gray-700">Apa selanjutnya?</p>
              <p>Barista kami sedang menyiapkan pesananmu. Silakan tunggu di meja {order.tableId ?? "pickup"}.</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white/70 backdrop-blur border border-emerald-50/80 p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Ingin memesan lagi?</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={order.tableId ? `/menu?table=${order.tableId}` : "/menu"}
              className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-white shadow hover:bg-emerald-600 transition"
            >
              Buka Menu
            </Link>
            <Link
              href="/"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 font-semibold text-emerald-600 hover:bg-emerald-100 transition"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
