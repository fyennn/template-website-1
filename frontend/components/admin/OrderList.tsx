"use client";

import { useState, useMemo } from "react";
import { useOrders, type OrderEntry } from "@/lib/orderStore";
import { SampleDataButton } from "./SampleDataButton";

type OrderStatus = "all" | "pending" | "preparing" | "ready" | "served" | "cancelled";

const statusConfig = {
  pending: { label: "Pesanan Masuk", color: "bg-yellow-100 text-yellow-800", icon: "receipt" },
  preparing: { label: "Sedang Dibuat", color: "bg-blue-100 text-blue-800", icon: "cooking" },
  ready: { label: "Siap Diambil", color: "bg-green-100 text-green-800", icon: "check_circle" },
  served: { label: "Sudah Diantar", color: "bg-emerald-100 text-emerald-800", icon: "delivery_dining" },
  cancelled: { label: "Dibatalkan", color: "bg-red-100 text-red-800", icon: "cancel" }
};

export function OrderList() {
  const { orders, updateOrderStatus, clearOrders } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter(order => order.status === selectedStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(term) ||
        order.tableId?.toLowerCase().includes(term) ||
        order.customerInfo?.name?.toLowerCase().includes(term) ||
        order.customerInfo?.phone?.includes(term) ||
        order.items.some(item => item.name.toLowerCase().includes(term))
      );
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, selectedStatus, searchTerm]);

  const orderStats = useMemo(() => {
    const stats = {
      total: orders.length,
      pending: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    orders.forEach(order => {
      stats[order.status as keyof typeof stats]++;
      if (order.status === "served") {
        stats.totalRevenue += order.total;
      }
    });

    return stats;
  }, [orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Baru saja";
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} jam lalu`;
    return `${Math.floor(diffMinutes / 1440)} hari lalu`;
  };

  return (
    <div className="space-y-8">
      {/* Responsive Header & Stats */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 p-4 sm:p-6 lg:p-8">
        {/* Mobile Header */}
        <div className="block lg:hidden mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-lg">analytics</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Dashboard Pesanan
              </h1>
              <p className="text-sm text-gray-600 truncate">Monitoring real-time</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <SampleDataButton />
            <button
              onClick={clearOrders}
              className="group flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              Hapus Riwayat
            </button>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-white text-2xl">analytics</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                Dashboard Pesanan
              </h1>
              <p className="text-gray-600 mt-1">Monitoring real-time untuk semua aktivitas pesanan</p>
            </div>
          </div>
          <div className="flex gap-3">
            <SampleDataButton />
            <button
              onClick={clearOrders}
              className="group flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 hover:border-red-300 transition-all duration-200 hover:scale-105"
            >
              <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">
                delete_sweep
              </span>
              Hapus Riwayat
            </button>
          </div>
        </div>

        {/* Responsive Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="group bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <span className="material-symbols-outlined text-gray-500 text-lg sm:text-xl lg:text-2xl group-hover:scale-110 transition-transform">
                receipt_long
              </span>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-gray-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Pesanan</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{orderStats.total}</p>
          </div>

          <div className="group bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-yellow-200 hover:border-yellow-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <span className="material-symbols-outlined text-yellow-600 text-lg sm:text-xl lg:text-2xl group-hover:scale-110 transition-transform">
                schedule
              </span>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-yellow-700 mb-1">Pesanan Masuk</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-800">{orderStats.pending}</p>
          </div>

          <div className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <span className="material-symbols-outlined text-blue-600 text-lg sm:text-xl lg:text-2xl group-hover:scale-110 transition-transform">
                cooking
              </span>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-blue-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Sedang Dibuat</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-800">{orderStats.preparing}</p>
          </div>

          <div className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-green-200 hover:border-green-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <span className="material-symbols-outlined text-green-600 text-lg sm:text-xl lg:text-2xl group-hover:scale-110 transition-transform">
                check_circle
              </span>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-green-700 mb-1">Siap Diambil</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800">{orderStats.ready}</p>
          </div>

          <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <span className="material-symbols-outlined text-emerald-600 text-lg sm:text-xl lg:text-2xl group-hover:scale-110 transition-transform">
                delivery_dining
              </span>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-emerald-700 mb-1">Sudah Diantar</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-800">{orderStats.served}</p>
          </div>

          <div className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 border border-purple-200 hover:border-purple-300 transition-all duration-300 hover:scale-105 hover:shadow-lg">
            <div className="flex items-center justify-between mb-2 lg:mb-3">
              <span className="material-symbols-outlined text-purple-600 text-lg sm:text-xl lg:text-2xl group-hover:scale-110 transition-transform">
                payments
              </span>
              <div className="w-2 h-2 lg:w-3 lg:h-3 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs sm:text-sm font-medium text-purple-700 mb-1">Pendapatan</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-800">{formatCurrency(orderStats.totalRevenue)}</p>
          </div>
        </div>

        {/* Responsive Search & Filter */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:gap-6">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-lg sm:text-xl">search</span>
            </div>
            <input
              type="text"
              placeholder="Cari pesanan, meja, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-10 sm:pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 placeholder-gray-400 text-sm sm:text-base"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl">close</span>
              </button>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-lg sm:text-xl">filter_list</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
              className="appearance-none w-full sm:min-w-[200px] pl-10 sm:pl-12 pr-10 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm sm:text-base"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pesanan Masuk</option>
              <option value="preparing">Sedang Dibuat</option>
              <option value="ready">Siap Diambil</option>
              <option value="served">Sudah Diantar</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-lg sm:text-xl">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl lg:rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 lg:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <span className="material-symbols-outlined text-gray-400 text-2xl sm:text-3xl lg:text-4xl">
                {searchTerm || selectedStatus !== "all" ? "search_off" : "receipt_long"}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">
              {searchTerm || selectedStatus !== "all" 
                ? "Tidak Ada Hasil Pencarian"
                : "Belum Ada Pesanan"
              }
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 max-w-md mx-auto">
              {searchTerm || selectedStatus !== "all" 
                ? `Tidak ada pesanan yang sesuai dengan "${searchTerm || selectedStatus}". Coba ubah filter atau kata kunci pencarian.`
                : "Belum ada pesanan yang masuk. Pesanan baru akan muncul di sini secara real-time."
              }
            </p>
            {(searchTerm || selectedStatus !== "all") ? (
              <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3">
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Hapus Pencarian
                </button>
                <button
                  onClick={() => setSelectedStatus("all")}
                  className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                >
                  Tampilkan Semua
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <SampleDataButton />
              </div>
            )}
          </div>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} onStatusUpdate={updateOrderStatus} />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard({ 
  order, 
  onStatusUpdate 
}: { 
  order: OrderEntry; 
  onStatusUpdate: (id: string, status: OrderEntry["status"]) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusInfo = statusConfig[order.status];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Baru saja";
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} jam lalu`;
    return `${Math.floor(diffMinutes / 1440)} hari lalu`;
  };

  return (
    <div className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 hover:border-emerald-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
      {/* Modern Header dengan gradient dan glassmorphism */}
      <div className="relative bg-gradient-to-br from-emerald-50 via-white to-blue-50 border-b border-emerald-100/50 p-6">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5"></div>
        
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Customer Avatar */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-white text-xl">person</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {order.customerInfo?.name || "Guest Customer"}
                </h3>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  #{order.id.slice(-6)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">call</span>
                  <span>{order.customerInfo?.phone || "Tidak ada nomor"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">table_restaurant</span>
                  <span>Meja {order.tableId || "Take Away"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge & Total */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm ${statusInfo.color}`}>
                <span className="material-symbols-outlined text-sm animate-pulse">{statusInfo.icon}</span>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              {order.totalLabel}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} item • {order.items.length} produk
            </p>
          </div>
        </div>

        {/* Quick Product Overview dengan design yang lebih menarik */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {order.items.map((item, index) => (
            <div key={index} className="group/item flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-gray-200/50 hover:border-emerald-300 whitespace-nowrap transition-all duration-200 hover:scale-105 hover:shadow-md">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover/item:scale-110 transition-transform">
                <span className="text-white font-bold text-xs">{item.quantity}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                <p className="text-xs font-medium text-emerald-600">{item.linePriceLabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content dengan layout yang lebih modern */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 space-y-4">
            {/* Timeline dengan design yang lebih menarik */}
            <div className="relative p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <span className="material-symbols-outlined text-white text-lg">schedule</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      Dipesan {getTimeSince(order.createdAt)}
                    </p>
                    <p className="text-xs text-blue-600">
                      {formatTime(order.createdAt)}
                    </p>
                  </div>
                </div>
                {order.estimatedTime && (
                  <div className="text-right bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-blue-600">Est. Waktu</p>
                    <p className="text-sm font-bold text-blue-900">{order.estimatedTime} menit</p>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info dengan design yang eye-catching */}
            {(order.customerInfo?.email || order.customerInfo?.notes || order.notes) && (
              <div className="relative p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200/50 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-sm">info</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold text-amber-900">Informasi Tambahan</p>
                    <div className="space-y-1 text-sm">
                      {order.customerInfo?.email && (
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-600 text-sm">mail</span>
                          <span className="font-medium text-amber-900">{order.customerInfo.email}</span>
                        </div>
                      )}
                      {order.customerInfo?.notes && (
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-amber-600 text-sm">note</span>
                          <span className="font-medium text-amber-900">{order.customerInfo.notes}</span>
                        </div>
                      )}
                      {order.notes && (
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-amber-600 text-sm">sticky_note_2</span>
                          <span className="font-medium text-amber-900">{order.notes}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-600 text-sm">payment</span>
                        <span className="font-medium text-amber-900 capitalize">{order.paymentMethod || "QRIS"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons dengan design yang sangat menarik */}
          <div className="flex flex-col gap-3 ml-6">
            {/* Detail Toggle Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium rounded-xl border border-gray-300 hover:border-gray-400 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-lg group-hover:rotate-180 transition-transform duration-300">
                {isExpanded ? "expand_less" : "expand_more"}
              </span>
              <span className="text-sm">{isExpanded ? "Tutup" : "Detail"}</span>
            </button>

            {/* Status Action Buttons */}
            <div className="flex flex-col gap-2">
              {order.status === "pending" && (
                <button
                  onClick={() => onStatusUpdate(order.id, "preparing")}
                  className="group flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 transform"
                >
                  <span className="material-symbols-outlined text-lg group-hover:rotate-12 transition-transform">
                    cooking
                  </span>
                  <span className="text-sm">Mulai Buat</span>
                </button>
              )}
              
              {order.status === "preparing" && (
                <button
                  onClick={() => onStatusUpdate(order.id, "ready")}
                  className="group flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 transform"
                >
                  <span className="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">
                    check_circle
                  </span>
                  <span className="text-sm">Selesai Dibuat</span>
                </button>
              )}
              
              {order.status === "ready" && (
                <button
                  onClick={() => onStatusUpdate(order.id, "served")}
                  className="group flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 transform"
                >
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    delivery_dining
                  </span>
                  <span className="text-sm">Sudah Diantar</span>
                </button>
              )}
              
              {(order.status === "pending" || order.status === "preparing") && (
                <button
                  onClick={() => onStatusUpdate(order.id, "cancelled")}
                  className="group flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 transform"
                >
                  <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">
                    cancel
                  </span>
                  <span className="text-sm">Batalkan</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Detail dengan animasi dan design menarik */}
        {isExpanded && (
          <div className="border-t border-gray-200 pt-6 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-sm">receipt_long</span>
              </div>
              <h4 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Detail Pesanan Lengkap
              </h4>
            </div>
            
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="group relative p-5 bg-gradient-to-r from-white to-gray-50 border border-gray-200 hover:border-emerald-300 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  {/* Item Number Badge */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-xs">{index + 1}</span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="text-lg font-bold text-gray-900">{item.name}</h5>
                        {item.category && (
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs font-semibold rounded-full border border-blue-300">
                            {item.category}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-sm">counter_1</span>
                          <span className="text-gray-600">Qty: <strong className="text-gray-900">{item.quantity}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-emerald-600 text-sm">payments</span>
                          <span className="text-gray-600">@ <strong className="text-gray-900">{item.unitPriceLabel || formatCurrency(item.unitPrice || 0)}</strong></span>
                        </div>
                      </div>
                      
                      {item.options.length > 0 && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                          <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">tune</span>
                            Opsi Tambahan:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {item.options.map((option, optIndex) => (
                              <span key={optIndex} className="px-2 py-1 bg-white/80 text-amber-700 text-xs font-medium rounded-lg border border-amber-300">
                                {option}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-6">
                      <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                        {item.linePriceLabel}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Total Item</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary dengan design yang eye-catching */}
            <div className="mt-6 p-5 bg-gradient-to-br from-emerald-50 via-white to-blue-50 rounded-2xl border border-emerald-200 shadow-lg">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">calculate</span>
                    Subtotal
                  </span>
                  <span className="font-semibold text-gray-900">{order.subtotalLabel}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">percent</span>
                    Pajak (10%)
                  </span>
                  <span className="font-semibold text-gray-900">{order.taxLabel}</span>
                </div>
                <div className="h-px bg-gradient-to-r from-emerald-200 to-blue-200"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="material-symbols-outlined">payments</span>
                    Total Pembayaran
                  </span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                    {order.totalLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}