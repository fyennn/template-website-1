"use client";

import { OrderList } from "@/components/admin/OrderList";

import Link from "next/link";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";

const fallbackInitials = (name?: string | null) => {
  if (!name) return "KT";
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());
  return parts.join("") || "KT";
};

export default function AdminOrdersPage() {
  const { isAdmin, isReady, user, logout } = useRequireAdmin();
  const isKitchenAccount = user?.role === "Staff Kitchen";
  const initials = user?.avatarInitials || fallbackInitials(user?.name);

  if (!isReady || !isAdmin) {
    return null;
  }

  const profileChip = (
    <div className="inline-flex items-center gap-3 rounded-3xl border border-emerald-100 bg-white/90 px-5 py-3 shadow-sm">
      <Link
        href="/admin/profile"
        className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full"
      >
        <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-800">{user?.name ?? "Staff Kitchen"}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
      </Link>
      <div className="ml-2 flex items-center gap-2">
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
        >
          Keluar
        </button>
      </div>
    </div>
  );

  const liveUpdatesChip = (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      <span className="text-sm font-medium text-blue-700">Live Updates</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Responsive Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Mobile Layout */}
          <div className="block lg:hidden">
            <div className="flex items-center justify-between mb-4">
              {isKitchenAccount ? (
                <div className="flex-1 mr-2">{profileChip}</div>
              ) : (
                <Link
                  href="/admin"
                  className="group flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
              )}

              <div className="flex items-center gap-2 ml-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-blue-700">Live</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-lg">receipt_long</span>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Manajemen Pesanan
                </h1>
                <p className="text-sm text-gray-600 truncate">
                  {isKitchenAccount
                    ? "Pantau pesanan yang harus disiapkan"
                    : "Kelola dan pantau semua pesanan"}
                </p>
              </div>
            </div>

          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-6">
              {!isKitchenAccount && (
                <>
                  <Link
                    href="/admin"
                    className="group flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all duration-200"
                  >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                      arrow_back
                    </span>
                    <span className="text-sm font-medium">Kembali ke Dashboard</span>
                  </Link>
                  <div className="h-8 w-px bg-gradient-to-b from-emerald-200 to-blue-200"></div>
                </>
              )}

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white text-xl">receipt_long</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    Manajemen Pesanan
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {isKitchenAccount
                      ? "Pantau pesanan yang harus disiapkan secara real-time"
                      : "Kelola dan pantau semua pesanan yang masuk secara real-time"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isKitchenAccount ? profileChip : liveUpdatesChip}
            </div>
          </div>

          {isKitchenAccount ? <div className="hidden lg:block h-4" /> : null}
        </div>
      </div>

      {/* Responsive Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <OrderList liveUpdatesSlot={isKitchenAccount ? liveUpdatesChip : undefined} />
      </div>
    </div>
  );
}
