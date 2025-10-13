"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CustomerInfoForm } from "@/components/CustomerInfoForm";
import { useCart } from "@/lib/cartStore";
import type { CustomerInfo } from "@/lib/orderStore";

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, summary } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  if (lines.length === 0) {
    return (
      <AppShell
        activeSlug="pistachio-series"
        hideNavigation
        hideSearch
        hideCartFab
        hideLocation
        backHref="/menu"
        title="Checkout"
      >
        <div className="p-6 pb-24 flex flex-col items-center justify-center text-center space-y-6 min-h-[60vh]">
          <div className="p-10 rounded-3xl bg-white/80 backdrop-blur shadow-lg max-w-lg space-y-4">
            <span className="material-symbols-outlined text-emerald-500 text-4xl">shopping_cart</span>
            <p className="text-lg font-semibold text-gray-700">Keranjang masih kosong</p>
            <p className="text-sm text-gray-500">
              Tambahkan produk terlebih dahulu sebelum melakukan checkout.
            </p>
            <Link
              href="/menu"
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

  const handleCustomerInfoSubmit = (customerInfo: CustomerInfo) => {
    setIsLoading(true);
    // Simpan customer info ke localStorage untuk digunakan di halaman payment
    if (typeof window !== "undefined") {
      localStorage.setItem("spm-customer-info", JSON.stringify(customerInfo));
    }
    router.push("/payment/qris");
  };

  const handleSkip = () => {
    setIsLoading(true);
    // Hapus customer info dari localStorage jika user skip
    if (typeof window !== "undefined") {
      localStorage.removeItem("spm-customer-info");
    }
    router.push("/payment/qris");
  };

  return (
    <AppShell
      activeSlug="pistachio-series"
      hideNavigation
      hideSearch
      hideCartFab
      hideLocation
      backHref="/cart"
      title="Checkout"
    >
      <div className="max-w-2xl mx-auto p-6 pb-24 space-y-6">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-emerald-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Ringkasan Pesanan</h2>
          
          <div className="space-y-3">
            {lines.map((line) => (
              <div key={`${line.productId}-${line.cartIndex}`} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{line.product.name}</p>
                  <p className="text-sm text-gray-600">
                    {line.quantity} × {line.product.priceLabel}
                  </p>
                  {line.options.length > 0 && (
                    <ul className="text-xs text-gray-500 mt-1 list-disc ml-4">
                      {line.options.map((option, index) => (
                        <li key={index}>{option.label}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="font-semibold text-gray-900">{line.lineTotalLabel}</p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{summary.subtotalLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pajak (10%)</span>
              <span className="font-medium">{summary.taxLabel}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-emerald-600">{summary.totalLabel}</span>
            </div>
          </div>
        </div>

        {/* Customer Info Form */}
        <CustomerInfoForm
          onSubmit={handleCustomerInfoSubmit}
          onSkip={handleSkip}
          isLoading={isLoading}
        />
      </div>
    </AppShell>
  );
}