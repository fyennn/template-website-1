"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useAuth } from "@/lib/authStore";
import { useOrders } from "@/lib/orderStore";

type AdminNavKey = "dashboard" | "products" | "tables" | "orders" | "settings";

const NAV_ITEMS: Array<{ key: AdminNavKey; label: string; icon: string }> = [
  { key: "dashboard", label: "Ringkasan", icon: "space_dashboard" },
  { key: "products", label: "Produk", icon: "coffee" },
  { key: "tables", label: "Meja", icon: "table_restaurant" },
  { key: "orders", label: "Pesanan", icon: "receipt_long" },
  { key: "settings", label: "Pengaturan", icon: "settings" },
];

type TableEntry = {
  id: number;
  name: string;
  slug: string;
  url: string;
  qrDataUrl: string;
};

async function generateTableEntry(index: number, origin: string): Promise<TableEntry> {
  const padded = index.toString().padStart(2, "0");
  const slug = `meja-${padded}`;
  const safeOrigin = origin || "https://spm-cafe.local";
  const url = `${safeOrigin}/menu?table=${slug}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 320,
    margin: 1,
    color: {
      dark: "#0f766e",
      light: "#ffffff",
    },
  });
  return {
    id: index,
    name: `Meja ${padded}`,
    slug,
    url,
    qrDataUrl,
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, logout } = useAuth();
  const { orders, markServed, clearOrders } = useOrders();
  const [activeKey, setActiveKey] = useState<AdminNavKey>("dashboard");
  const [tables, setTables] = useState<TableEntry[]>([]);
  const [isGeneratingTable, setIsGeneratingTable] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/login");
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isMounted = true;

    const bootstrapTables = async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const defaults = await Promise.all(
          [1, 2, 3].map((index) => generateTableEntry(index, origin))
        );
        if (isMounted) {
          setTables((prev) => (prev.length > 0 ? prev : defaults));
        }
      } catch (error) {
        console.error("Failed to bootstrap tables", error);
      }
    };

    bootstrapTables();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const nextTableIndex = useMemo(() => tables.length + 1, [tables.length]);

  const handleAddTable = async () => {
    if (isGeneratingTable) {
      return;
    }
    try {
      setTableError(null);
      setIsGeneratingTable(true);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const entry = await generateTableEntry(nextTableIndex, origin);
      setTables((prev) => [...prev, entry]);
    } catch (error) {
      console.error("Failed to generate table QR", error);
      setTableError("Gagal membuat QR meja. Coba lagi.");
    } finally {
      setIsGeneratingTable(false);
    }
  };

  const handleCopyLink = async (slug: string, url: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      setTableError("Clipboard tidak tersedia di browser ini.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      window.setTimeout(() => setCopiedSlug((current) => (current === slug ? null : current)), 2000);
    } catch (error) {
      console.error("Failed to copy table link", error);
      setTableError("Tidak dapat menyalin tautan. Coba secara manual.");
    }
  };

  if (!isAdmin) {
    return null;
  }

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
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-emerald-200 bg-white/50 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition"
              >
                Lihat Menu
              </Link>
              <button
                type="button"
                className="rounded-full border border-emerald-200 bg-white/50 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
                onClick={logout}
              >
                Keluar
              </button>
            </div>
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

          {activeKey === "tables" ? (
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                    Pengelolaan Meja
                  </p>
                  <h2 className="text-xl font-semibold text-gray-700">QR Pemesanan Meja</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Tempel QR di meja agar pelanggan bisa memesan langsung dari perangkat mereka.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTable}
                  disabled={isGeneratingTable}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-600 transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isGeneratingTable ? "Membuat…" : "Tambah Meja"}
                </button>
              </div>

              {tableError ? (
                <p className="text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-2xl px-4 py-2">
                  {tableError}
                </p>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                {tables.map((table) => (
                  <div
                    key={table.slug}
                    className="rounded-2xl border border-emerald-100 bg-white/70 shadow-sm p-5 flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-700">{table.name}</p>
                          <p className="text-xs text-gray-500">{table.slug}</p>
                        </div>
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                          Aktif
                        </span>
                      </div>
                      <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 px-3 py-2 text-xs text-gray-600 break-all">
                        {table.url}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(table.slug, table.url)}
                          className="rounded-full border border-emerald-200 bg-white px-3 py-1 font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          {copiedSlug === table.slug ? "Tautan disalin" : "Salin tautan"}
                        </button>
                        <a
                          href={table.qrDataUrl}
                          download={`${table.slug}.png`}
                          className="rounded-full border border-emerald-200 bg-white px-3 py-1 font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          Download QR
                        </a>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white border border-emerald-100/80 p-3 shadow grid place-items-center">
                      <img
                        src={table.qrDataUrl}
                        alt={`QR untuk ${table.name}`}
                        className="h-36 w-36 object-contain"
                      />
                    </div>
                  </div>
                ))}
                {tables.length === 0 ? (
                  <div className="rounded-2xl border border-emerald-100 bg-white/70 shadow-sm p-6 text-sm text-gray-500">
                    QR meja akan muncul di sini setelah dibuat.
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {activeKey === "orders" ? (
            <section className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Pesanan Masuk</p>
                  <h2 className="text-xl font-semibold text-gray-700">Daftar Pesanan</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Pesanan yang dikonfirmasi dari QRIS akan muncul di sini untuk pengantaran.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={clearOrders}
                  className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                >
                  Hapus Riwayat
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="rounded-2xl border border-emerald-100 bg-white/70 shadow-sm p-6 text-sm text-gray-500">
                  Belum ada pesanan. Konfirmasi pembayaran QRIS untuk melihat data uji coba.
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-emerald-100 bg-white/75 shadow-sm p-5 space-y-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Order ID</p>
                          <p className="text-sm font-semibold text-gray-700">{order.id}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Meja</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {order.tableId ?? "Take Away"}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-emerald-50 bg-emerald-50/60 p-4">
                        <div className="grid gap-2 text-sm text-gray-600">
                          {order.items.map((item) => (
                            <div key={`${order.id}-${item.name}`} className="flex justify-between">
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

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="text-sm text-gray-500 space-y-1">
                          <div className="flex gap-4">
                            <span>Subtotal</span>
                            <span className="font-semibold text-gray-700">{order.subtotalLabel}</span>
                          </div>
                          <div className="flex gap-4">
                            <span>Pajak</span>
                            <span className="font-semibold text-gray-700">{order.taxLabel}</span>
                          </div>
                          <div className="flex gap-4 text-emerald-600 font-semibold">
                            <span>Total</span>
                            <span>{order.totalLabel}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => markServed(order.id)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                            order.status === "served"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-600"
                              : "bg-emerald-500 text-white shadow hover:bg-emerald-600"
                          }`}
                        >
                          {order.status === "served" ? "Sudah Diantar" : "Tandai Sudah Diantar"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
