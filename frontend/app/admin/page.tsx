"use client";

import Link from "next/link";
import { useState } from "react";

type AdminNavKey = "dashboard" | "products" | "orders" | "settings";

const NAV_ITEMS: Array<{ key: AdminNavKey; label: string; icon: string }> = [
  { key: "dashboard", label: "Ringkasan", icon: "space_dashboard" },
  { key: "products", label: "Produk", icon: "coffee" },
  { key: "orders", label: "Pesanan", icon: "receipt_long" },
  { key: "settings", label: "Pengaturan", icon: "settings" },
];

export default function AdminPage() {
  const [activeKey, setActiveKey] = useState<AdminNavKey>("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#eef6f3]">
      <header className="border-b border-emerald-50/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500 text-2xl">shield_person</span>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Admin Panel</p>
              <h1 className="text-lg font-semibold text-gray-700">SPM Café Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="material-symbols-outlined text-base text-emerald-500">notifications</span>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center text-sm font-semibold">
                AD
              </div>
              <div className="leading-tight">
                <p className="font-semibold text-gray-700">Admin</p>
                <p className="text-xs">admin@spmcafe.id</p>
              </div>
            </div>
            <Link
              href="/"
              className="rounded-full border border-emerald-200 bg-white/50 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition"
            >
              Lihat Menu
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl bg-white/80 backdrop-blur shadow border border-emerald-50/70 p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveKey(item.key)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg"
                    : "text-gray-500 hover:bg-emerald-50"
                }`}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </aside>

        <main className="rounded-3xl bg-white/85 backdrop-blur shadow border border-emerald-50/70 p-6 space-y-6">
          {activeKey === "dashboard" ? (
            <section className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Ringkasan</p>
                <h2 className="text-xl font-semibold text-gray-700">Statistik Hari Ini</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Data dummy sementara, nanti diganti dengan integrasi backend.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  { label: "Pesanan Masuk", value: "24", icon: "receipt_long" },
                  { label: "Pendapatan", value: "Rp 3.450.000", icon: "payments" },
                  { label: "Produk Aktif", value: "38", icon: "local_cafe" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{stat.label}</span>
                      <span className="material-symbols-outlined text-emerald-500">{stat.icon}</span>
                    </div>
                    <p className="mt-3 text-xl font-semibold text-gray-800">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {activeKey === "products" ? (
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                    Manajemen Produk
                  </p>
                  <h2 className="text-xl font-semibold text-gray-700">Daftar Produk</h2>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-600 transition"
                >
                  Tambah Produk
                </button>
              </div>
              <div className="rounded-2xl border border-emerald-50/80 overflow-hidden">
                <table className="min-w-full divide-y divide-emerald-100 text-sm">
                  <thead className="bg-emerald-50/40 text-left text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Produk</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3 text-right">Harga</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50 bg-white/60">
                    {[
                      {
                        name: "Pistachio Latte",
                        category: "Pistachio Series",
                        price: "Rp 55.000",
                      },
                      {
                        name: "Matcha Frappe",
                        category: "Matcha Club",
                        price: "Rp 52.500",
                      },
                      {
                        name: "Ethiopia Yirgacheffe",
                        category: "Master S.O.E Series",
                        price: "Rp 150.000",
                      },
                    ].map((row) => (
                      <tr key={row.name} className="text-gray-600">
                        <td className="px-4 py-3 font-medium text-gray-700">{row.name}</td>
                        <td className="px-4 py-3">{row.category}</td>
                        <td className="px-4 py-3 text-right">{row.price}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeKey === "orders" ? (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-700">Pesanan</h2>
              <p className="text-sm text-gray-500">
                Modul ini akan menampilkan daftar pesanan pelanggan setelah integrasi backend.
              </p>
            </section>
          ) : null}

          {activeKey === "settings" ? (
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-700">Pengaturan</h2>
              <p className="text-sm text-gray-500">
                Halaman pengaturan untuk mengelola informasi toko, jadwal, dan akun admin.
              </p>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
