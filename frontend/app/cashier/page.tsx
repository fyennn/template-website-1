"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrders, type OrderEntry } from "@/lib/orderStore";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import {
  formatTableLabel,
  formatTakeawayLabel,
  formatTakeawaySlug,
  isCashierCardSlug,
  isTakeawaySlug,
  normalizeTableSlug,
  parseTakeawayIndex,
} from "@/lib/tables";

type CardStatus = "available" | "occupied";

type CardConfig = {
  slug: string;
  label: string;
  description: string;
  icon: string;
  highlight: string;
};

const CASHIER_CARD_STORAGE_KEY = "spm-cashier-card-status";
const CASHIER_CARD_CONFIG_KEY = "spm-cashier-extra-cards";
const CASHIER_CARD_USAGE_KEY = "spm-cashier-card-usage";
const CASHIER_BASE_REMOVED_KEY = "spm-cashier-removed-base";

const HIGHLIGHT_VARIANTS = [
  "from-cyan-500/90 to-emerald-400/80",
  "from-sky-500/80 to-indigo-400/70",
  "from-blue-500/80 to-cyan-400/70",
  "from-teal-500/80 to-emerald-400/70",
];

const DEFAULT_SEAT_DESCRIPTION =
  "Kasir gunakan kartu ini saat memesan untuk pelanggan; kartu menjadi penanda meja dan tidak perlu dipindai.";

const BASE_CARD_CONFIGS: CardConfig[] = [
  {
    slug: "takeaway",
    label: "Take Away",
    description: "Pesanan dibawa pulang tanpa nomor meja.",
    icon: "local_mall",
    highlight: "from-emerald-500/90 to-green-400/80",
  },
  ...Array.from({ length: 10 }, (_, index) => {
    const sequence = (index + 1).toString().padStart(2, "0");
    return {
      slug: `A-${sequence}`,
      label: `A-${sequence}`,
      description: DEFAULT_SEAT_DESCRIPTION,
      icon: "event_seat",
      highlight: HIGHLIGHT_VARIANTS[index % HIGHLIGHT_VARIANTS.length],
    };
  }),
];

const BASE_SEAT_COUNT = BASE_CARD_CONFIGS.filter((card) => card.slug !== "takeaway").length;

const fallbackInitials = (source?: string | null) => {
  if (!source) return "KS";
  const parts = source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());
  return parts.join("") || "KS";
};

export default function AdminCashierPage() {
  const router = useRouter();
  const auth = useRequireAdmin();
  const { isAdmin, isReady, user, logout } = auth;
  const { orders } = useOrders();
  const [extraCards, setExtraCards] = useState<CardConfig[]>([]);
  const [removedBaseCards, setRemovedBaseCards] = useState<string[]>([]);
  const cardConfigs = useMemo(() => {
    const baseCards = BASE_CARD_CONFIGS.filter(
      (card) => !removedBaseCards.includes(card.slug)
    );
    return [...baseCards, ...extraCards];
  }, [extraCards, removedBaseCards]);
  const [cardStatusMap, setCardStatusMap] = useState<Record<string, CardStatus>>({});
  const [cardUsageOrder, setCardUsageOrder] = useState<Record<string, number>>({});
  const [pendingDeleteSlug, setPendingDeleteSlug] = useState<string | null>(null);
  const [deleteModeActive, setDeleteModeActive] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardSlug, setNewCardSlug] = useState("");
  const [addCardError, setAddCardError] = useState<string | null>(null);
  const isCashierAccount = user?.role === "Staff Kasir";
  const nextCardSuggestion = useMemo(() => {
    const seatCodes = cardConfigs
      .filter((card) => card.slug !== "takeaway")
      .map((card) => card.slug);
    let maxNumber = 0;
    seatCodes.forEach((slug) => {
      const match = slug.match(/^A-(\d{2,})$/);
      if (match) {
        const numeric = Number.parseInt(match[1], 10);
        if (!Number.isNaN(numeric)) {
          maxNumber = Math.max(maxNumber, numeric);
        }
      }
    });
    const next = maxNumber + 1;
    return `A-${next.toString().padStart(2, "0")}`;
  }, [cardConfigs]);

  const activeOrdersInfo = useMemo(() => {
    const activeOrders = orders.filter(
      (order) => !["served", "cancelled"].includes(order.status)
    );
    const occupiedTakeaway = new Set<number>();
    const activeTakeawayOrderMap = new Map<number, OrderEntry>();
    const activeCashierOrderMap = new Map<string, OrderEntry>();

    activeOrders.forEach((order) => {
      const normalized = normalizeTableSlug(order.tableId);
      if (!normalized) {
        return;
      }

      if (isTakeawaySlug(normalized)) {
        const index = parseTakeawayIndex(normalized);
        if (index !== null) {
          occupiedTakeaway.add(index);
          const existingTakeaway = activeTakeawayOrderMap.get(index);
          if (!existingTakeaway || new Date(order.createdAt).getTime() > new Date(existingTakeaway.createdAt).getTime()) {
            activeTakeawayOrderMap.set(index, order);
          }
        }
      }

      if (isTakeawaySlug(normalized) || isCashierCardSlug(normalized)) {
        const existingCard = activeCashierOrderMap.get(normalized);
        if (!existingCard || new Date(order.createdAt).getTime() > new Date(existingCard.createdAt).getTime()) {
          activeCashierOrderMap.set(normalized, order);
        }
      }
    });

    let nextIndex = 1;
    while (occupiedTakeaway.has(nextIndex)) {
      nextIndex += 1;
    }

    const occupiedIndices = Array.from(occupiedTakeaway).sort((a, b) => a - b);
    const occupiedLabels = occupiedIndices.map((index) =>
      formatTakeawayLabel(formatTakeawaySlug(index))
    );

    const takeawayCards = Array.from(activeTakeawayOrderMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([index, order]) => {
        const slug = formatTakeawaySlug(index);
        const label = formatTakeawayLabel(slug);
        const href = `/status?orderId=${order.id}&cards=${encodeURIComponent(slug)}`;
        return {
          id: order.id,
          slug,
          label,
          href,
        } as const;
      });

    const occupiedTableSlugs = cardConfigs
      .filter((card) => card.slug !== "takeaway")
      .filter((card) => (cardStatusMap[card.slug] ?? "available") === "occupied")
      .map((card) => card.slug)
      .sort((a, b) => {
        const ta = cardUsageOrder[a] ?? Number.MAX_SAFE_INTEGER;
        const tb = cardUsageOrder[b] ?? Number.MAX_SAFE_INTEGER;
        if (ta === tb) {
          return a.localeCompare(b);
        }
        return ta - tb;
      });

    const tableCards = occupiedTableSlugs.map((slug) => {
      const order = activeCashierOrderMap.get(slug);
      const label = formatTableLabel(slug);
      const href = order
        ? `/status?orderId=${order.id}&cards=${encodeURIComponent(slug)}`
        : null;
      return {
        slug,
        label,
        href,
      } as const;
    });

    return {
      occupiedLabels,
      activeCount: occupiedIndices.length,
      nextSlug: formatTakeawaySlug(nextIndex),
      takeawayCards,
      tableCards,
    };
  }, [cardConfigs, cardStatusMap, cardUsageOrder, orders]);

  const {
    nextSlug: nextTakeawaySlug,
    activeCount: activeTakeawayCount,
    occupiedLabels: activeTakeawayLabels,
    takeawayCards: activeTakeawayCards,
    tableCards: occupiedTableCards,
  } = activeOrdersInfo;



  const activeTableLabels = useMemo(
    () => occupiedTableCards.map((card) => card.label),
    [occupiedTableCards]
  );

  const handleOpenAddCard = () => {
    setAddCardError(null);
    setShowAddCard(true);
    setNewCardSlug(nextCardSuggestion);
  };

  const handleCancelAddCard = () => {
    setShowAddCard(false);
    setAddCardError(null);
    setNewCardSlug("");
  };

  const handleAddCardSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = newCardSlug.trim().toUpperCase();
    if (!normalized) {
      setAddCardError("Masukkan kode kartu terlebih dahulu.");
      return;
    }
    if (isTakeawaySlug(normalized)) {
      setAddCardError("Kode ini sudah dipakai untuk opsi Take Away.");
      return;
    }
    if (!/^A-\d{2,}$/.test(normalized)) {
      setAddCardError("Gunakan format seperti A-11 dengan awalan A-.");
      return;
    }
    if (cardConfigs.some((card) => card.slug === normalized)) {
      setAddCardError("Kode kartu sudah tersedia. Pilih kode lain.");
      return;
    }

    const seatCount = cardConfigs.filter((card) => card.slug !== "takeaway").length;
    const highlight = HIGHLIGHT_VARIANTS[seatCount % HIGHLIGHT_VARIANTS.length];
    const newConfig: CardConfig = {
      slug: normalized,
      label: normalized,
      description: DEFAULT_SEAT_DESCRIPTION,
      icon: "event_seat",
      highlight,
    };
    setExtraCards((prev) => [...prev, newConfig]);
    setCardStatusMap((prev) => ({ ...prev, [normalized]: "available" }));
    setShowAddCard(false);
    setAddCardError(null);
    setNewCardSlug("");
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem(CASHIER_CARD_CONFIG_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as CardConfig[] | null;
      if (!Array.isArray(parsed)) {
        return;
      }
      const sanitized = parsed
        .filter((card): card is CardConfig => Boolean(card?.slug) && card.slug !== "takeaway")
        .map((card, index) => {
          const highlight =
            card.highlight ??
            HIGHLIGHT_VARIANTS[(BASE_SEAT_COUNT + index) % HIGHLIGHT_VARIANTS.length];
          return {
            slug: card.slug,
            label: card.label ?? card.slug,
            description: card.description ?? DEFAULT_SEAT_DESCRIPTION,
            icon: card.icon ?? "event_seat",
            highlight,
          };
        });
      if (sanitized.length > 0) {
        setExtraCards(sanitized);
      }
    } catch (error) {
      console.error("Failed to restore cashier card configuration", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem(CASHIER_BASE_REMOVED_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as string[] | null;
      if (Array.isArray(parsed)) {
        setRemovedBaseCards(parsed.filter((slug) => typeof slug === "string"));
      }
    } catch (error) {
      console.error("Failed to restore removed base cards", error);
    }
  }, []);

  // Restore saved statuses
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem(CASHIER_CARD_STORAGE_KEY);
      if (!stored) {
        return;
      }
      const parsed = JSON.parse(stored) as Partial<Record<string, CardStatus>>;
      setCardStatusMap((prev) => {
        const next = { ...prev };
        Object.entries(parsed).forEach(([slug, status]) => {
          if (status === "available" || status === "occupied") {
            next[slug] = status;
          }
        });
        return next;
      });
    } catch (error) {
      console.error("Failed to restore cashier card status", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem(CASHIER_CARD_USAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, number> | null;
        if (parsed && typeof parsed === "object") {
          setCardUsageOrder(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to restore cashier card usage", error);
    }
  }, []);

  // Persist status map
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(CASHIER_CARD_STORAGE_KEY, JSON.stringify(cardStatusMap));
    } catch (error) {
      console.error("Failed to persist cashier card status", error);
    }
  }, [cardStatusMap]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (Object.keys(cardUsageOrder).length === 0) {
        window.localStorage.removeItem(CASHIER_CARD_USAGE_KEY);
      } else {
        window.localStorage.setItem(CASHIER_CARD_USAGE_KEY, JSON.stringify(cardUsageOrder));
      }
    } catch (error) {
      console.error("Failed to persist cashier card usage", error);
    }
  }, [cardUsageOrder]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (extraCards.length === 0) {
        window.localStorage.removeItem(CASHIER_CARD_CONFIG_KEY);
      } else {
        window.localStorage.setItem(CASHIER_CARD_CONFIG_KEY, JSON.stringify(extraCards));
      }
    } catch (error) {
      console.error("Failed to persist cashier card configuration", error);
    }
  }, [extraCards]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      if (removedBaseCards.length === 0) {
        window.localStorage.removeItem(CASHIER_BASE_REMOVED_KEY);
      } else {
        window.localStorage.setItem(CASHIER_BASE_REMOVED_KEY, JSON.stringify(removedBaseCards));
      }
    } catch (error) {
      console.error("Failed to persist removed base cards", error);
    }
  }, [removedBaseCards]);

  useEffect(() => {
    setCardStatusMap((prev) => {
      const next = { ...prev };
      let changed = false;

      cardConfigs.forEach((card) => {
        if (next[card.slug] === undefined) {
          next[card.slug] = "available";
          changed = true;
        }
      });

      Object.keys(next).forEach((slug) => {
        if (!cardConfigs.some((card) => card.slug === slug)) {
          delete next[slug];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [cardConfigs]);

  useEffect(() => {
    setCardUsageOrder((prev) => {
      const next = { ...prev };
      let changed = false;

      Object.keys(next).forEach((slug) => {
        if (
          !cardConfigs.some((card) => card.slug === slug) ||
          (cardStatusMap[slug] ?? "available") !== "occupied"
        ) {
          delete next[slug];
          changed = true;
        }
      });

      cardConfigs.forEach((card) => {
        if (
          card.slug !== "takeaway" &&
          (cardStatusMap[card.slug] ?? "available") === "occupied" &&
          next[card.slug] === undefined
        ) {
          next[card.slug] = Date.now();
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [cardConfigs, cardStatusMap]);

  const availability = useMemo(() => {
    const statuses = cardConfigs.map((card) =>
      card.slug === "takeaway"
        ? activeTakeawayCount > 0
          ? "occupied"
          : "available"
        : (cardStatusMap[card.slug] ?? "available")
    );
    const available = statuses.filter((status) => status === "available").length;
    const occupied = statuses.length - available;
    const total = cardConfigs.length;
    return { available, occupied, total };
  }, [cardConfigs, cardStatusMap, activeTakeawayCount]);

  const handleSelect = (slug: string) => {
    if (slug === "takeaway") {
      router.push(`/cashier/menu?cards=${nextTakeawaySlug}`);
      return;
    }
    router.push(`/cashier/menu?cards=${slug}`);
  };

  const toggleStatus = (slug: string) => {
    if (isTakeawaySlug(slug)) {
      return;
    }
    const currentStatus = cardStatusMap[slug] ?? "available";
    const nextStatus: CardStatus = currentStatus === "available" ? "occupied" : "available";
    setCardStatusMap((prev) => ({ ...prev, [slug]: nextStatus }));
    if (nextStatus === "occupied") {
      setCardUsageOrder((prev) => {
        if (prev[slug] !== undefined) {
          return prev;
        }
        return { ...prev, [slug]: Date.now() };
      });
    } else {
      setCardUsageOrder((prev) => {
        if (prev[slug] === undefined) {
          return prev;
        }
        const next = { ...prev };
        delete next[slug];
        return next;
      });
    }
  };

  if (!isReady || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <header className="bg-white/80 backdrop-blur border-b border-emerald-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 text-white items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-2xl">point_of_sale</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
                Mode Kasir
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Pilih Kartu Pesanan</h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                Arahan cepat untuk kasir. Pilih kartu yang akan dibawa pelanggan saat duduk, lalu buat pesanan dari kasir—pelanggan tidak perlu melakukan scan apa pun.
              </p>
            </div>
          </div>
          {isCashierAccount ? (
            <div className="inline-flex items-center gap-3 rounded-3xl border border-emerald-100 bg-white/90 px-5 py-3 shadow-sm">
              <Link
                href="/admin/profile"
                className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
                  {user?.avatarInitials || fallbackInitials(user?.name)}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-gray-800">{user?.name ?? "Kasir"}</p>
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
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Dashboard Admin
              </Link>
              <div className="hidden sm:flex flex-col items-end text-sm text-gray-500">
                <span>Kartu siap pakai</span>
                <span className="text-lg font-semibold text-emerald-600">
                  {availability.available}/{availability.total}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl bg-white/80 backdrop-blur border border-emerald-100 shadow-sm p-6 space-y-6">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/70 p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Status Kartu</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Tersedia</span>
                <span className="text-lg font-semibold text-emerald-600">{availability.available}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Sedang Dipakai</span>
                <span className="text-lg font-semibold text-amber-600">{availability.occupied}</span>
              </div>
              <div className="border-t border-emerald-100 pt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Total kartu</span>
                <span className="font-semibold text-gray-700">{availability.total}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-100/40 p-5 space-y-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/70 text-emerald-600 p-3 shadow">
                  <span className="material-symbols-outlined text-xl">add_card</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Tambah Kartu Baru</p>
                  <p className="text-xs text-gray-500">
                    Perlu kartu tambahan untuk area tertentu? Tambahkan kode kartu agar kasir dapat menggunakannya.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenAddCard}
                disabled={showAddCard}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-base">add</span>
                {showAddCard ? "Sedang Menambahkan…" : "Tambah Kartu"}
              </button>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Tips Kasir</p>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-500 mt-[2px]">looks_one</span>
                  Pilih kartu yang akan dibawa pelanggan sebelum memulai pemesanan.
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-500 mt-[2px]">looks_two</span>
                  Buat pesanan atas nama pelanggan menggunakan kartu tersebut—tidak perlu QR atau scan.
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-emerald-500 mt-[2px]">looks_3</span>
                  Saat kartu kembali, tandai statusnya menjadi tersedia lagi.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/70 to-white p-5 space-y-3 hidden lg:block">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Kelola Kartu</p>
                  <p className="text-xs text-gray-500">
                    Aktifkan mode hapus untuk menghapus kartu tambahan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteModeActive((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                    deleteModeActive
                      ? "border border-red-200 bg-red-50 text-red-600"
                      : "border border-emerald-200 bg-white text-emerald-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  {deleteModeActive ? "Batalkan" : "Aktifkan"}
                </button>
              </div>
              <div className="text-xs text-gray-500">
                {deleteModeActive
                  ? "Pilih kartu di panel kanan untuk dihapus. Kartu tidak boleh dalam status sedang dipakai."
                  : "Tombol hapus akan muncul di kartu setelah mode diaktifkan."}
              </div>
            </div>
          </aside>

          <section className="space-y-6">
        {activeTakeawayLabels.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 shadow-sm flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-emerald-600 border border-emerald-200">
                <span className="material-symbols-outlined text-sm">local_mall</span>
                Take Away aktif
              </span>
              <span className="text-[11px]">
                {activeTakeawayLabels.join(", ")}
              </span>
            </div>
            <div className="grid gap-2 text-sm">
              {activeTakeawayCards.map((card) => (
                <Link
                  key={card.id}
                  href={card.href}
                  className="group flex items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 px-4 py-3 text-emerald-700 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-base text-emerald-500">receipt_long</span>
                    <div className="flex flex-col">
                      <span className="text-xs uppercase tracking-[0.25em] text-emerald-500">Status Pesanan</span>
                      <span className="text-sm font-semibold text-emerald-700">{card.label}</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                    Lihat Status
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </span>
                  </Link>
                ))}
            </div>
          </div>
        ) : null}
        {occupiedTableCards.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 shadow-sm flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-emerald-600 border border-emerald-200">
                <span className="material-symbols-outlined text-sm">table_restaurant</span>
                Kartu yang digunakan
              </span>
              <span className="text-[11px]">
                {activeTableLabels.join(", ")}
              </span>
            </div>
            {occupiedTableCards.some((card) => card.href) ? (
              <div className="grid gap-2 text-sm">
                {occupiedTableCards
                  .filter((card) => card.href)
                  .map((card) => (
                    <Link
                      key={card.slug}
                      href={card.href!}
                      className="group flex items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 px-4 py-3 text-emerald-700 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-base text-emerald-500">table_restaurant</span>
                        <div className="flex flex-col">
                          <span className="text-xs uppercase tracking-[0.25em] text-emerald-500">Status Pesanan</span>
                          <span className="text-sm font-semibold text-emerald-700">{card.label}</span>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
                        Lihat Status
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                      </span>
                    </Link>
                  ))}
              </div>
            ) : null}
          </div>
        ) : null}
            {showAddCard ? (
              <div className="rounded-3xl border border-emerald-100 bg-white/80 shadow-sm p-6">
                <form onSubmit={handleAddCardSubmit} className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
                      Kartu Baru
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Masukkan kode kartu fisik yang ingin ditambahkan ke daftar.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                    <div className="flex-1">
                      <label
                        htmlFor="cashier-card-slug"
                        className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400"
                      >
                        Kode kartu
                      </label>
                      <input
                        id="cashier-card-slug"
                        name="cashier-card-slug"
                        value={newCardSlug}
                        onChange={(event) => setNewCardSlug(event.target.value.toUpperCase())}
                        placeholder="A-11"
                        className="mt-2 w-full rounded-2xl border border-emerald-100 bg-white/70 px-4 py-3 text-sm font-semibold text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCancelAddCard}
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-600 transition"
                      >
                        <span className="material-symbols-outlined text-base">save</span>
                        Simpan
                      </button>
                    </div>
                  </div>
                  {addCardError ? (
                    <p className="text-xs font-semibold text-red-500">{addCardError}</p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Contoh kode yang valid: <span className="font-semibold text-gray-700">A-11</span>,{" "}
                      <span className="font-semibold text-gray-700">A-12</span>. Kode akan ditampilkan ke
                      pelanggan apa adanya.
                    </p>
                  )}
                </form>
              </div>
            ) : null}
            <div className="grid gap-4">
              {cardConfigs.map((card) => {
                const isTakeaway = card.slug === "takeaway";
                const status: CardStatus = isTakeaway
                  ? activeTakeawayCount > 0
                    ? "occupied"
                    : "available"
                  : (cardStatusMap[card.slug] ?? "available");
                const statusLabel = isTakeaway
                  ? activeTakeawayCount > 0
                    ? `${activeTakeawayCount} Pesanan Aktif`
                    : "Tidak Ada Pesanan"
                  : status === "available"
                    ? "Tersedia"
                    : "Sedang digunakan";
                const statusClass =
                  status === "available"
                    ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                    : "bg-amber-100 text-amber-700 border border-amber-200";
                const nextTakeawayLabel = formatTakeawayLabel(nextTakeawaySlug);
                const displayLabel = isTakeaway ? nextTakeawayLabel : card.label;
                const displayDescription = isTakeaway
                  ? `Pesanan dibawa pulang tanpa nomor meja. Slot berikutnya ${nextTakeawayLabel}.`
                  : card.description;

                return (
                  <div
                    key={card.slug}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelect(card.slug)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleSelect(card.slug);
                      }
                    }}
                    className={`group cursor-pointer relative overflow-hidden rounded-3xl border transition-all duration-200 text-left shadow-sm ${
                      status === "available"
                        ? "border-transparent bg-white/85 hover:-translate-y-1 hover:shadow-lg"
                        : "border-amber-100 bg-amber-50/80 hover:-translate-y-1 hover:shadow-lg"
                    } ${isTakeaway ? "p-6 sm:p-7" : "p-5 sm:p-6"}`}
                  >
                    <div
                      className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-gradient-to-br ${card.highlight}`}
                    />
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                            isTakeaway
                              ? "bg-gradient-to-br from-emerald-500 to-green-500 text-white"
                              : "bg-gradient-to-br from-emerald-100 to-white text-emerald-600"
                          } shadow`}
                        >
                          <span className="material-symbols-outlined text-2xl">{card.icon}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-500">
                            {isTakeaway ? "Pesanan Tanpa Meja" : "Nomor Kartu"}
                          </p>
                          <h2 className="text-xl font-semibold text-gray-800">{displayLabel}</h2>
                          <p className="mt-1 text-sm text-gray-500 max-w-xl">{displayDescription}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                          <span className="material-symbols-outlined text-sm">
                            {status === "available" ? "check_circle" : "hourglass_top"}
                          </span>
                          {statusLabel}
                        </span>
                    {!isTakeaway && deleteModeActive ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (status === "occupied") {
                            return;
                          }
                          setPendingDeleteSlug(card.slug);
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                          status === "occupied"
                            ? "border border-gray-200 text-gray-300 cursor-not-allowed"
                            : "border border-red-200 text-red-500 hover:bg-red-50"
                        }`}
                        disabled={status === "occupied"}
                      >
                        <span className="material-symbols-outlined text-xs">delete</span>
                        Hapus
                      </button>
                    ) : null}
                        {isTakeaway ? (
                          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                            <span className="material-symbols-outlined text-sm">bookmark_add</span>
                            Slot berikutnya: {formatTakeawayLabel(nextTakeawaySlug)}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                              status === "available"
                                ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                : "border-amber-200 text-amber-600 hover:bg-amber-100"
                            }`}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleStatus(card.slug);
                            }}
                          >
                            <span className="material-symbols-outlined text-sm">
                              {status === "available" ? "play_arrow" : "done"}
                            </span>
                            {status === "available" ? "Tandai Dipakai" : "Tandai Selesai"}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="relative z-10 mt-6 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2 font-medium text-emerald-600">
                        <span className="material-symbols-outlined text-base">
                          {isTakeaway ? "local_mall" : "table_restaurant"}
                        </span>
                        {isTakeaway
                          ? `Tap untuk mulai pesanan (${formatTakeawayLabel(nextTakeawaySlug)})`
                          : `Tap untuk ${status === "available" ? "mulai" : "lanjutkan"} pesanan`}
                      </div>
                      <span className="material-symbols-outlined text-lg text-emerald-400 transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {pendingDeleteSlug ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-emerald-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 text-3xl">warning</span>
              <div>
                <p className="text-sm font-semibold text-gray-700">Hapus kartu?</p>
                <p className="text-xs text-gray-500">
                  Kartu <span className="font-semibold text-gray-700">{pendingDeleteSlug}</span> akan dihapus dari daftar.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPendingDeleteSlug(null)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 font-semibold text-gray-500 hover:bg-gray-100 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const slug = pendingDeleteSlug;
                  setPendingDeleteSlug(null);
                  const isBaseCard = BASE_CARD_CONFIGS.some((card) => card.slug === slug);
                  if (isBaseCard) {
                    setRemovedBaseCards((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
                  } else {
                    setExtraCards((prev) => prev.filter((card) => card.slug !== slug));
                  }
                  setCardStatusMap((prev) => {
                    const next = { ...prev };
                    delete next[slug];
                    return next;
                  });
                  setCardUsageOrder((prev) => {
                    if (prev[slug] === undefined) {
                      return prev;
                    }
                    const next = { ...prev };
                    delete next[slug];
                    return next;
                  });
                }}
                className="rounded-full bg-red-500 px-4 py-2 font-semibold text-white shadow hover:bg-red-600 transition"
              >
                Ya, hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
