import { OrderList } from "@/components/admin/OrderList";

import Link from "next/link";

export default function AdminOrdersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Responsive Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Mobile Layout */}
          <div className="block lg:hidden">
            <div className="flex items-center justify-between mb-4">
              <Link
                href="/admin"
                className="group flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
              >
                <span className="material-symbols-outlined text-xl">arrow_back</span>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
              
              <div className="flex items-center gap-2">
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
                  Kelola dan pantau semua pesanan
                </p>
              </div>
            </div>
            
            <Link
              href="/menu"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">restaurant_menu</span>
              Lihat Menu Customer
            </Link>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex items-center gap-6">
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
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white text-xl">receipt_long</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    Manajemen Pesanan
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Kelola dan pantau semua pesanan yang masuk secara real-time
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                href="/menu"
                className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 hover:border-emerald-300 transition-all duration-200 hover:scale-105"
              >
                <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">
                  restaurant_menu
                </span>
                Lihat Menu Customer
              </Link>
              
              <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-700">Live Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <OrderList />
      </div>
    </div>
  );
}