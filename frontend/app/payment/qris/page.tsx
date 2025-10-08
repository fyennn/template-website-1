"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { useCart } from "@/lib/cartStore";
import { useOrders } from "@/lib/orderStore";
import { categoryToPath } from "@/lib/navigation";
import { formatCurrency } from "@/lib/products";

const QR_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="24" fill="#0f766e"/>
  <rect width="180" height="180" x="10" y="10" rx="20" fill="#ecfdf5"/>
  <path d="M30 30h40v40H30zM130 30h40v40h-40zM30 130h40v40H30zM130 130h40v40h-40z" fill="#0f766e"/>
  <path d="M78 62h44v12H78zM62 78h76v12H62zM78 102h44v12H78zM62 118h76v12H62z" fill="#10b981" opacity="0.85"/>
  <rect x="88" y="134" width="24" height="24" rx="6" fill="#0f766e"/>
</svg>`);

function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return { remaining, label: `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}` };
}

export default function QrisPaymentPage() {
  const router = useRouter();
  const { lines, summary, tableId, clear: clearCart } = useCart();
  const { addOrder } = useOrders();
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const { label: countdownLabel } = useCountdown(15 * 60);

  const qrReference = useMemo(() => {
    const total = summary.totalLabel.replace(/\D/g, "");
    return `SPM-${total.slice(-6).padStart(6, "0")}`;
  }, [summary.totalLabel]);

  const handleDownloadQr = useCallback(() => {
    const link = document.createElement("a");
    link.href = QR_PLACEHOLDER;
    link.download = `${qrReference}-qris.png`;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [qrReference]);

  if (lines.length === 0) {
    return (
      <AppShell
        activeSlug="pistachio-series"
        hideNavigation
        hideSearch
        hideCartFab
        hideLocation
        backHref={categoryToPath("all")}
        title="Pembayaran"
      >
        <div className="p-6 pb-24 flex flex-col items-center justify-center text-center space-y-6">
          <div className="p-10 rounded-3xl bg-white/80 backdrop-blur shadow-lg max-w-lg space-y-4">
            <span className="material-symbols-outlined text-emerald-500 text-4xl">qr_code_2</span>
            <p className="text-lg font-semibold text-gray-700">Keranjang masih kosong</p>
            <p className="text-sm text-gray-500">
              Tambahkan produk terlebih dahulu sebelum melakukan pembayaran.
            </p>
            <Link
              href={categoryToPath("all")}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-600"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Kembali ke Menu
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const handleConfirmPayment = async () => {
    if (status === "success") {
      return;
    }
    try {
      setError(null);
      const orderId = `ORD-${Date.now()}`;
      const createdAt = new Date().toISOString();
      const orderItems = lines.map((line) => ({
        name: line.product.name,
        quantity: line.quantity,
        linePriceLabel: line.lineTotalLabel,
        options: line.options.map((option) => {
          if (option.priceDelta) {
            const formatted = formatCurrency(option.priceDelta).replace("Rp", "Rp");
            return `${option.label} (${option.priceDelta > 0 ? "+" : ""}${formatted.trim()})`;
          }
          return option.label;
        }),
      }));

      const order = {
        id: orderId,
        createdAt,
        tableId: tableId ?? null,
        subtotalLabel: summary.subtotalLabel,
        taxLabel: summary.taxLabel,
        totalLabel: summary.totalLabel,
        status: "pending",
        items: orderItems,
      };
      addOrder(order);

      clearCart();
      setStatus("success");
      router.push(`/status?orderId=${order.id}`);
    } catch (err) {
      console.error("Failed to confirm payment", err);
      setError("Terjadi kesalahan saat menyimpan pesanan.");
    }
  };

  return (
    <AppShell
      activeSlug="pistachio-series"
      hideNavigation
      hideSearch
      hideCartFab
      hideLocation
      backHref="/cart"
      title="Pembayaran QRIS"
    >
      <div className="grid gap-6 p-4 pb-28 lg:grid-cols-[420px_1fr] max-w-5xl mx-auto w-full">
        <section className="rounded-3xl bg-white/85 backdrop-blur shadow-lg border border-white/60 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Metode</p>
              <h1 className="text-xl font-semibold text-gray-800">QRIS</h1>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Batas Pembayaran</p>
              <p className="font-semibold text-emerald-600">{countdownLabel}</p>
            </div>
          </div>

          <div className="relative mx-auto grid place-items-center rounded-[32px] bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 p-6 shadow-inner space-y-4">
            <div className="absolute -top-4 right-6 rounded-full bg-white shadow px-4 py-1 text-xs font-semibold text-emerald-600">
              Ref {qrReference}
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-lg">
              <Image
                src={QR_PLACEHOLDER}
                alt="Kode QR untuk pembayaran QRIS"
                width={240}
                height={240}
                className="h-60 w-60 object-contain"
              />
            </div>
            <p className="text-sm text-gray-500">Scan QR menggunakan aplikasi pembayaran favoritmu.</p>
            <button
              type="button"
              onClick={handleDownloadQr}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-4 py-2 text-xs font-semibold text-emerald-600 shadow hover:bg-emerald-50 transition"
            >
              <span className="material-symbols-outlined text-base">download</span>
              Download QR
            </button>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/70 p-5 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Total Pembayaran</span>
              <span className="text-lg font-semibold text-gray-900">{summary.totalLabel}</span>
            </div>
            <div className="grid gap-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{summary.subtotalLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak (10%)</span>
                <span>{summary.taxLabel}</span>
              </div>
              <div className="flex justify-between">
                <span>Meja</span>
                <span>{tableId ?? "Take Away"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs text-gray-500">
            <p className="font-semibold text-gray-600 uppercase tracking-[0.25em]">Langkah Pembayaran</p>
            <ol className="space-y-2">
              <li>1. Unduh kode QR, lalu buka aplikasi pembayaran (Dana, OVO, GoPay, dll).</li>
              <li>2. Pilih menu <strong>Scan QRIS</strong>, kemudian unggah atau pindai kode yang telah disimpan.</li>
              <li>3. Pastikan nominal yang tampil sudah sesuai, lalu lakukan konfirmasi pembayaran.</li>
              <li>4. Simpan bukti transaksimu, kami akan memverifikasi secara otomatis.</li>
            </ol>
          </div>
        </section>

        <aside className="rounded-3xl bg-white/85 backdrop-blur shadow-lg border border-white/60 p-6 space-y-6 h-fit">
          <div>
            <p className="text-sm font-semibold text-gray-700">Rincian Pesanan</p>
            <div className="mt-4 space-y-4 max-h-[340px] overflow-y-auto pr-2">
              {lines.map((line) => (
                <div key={`${line.productId}-${line.cartIndex}`} className="flex gap-3">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl shadow-inner">
                    <Image
                      src={line.product.image}
                      alt={line.product.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-semibold text-gray-800">{line.product.name}</p>
                      <span className="text-xs font-medium text-gray-500">x{line.quantity}</span>
                    </div>
                    <p className="text-xs text-gray-500">{line.product.description}</p>
                    <p className="text-xs font-semibold text-emerald-600">{line.lineTotalLabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.3em]">
              Setelah Pembayaran
            </p>
            <p className="text-sm text-gray-600">
              Tunjukkan bukti pembayaran kepada barista kami atau tunggu notifikasi otomatis di aplikasi ini.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleConfirmPayment}
              disabled={status === "success"}
            >
              {status === "success" ? "Mengalihkan..." : "Konfirmasi Pembayaran"}
            </button>
            <Link
              href="/cart"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-600 text-center hover:bg-emerald-100 transition"
            >
              Kembali ke Keranjang
            </Link>
          </div>

          {error ? (
            <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-2">
              {error}
            </p>
          ) : null}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/90 p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-emerald-500">support_agent</span>
            <div className="text-xs text-gray-600">
              <p className="font-semibold text-gray-700">Butuh bantuan?</p>
              <p>Hubungi kami melalui WhatsApp <strong>0812-3456-7890</strong>.</p>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
