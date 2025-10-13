"use client";

import Link from "next/link";
import { useState } from "react";
import { useOrders } from "@/lib/orderStore";

export function OrderStatusBanner() {
    const { orders } = useOrders();
    const [isHidden, setIsHidden] = useState(false);

    // Ambil semua pesanan yang masih aktif (belum served/cancelled), urutkan berdasarkan waktu terbaru
    const activeOrders = orders
        .filter(order => !["served", "cancelled"].includes(order.status))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (activeOrders.length === 0 || isHidden) {
        return null;
    }

    const latestOrder = activeOrders[0];
    const hasMultipleOrders = activeOrders.length > 1;

    // Hitung waktu sejak pesanan dibuat
    const orderTime = new Date(latestOrder.createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));

    const timeText = diffMinutes < 1
        ? "Baru saja"
        : diffMinutes < 60
            ? `${diffMinutes} menit yang lalu`
            : `${Math.floor(diffMinutes / 60)} jam yang lalu`;

    // Status display mapping
    const statusDisplay = {
        pending: { text: "Pesanan Diterima", icon: "receipt", color: "text-yellow-600" },
        preparing: { text: "Pesananmu Sedang Dibuatkan", icon: "cooking", color: "text-blue-600" },
        ready: { text: "Pesanan Siap Diambil", icon: "check_circle", color: "text-green-600" }
    };

    const currentStatus = statusDisplay[latestOrder.status as keyof typeof statusDisplay] || statusDisplay.pending;

    return (
        <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-4 shadow-sm animate-pulse-subtle relative transform transition-all duration-300 ease-in-out">
            <button
                onClick={() => setIsHidden(true)}
                className="absolute top-2 right-2 text-emerald-400 hover:text-emerald-600 transition-colors"
                aria-label="Tutup banner"
            >
                <span className="material-symbols-outlined text-sm">close</span>
            </button>
            <div className="flex items-center justify-between gap-3 pr-6">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                        <div className="relative">
                            <span className={`material-symbols-outlined text-xl ${currentStatus.color} ${latestOrder.status === "preparing" ? "animate-spin-slow" : ""}`}>
                                {currentStatus.icon}
                            </span>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                            {hasMultipleOrders && (
                                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
                                    {activeOrders.length}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-emerald-800">
                            {hasMultipleOrders ? `${activeOrders.length} Pesanan Aktif` : currentStatus.text}
                        </p>
                        <p className="text-xs text-emerald-600">
                            Order #{latestOrder.id.slice(-8)} • Meja {latestOrder.tableId || "Take Away"}
                        </p>
                        <p className="text-xs text-emerald-500 mt-1">
                            {timeText} • {latestOrder.items.length} item • {latestOrder.totalLabel}
                        </p>
                    </div>
                </div>
                <Link
                    href={`/status?orderId=${latestOrder.id}`}
                    className="flex-shrink-0 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-600 transition-all duration-200 hover:scale-105"
                >
                    Lihat Status
                </Link>
            </div>

            {hasMultipleOrders && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-xs text-emerald-600 mb-2">Pesanan lainnya:</p>
                    <div className="flex flex-wrap gap-2">
                        {activeOrders.slice(1, 4).map((order) => {
                            const orderStatus = statusDisplay[order.status as keyof typeof statusDisplay] || statusDisplay.pending;
                            return (
                                <Link
                                    key={order.id}
                                    href={`/status?orderId=${order.id}`}
                                    className="inline-flex items-center gap-1 rounded-full bg-emerald-200 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-300 transition-colors"
                                >
                                    <span className={`material-symbols-outlined text-xs ${orderStatus.color}`}>
                                        {orderStatus.icon}
                                    </span>
                                    #{order.id.slice(-6)}
                                    <span className="text-emerald-500">•</span>
                                    {order.totalLabel}
                                </Link>
                            );
                        })}
                        {activeOrders.length > 4 && (
                            <span className="inline-flex items-center rounded-full bg-emerald-200 px-3 py-1 text-xs text-emerald-600">
                                +{activeOrders.length - 4} lainnya
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}