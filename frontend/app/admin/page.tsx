"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useAuth } from "@/lib/authStore";
import { useOrders } from "@/lib/orderStore";
import type { ChangeEvent, FormEvent } from "react";

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
  active: boolean;
};

type OrderListSectionProps = {
  title: string;
  description: string;
  orders: ReturnType<typeof useOrders>["orders"];
  onMarkServed?: (id: string) => void;
  actionLabel: string;
};

const TABLES_STORAGE_KEY = "spm-admin-tables";
const SETTINGS_STORAGE_KEY = "spm-admin-settings";

type AdminSettings = {
  store: {
    name: string;
    tagline: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    instagram: string;
    wifiName: string;
    wifiPassword: string;
  };
  hours: Array<{
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }>;
  payment: {
    qrisMerchantName: string;
    qrisId: string;
    bankName: string;
    bankAccountNumber: string;
    cashEnabled: boolean;
    cardEnabled: boolean;
    autoConfirmQris: boolean;
    serviceCharge: number;
    taxRate: number;
  };
  notifications: {
    newOrder: boolean;
    lowStock: boolean;
    staffSchedule: boolean;
    email: string;
    whatsapp: string;
    sound: boolean;
  };
  adminAccounts: Array<{
    name: string;
    role: string;
    email: string;
    phone: string;
    status: "active" | "pending";
    lastLogin: string;
  }>;
};

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  store: {
    name: "SPM Café",
    tagline: "Kopi lokal dengan suasana nyaman",
    description:
      "Kedai kopi rumahan yang menyajikan racikan kopi spesial dan makanan ringan favorit keluarga.",
    address: "Jl. Melati No. 12, Bandung",
    phone: "+62 812-1234-5678",
    email: "admin@spmcafe.com",
    instagram: "@spmcafe",
    wifiName: "SPM-Cafe",
    wifiPassword: "kopihangat",
  },
  hours: [
    { day: "Senin", open: "08:00", close: "22:00", closed: false },
    { day: "Selasa", open: "08:00", close: "22:00", closed: false },
    { day: "Rabu", open: "08:00", close: "22:00", closed: false },
    { day: "Kamis", open: "08:00", close: "22:00", closed: false },
    { day: "Jumat", open: "08:00", close: "23:00", closed: false },
    { day: "Sabtu", open: "09:00", close: "23:00", closed: false },
    { day: "Minggu", open: "09:00", close: "21:00", closed: false },
  ],
  payment: {
    qrisMerchantName: "SPM Café",
    qrisId: "00020101021234567890",
    bankName: "Bank Contoh",
    bankAccountNumber: "1234567890",
    cashEnabled: true,
    cardEnabled: true,
    autoConfirmQris: true,
    serviceCharge: 5,
    taxRate: 10,
  },
  notifications: {
    newOrder: true,
    lowStock: true,
    staffSchedule: false,
    email: "admin@spmcafe.com",
    whatsapp: "+62 812-1234-5678",
    sound: true,
  },
  adminAccounts: [
    {
      name: "Adit Pratama",
      role: "Pemilik",
      email: "adit@spmcafe.com",
      phone: "+62 812-0000-1111",
      status: "active",
      lastLogin: "Hari ini, 08:45",
    },
    {
      name: "Sinta Dewi",
      role: "Manager",
      email: "sinta@spmcafe.com",
      phone: "+62 812-0000-2222",
      status: "active",
      lastLogin: "Kemarin, 17:20",
    },
  ],
};

function createDefaultSettings(): AdminSettings {
  return {
    store: { ...DEFAULT_ADMIN_SETTINGS.store },
    hours: DEFAULT_ADMIN_SETTINGS.hours.map((entry) => ({ ...entry })),
    payment: { ...DEFAULT_ADMIN_SETTINGS.payment },
    notifications: { ...DEFAULT_ADMIN_SETTINGS.notifications },
    adminAccounts: DEFAULT_ADMIN_SETTINGS.adminAccounts.map((entry) => ({ ...entry })),
  };
}

function mergeStoredSettings(stored: Partial<AdminSettings> | null | undefined): AdminSettings {
  if (!stored) {
    return createDefaultSettings();
  }

  const mergedHours = DEFAULT_ADMIN_SETTINGS.hours.map((defaultEntry) => {
    const candidate = stored.hours?.find((item) => item?.day === defaultEntry.day);
    if (!candidate) {
      return { ...defaultEntry };
    }
    return {
      ...defaultEntry,
      ...candidate,
      day: defaultEntry.day,
    };
  });

  const mergedAccounts =
    stored.adminAccounts && stored.adminAccounts.length > 0
      ? stored.adminAccounts.map((account) => ({
          ...account,
          status: account.status === "pending" ? "pending" : "active",
        }))
      : DEFAULT_ADMIN_SETTINGS.adminAccounts.map((entry) => ({ ...entry }));

  return {
    store: { ...DEFAULT_ADMIN_SETTINGS.store, ...(stored.store ?? {}) },
    hours: mergedHours,
    payment: { ...DEFAULT_ADMIN_SETTINGS.payment, ...(stored.payment ?? {}) },
    notifications: { ...DEFAULT_ADMIN_SETTINGS.notifications, ...(stored.notifications ?? {}) },
    adminAccounts: mergedAccounts,
  };
}

const ADMIN_ROLE_OPTIONS = ["Pemilik", "Manager", "Supervisor", "Staff"] as const;

type SettingsSectionKey =
  | "store"
  | "hours"
  | "payment"
  | "notifications"
  | "access"
  | "backup";

const SETTINGS_SECTIONS: Array<{
  key: SettingsSectionKey;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: "store",
    label: "Profil Toko",
    description: "Identitas café dan kontak utama.",
    icon: "storefront",
  },
  {
    key: "hours",
    label: "Jadwal Layanan",
    description: "Jam buka dan status operasional.",
    icon: "schedule",
  },
  {
    key: "payment",
    label: "Pembayaran",
    description: "Metode, biaya layanan, dan pajak.",
    icon: "credit_card",
  },
  {
    key: "notifications",
    label: "Notifikasi",
    description: "Pengaturan pemberitahuan dan penerima.",
    icon: "notifications_active",
  },
  {
    key: "access",
    label: "Akses Pengguna",
    description: "Daftar admin dan undangan baru.",
    icon: "group",
  },
  {
    key: "backup",
    label: "Pusat Backup",
    description: "Ekspor laporan penjualan berkala.",
    icon: "cloud_download",
  },
];

type BackupRangeValue = "today" | "7d" | "14d" | "30d" | "this-month" | "last-month" | "custom";

const BACKUP_RANGE_OPTIONS: Array<{ value: BackupRangeValue; label: string }> = [
  { value: "today", label: "Hari ini" },
  { value: "7d", label: "7 hari terakhir" },
  { value: "14d", label: "14 hari terakhir" },
  { value: "30d", label: "30 hari terakhir" },
  { value: "this-month", label: "Bulan ini" },
  { value: "last-month", label: "Bulan lalu" },
  { value: "custom", label: "Rentang tanggal kustom" },
];

function backupRangeLabel(value: BackupRangeValue) {
  const found = BACKUP_RANGE_OPTIONS.find((option) => option.value === value);
  return found ? found.label : value;
}

function parseDateInput(value: string): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateDaysBetween(start?: string, end?: string): number | null {
  const startDate = parseDateInput(start ?? "");
  const endDate = parseDateInput(end ?? "");
  if (!startDate || !endDate) {
    return null;
  }
  const diff = Math.abs(endDate.getTime() - startDate.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  return Number.isFinite(days) ? Math.max(days, 1) : null;
}

function computePreviewSummary(
  range: BackupRangeValue,
  customStart: string,
  customEnd: string
): { totalOrders: number; totalRevenue: number; periodLabel: string } {
  const today = new Date();
  let days = 7;
  let periodLabel = backupRangeLabel(range);

  switch (range) {
    case "today":
      days = 1;
      break;
    case "7d":
      days = 7;
      break;
    case "14d":
      days = 14;
      break;
    case "30d":
      days = 30;
      break;
    case "this-month": {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const diff = Math.floor((today.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      days = Math.max(diff, 1);
      break;
    }
    case "last-month": {
      const firstLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      const diff =
        Math.floor(
          (lastDayLastMonth.getTime() - firstLastMonth.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
      days = Math.max(diff, 1);
      break;
    }
    case "custom": {
      const diff = calculateDaysBetween(customStart, customEnd);
      if (diff) {
        days = diff;
        periodLabel =
          customStart && customEnd
            ? `${customStart} – ${customEnd}`
            : "Rentang tanggal kustom";
      } else {
        days = 3;
        periodLabel = "Rentang tanggal kustom";
      }
      break;
    }
    default:
      days = 7;
      break;
  }

  const estimatedOrders = Math.max(15, Math.round(days * 4.8));
  const averageTicket = 55000;
  const totalRevenue = estimatedOrders * averageTicket;

  return {
    totalOrders: estimatedOrders,
    totalRevenue,
    periodLabel,
  };
}

function formatCurrencyIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumberID(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function OrderListSection({ title, description, orders, onMarkServed, actionLabel }: OrderListSectionProps) {
  const [expanded, setExpanded] = useState(true);
  if (orders.length === 0) {
    return (
      <section className="rounded-2xl border border-emerald-100 bg-white/70 shadow-sm p-6 text-sm text-gray-500">
        <p className="font-semibold text-gray-600">{title}</p>
        <p className="mt-1">{description}</p>
        <p className="mt-3 text-xs text-gray-400">Belum ada pesanan pada kategorinya.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-emerald-100 bg-white/75 shadow-sm">
      <button
        type="button"
        className="w-full px-5 py-4 flex items-center justify-between text-left"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{title}</p>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        <span className="material-symbols-outlined text-emerald-500">
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>
      {expanded ? (
        <div className="space-y-4 px-5 pb-5">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-emerald-100 bg-white/70 shadow-sm p-5 space-y-4"
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

                {onMarkServed ? (
                  <button
                    type="button"
                    onClick={() => onMarkServed(order.id)}
                    className="rounded-full bg-emerald-500 text-white px-4 py-2 text-xs font-semibold shadow hover:bg-emerald-600 transition"
                  >
                    {actionLabel}
                  </button>
                ) : (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600">
                    {actionLabel}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

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
    active: true,
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { isAdmin, logout } = useAuth();
  const { orders, markServed, clearOrders } = useOrders();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeKey, setActiveKey] = useState<AdminNavKey>("dashboard");
  const [tables, setTables] = useState<TableEntry[]>([]);
  const [isGeneratingTable, setIsGeneratingTable] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [pendingToggleSlug, setPendingToggleSlug] = useState<string | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(() => createDefaultSettings());
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState("");
  const [newAdminRole, setNewAdminRole] = useState<typeof ADMIN_ROLE_OPTIONS[number]>("Staff");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [adminInviteError, setAdminInviteError] = useState<string | null>(null);
  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsSectionKey>("store");
  const [backupRange, setBackupRange] = useState<BackupRangeValue>("7d");
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [customRangeStart, setCustomRangeStart] = useState<string>("");
  const [customRangeEnd, setCustomRangeEnd] = useState<string>("");
  const [selectedExportFormats, setSelectedExportFormats] = useState<{
    csv: boolean;
    pdf: boolean;
  }>({ csv: true, pdf: true });
  const [previewSummary, setPreviewSummary] = useState<{
    totalOrders: number;
    totalRevenue: number;
    periodLabel: string;
  }>({
    totalOrders: 0,
    totalRevenue: 0,
    periodLabel: backupRangeLabel("7d"),
  });
  const settingsHydratedRef = useRef(false);

  const handleStoreFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const field = name as keyof AdminSettings["store"];
    setSettings((prev) => ({
      ...prev,
      store: {
        ...prev.store,
        [field]: value,
      },
    }));
  };

  const handleHourChange = (index: number, field: "open" | "close" | "closed", value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      hours: prev.hours.map((entry, idx) => {
        if (idx !== index) {
          return entry;
        }
        if (field === "closed") {
          return { ...entry, closed: value as boolean };
        }
        if (field === "open") {
          return { ...entry, open: value as string };
        }
        return { ...entry, close: value as string };
      }),
    }));
  };

  const togglePaymentField = (field: "cashEnabled" | "cardEnabled" | "autoConfirmQris") => {
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        [field]: !prev.payment[field],
      },
    }));
  };

  const handleBackupRangeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as BackupRangeValue;
    setBackupRange(value);
    if (value !== "custom") {
      setCustomRangeStart("");
      setCustomRangeEnd("");
      setPreviewSummary((prev) => ({
        ...prev,
        periodLabel: backupRangeLabel(value),
      }));
    }
  };

  const handleCustomRangeChange = (field: "start" | "end", value: string) => {
    if (field === "start") {
      setCustomRangeStart(value);
    } else {
      setCustomRangeEnd(value);
    }
  };

  const toggleExportFormat = (field: "csv" | "pdf") => {
    setSelectedExportFormats((prev) => {
      const next = { ...prev, [field]: !prev[field] };
      if (!next.csv && !next.pdf) {
        next[field === "csv" ? "pdf" : "csv"] = true;
      }
      return next;
    });
  };

  const handleExportSalesBackup = () => {
    if (isExportingBackup) {
      return;
    }
    setPreviewSummary(computePreviewSummary(backupRange, customRangeStart, customRangeEnd));
    setIsExportingBackup(true);
    const formats = [
      selectedExportFormats.csv ? "CSV" : null,
      selectedExportFormats.pdf ? "PDF" : null,
    ]
      .filter(Boolean)
      .join(" & ");
    const periodText =
      backupRange === "custom" && customRangeStart && customRangeEnd
        ? `${customRangeStart} hingga ${customRangeEnd}`
        : backupRangeLabel(backupRange);
    setSaveMessage(`Menyiapkan laporan ${formats} untuk periode ${periodText}…`);
    window.setTimeout(() => {
      setIsExportingBackup(false);
      setSaveMessage(
        `Laporan ${formats} untuk periode ${periodText} siap diunduh · mode demo.`
      );
      window.setTimeout(() => setSaveMessage(null), 2600);
    }, 900);
  };

  const handleNotificationContactChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const field = name as "email" | "whatsapp";
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const handleNotificationToggle = (field: "newOrder" | "lowStock" | "staffSchedule" | "sound") => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field],
      },
    }));
  };

  const handlePaymentNumberChange = (
    field: "serviceCharge" | "taxRate",
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const parsedValue = Number(event.target.value);
    const safeValue = Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        [field]: safeValue,
      },
    }));
  };

  const handleAddAdminAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = newAdminEmail.trim();
    if (!email) {
      setAdminInviteError("Email wajib diisi sebelum mengundang admin baru.");
      return;
    }
    const isDuplicate = settings.adminAccounts.some(
      (account) => account.email.toLowerCase() === email.toLowerCase()
    );
    if (isDuplicate) {
      setAdminInviteError("Email tersebut sudah terdaftar sebagai admin.");
      return;
    }

    const nameFromEmail = email.includes("@") ? email.split("@")[0] : email;

    setSettings((prev) => ({
      ...prev,
      adminAccounts: [
        ...prev.adminAccounts,
        {
          name: nameFromEmail.replace(/\./g, " "),
          role: newAdminRole,
          email,
          phone: newAdminPhone.trim(),
          status: "pending",
          lastLogin: "Belum pernah masuk",
        },
      ],
    }));
    setNewAdminEmail("");
    setNewAdminPhone("");
    setNewAdminRole("Staff");
    setAdminInviteError(null);
    setSaveMessage("Undangan admin baru tersimpan.");
    window.setTimeout(() => setSaveMessage(null), 2600);
  };

  const handleRemoveAdmin = (email: string) => {
    setSettings((prev) => {
      if (prev.adminAccounts.length <= 1) {
        return prev;
      }
      const nextAccounts = prev.adminAccounts.filter((account) => account.email !== email);
      if (nextAccounts.length === prev.adminAccounts.length) {
        return prev;
      }
      return {
        ...prev,
        adminAccounts: nextAccounts,
      };
    });
  };

  const handleSaveSettings = () => {
    setSaveMessage("Pengaturan tersimpan.");
    window.setTimeout(() => setSaveMessage(null), 2600);
  };

  const handleResetSettings = () => {
    const defaults = createDefaultSettings();
    setSettings(defaults);
    setSaveMessage("Pengaturan dikembalikan ke pengaturan awal.");
    window.setTimeout(() => setSaveMessage(null), 2600);
  };

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/login");
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    if (settingsHydratedRef.current) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      let resolvedSettings: AdminSettings;
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AdminSettings>;
        resolvedSettings = mergeStoredSettings(parsed);
      } else {
        resolvedSettings = createDefaultSettings();
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(resolvedSettings));
      }
      settingsHydratedRef.current = true;
      setSettings(resolvedSettings);
    } catch (error) {
      console.error("Failed to bootstrap settings", error);
      const fallback = createDefaultSettings();
      settingsHydratedRef.current = true;
      setSettings(fallback);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    if (!settingsHydratedRef.current) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to persist settings", error);
    }
  }, [isAdmin, settings]);

  useEffect(() => {
    setPreviewSummary(computePreviewSummary(backupRange, customRangeStart, customRangeEnd));
  }, [backupRange, customRangeStart, customRangeEnd]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isMounted = true;

    const bootstrapTables = async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        let savedTables: TableEntry[] | null = null;
        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem(TABLES_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as TableEntry[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                savedTables = parsed.map((entry, index) => ({
                  ...entry,
                  id: entry.id ?? index + 1,
                  active: entry.active !== false,
                }));
              }
            } catch (error) {
              console.error("Failed to parse stored tables", error);
            }
          }
        }

        if (!savedTables) {
          savedTables = await Promise.all(
            [1, 2, 3].map((index) => generateTableEntry(index, origin))
          );
          if (typeof window !== "undefined") {
            window.localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(savedTables));
          }
        }

        if (isMounted) {
          setTables(savedTables);
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
      setTables((prev) => {
        const next = [...prev, entry];
        if (typeof window !== "undefined") {
          window.localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
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

  const handleToggleTable = (slug: string) => {
    setTables((prev) => {
      const next = prev.map((entry) =>
        entry.slug === slug ? { ...entry, active: !entry.active } : entry
      );
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };

  const isCustomRangeIncomplete =
    backupRange === "custom" && (!customRangeStart || !customRangeEnd);
  const downloadDisabled = isExportingBackup || isCustomRangeIncomplete;

  if (!isAdmin) {
    return null;
  }

  return (
    <>
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
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                            table.active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                              : "border-gray-200 bg-gray-100 text-gray-500"
                          }`}
                        >
                          {table.active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 px-3 py-2 text-xs text-gray-600 break-all">
                        {table.url}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(table.slug, table.url)}
                          disabled={!table.active}
                          className={`rounded-full border px-3 py-1 font-semibold transition ${
                            table.active
                              ? "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                              : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {copiedSlug === table.slug ? "Tautan disalin" : "Salin tautan"}
                        </button>
                        <a
                          href={table.qrDataUrl}
                          download={`${table.slug}.png`}
                          className={`rounded-full border px-3 py-1 font-semibold transition ${
                            table.active
                              ? "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                              : "border-gray-200 bg-gray-100 text-gray-400 pointer-events-none"
                          }`}
                        >
                          Download QR
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            if (table.active) {
                              setPendingToggleSlug(table.slug);
                            } else {
                              handleToggleTable(table.slug);
                            }
                          }}
                          className={`rounded-full border px-3 py-1 font-semibold transition ${
                            table.active
                              ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                              : "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          }`}
                        >
                          {table.active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
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
            <section className="space-y-6">
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
                  onClick={() => setShowClearConfirm(true)}
                  className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                >
                  Hapus Riwayat
                </button>
              </div>

              <div className="space-y-6">
                <OrderListSection
                  title="Proses Pengantaran"
                  description="Pesanan berikut siap diantar, tekan tombol jika sudah selesai."
                  orders={orders.filter((order) => order.status !== "served")}
                  onMarkServed={markServed}
                  actionLabel="Tandai Sudah Diantar"
                />
                <OrderListSection
                  title="Pesanan Selesai"
                  description="Riwayat pesanan yang telah diantar."
                  orders={orders.filter((order) => order.status === "served")}
                  actionLabel="Sudah Diantar"
                />
              </div>
            </section>
          ) : null}


          {activeKey === "settings" ? (
            <section className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Panel Pengaturan</p>
                <h2 className="text-xl font-semibold text-gray-700">Pengaturan Utama</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Pilih kategori di bawah untuk mengelola jadwal, pembayaran, notifikasi, akses, atau backup.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
                <aside className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm p-3 space-y-2">
                  {SETTINGS_SECTIONS.map((section) => {
                    const isSelected = section.key === activeSettingsSection;
                    return (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() => setActiveSettingsSection(section.key)}
                        className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition ${
                          isSelected
                            ? "bg-emerald-500 text-white shadow-lg"
                            : "text-gray-600 hover:bg-emerald-50"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-base ${
                            isSelected ? "text-white" : "text-emerald-500"
                          }`}
                        >
                          {section.icon}
                        </span>
                        <div className="space-y-1">
                          <p className={`text-sm font-semibold ${isSelected ? "text-white" : "text-gray-700"}`}>
                            {section.label}
                          </p>
                          <p className={`text-xs leading-snug ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                            {section.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </aside>

                <div className="space-y-6">
                  {saveMessage ? (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-600 shadow-sm">
                      {saveMessage}
                    </div>
                  ) : null}

                  {activeSettingsSection === "store" ? (
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Informasi Toko</p>
                          <h3 className="text-lg font-semibold text-gray-700">Profil & Kontak</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Perbarui identitas toko yang tampil di menu digital dan struk pembayaran.
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">storefront</span>
                      </div>
                      <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="store-name" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Nama Toko
                          </label>
                          <input
                            id="store-name"
                            name="name"
                            type="text"
                            value={settings.store.name}
                            onChange={handleStoreFieldChange}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="Contoh: SPM Café"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="store-tagline" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Tagline
                          </label>
                          <input
                            id="store-tagline"
                            name="tagline"
                            type="text"
                            value={settings.store.tagline}
                            onChange={handleStoreFieldChange}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="Cita rasa lokal, suasana nyaman."
                          />
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                          <label htmlFor="store-description" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Deskripsi Singkat
                          </label>
                          <textarea
                            id="store-description"
                            name="description"
                            value={settings.store.description}
                            onChange={handleStoreFieldChange}
                            rows={3}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="Ceritakan konsep café dan layanan unggulan Anda."
                          />
                        </div>
                        <div className="space-y-2 lg:col-span-2">
                          <label htmlFor="store-address" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Alamat Lengkap
                          </label>
                          <textarea
                            id="store-address"
                            name="address"
                            value={settings.store.address}
                            onChange={handleStoreFieldChange}
                            rows={2}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="Tuliskan alamat lengkap untuk memudahkan kurir dan pelanggan."
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="store-phone" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Nomor WhatsApp
                          </label>
                          <input
                            id="store-phone"
                            name="phone"
                            type="tel"
                            value={settings.store.phone}
                            onChange={handleStoreFieldChange}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="+62 ..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="store-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Email Operasional
                          </label>
                          <input
                            id="store-email"
                            name="email"
                            type="email"
                            value={settings.store.email}
                            onChange={handleStoreFieldChange}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="admin@spmcafe.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="store-instagram" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Instagram
                          </label>
                          <input
                            id="store-instagram"
                            name="instagram"
                            type="text"
                            value={settings.store.instagram}
                            onChange={handleStoreFieldChange}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="@spmcafe"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="store-wifi" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Nama Wi-Fi
                          </label>
                          <input
                            id="store-wifi"
                            name="wifiName"
                            type="text"
                            value={settings.store.wifiName}
                            onChange={handleStoreFieldChange}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="SPM-Cafe"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="store-wifi-password" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Password Wi-Fi
                          </label>
                          <input
                            id="store-wifi-password"
                            name="wifiPassword"
                            type="text"
                            value={settings.store.wifiPassword}
                            onChange={handleStoreFieldChange}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            placeholder="*******"
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeSettingsSection === "hours" ? (
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Jam Operasional</p>
                          <h3 className="text-lg font-semibold text-gray-700">Jadwal Layanan</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Atur jam buka harian agar pesanan online mengikuti waktu operasional Anda.
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">schedule</span>
                      </div>
                      <div className="mt-6 grid gap-3">
                        {settings.hours.map((entry, index) => (
                          <div
                            key={entry.day}
                            className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-700">{entry.day}</p>
                              <p className="text-xs text-gray-500">
                                {entry.closed ? "Tutup sepanjang hari" : "Atur jam operasional"}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                  checked={entry.closed}
                                  onChange={(event) => handleHourChange(index, "closed", event.target.checked)}
                                />
                                Tutup
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={entry.open}
                                  disabled={entry.closed}
                                  onChange={(event) => handleHourChange(index, "open", event.target.value)}
                                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:text-gray-400"
                                />
                                <span className="text-xs text-gray-400">s/d</span>
                                <input
                                  type="time"
                                  value={entry.close}
                                  disabled={entry.closed}
                                  onChange={(event) => handleHourChange(index, "close", event.target.value)}
                                  className="rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:text-gray-400"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeSettingsSection === "payment" ? (
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Pembayaran</p>
                          <h3 className="text-lg font-semibold text-gray-700">Metode & Biaya</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Kelola preferensi pembayaran agar kasir dan pelanggan lebih terarah.
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">credit_card</span>
                      </div>
                      <div className="mt-6 space-y-4">
                        <div className="grid gap-3">
                          <div className="space-y-2">
                            <label htmlFor="payment-qris-name" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Nama Merchant QRIS
                            </label>
                            <input
                              id="payment-qris-name"
                              type="text"
                              value={settings.payment.qrisMerchantName}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  payment: { ...prev.payment, qrisMerchantName: event.target.value },
                                }))
                              }
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="payment-qris-id" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              ID Merchant / QRIS
                            </label>
                            <input
                              id="payment-qris-id"
                              type="text"
                              value={settings.payment.qrisId}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  payment: { ...prev.payment, qrisId: event.target.value },
                                }))
                              }
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="payment-bank-name" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Nama Bank
                            </label>
                            <input
                              id="payment-bank-name"
                              type="text"
                              value={settings.payment.bankName}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  payment: { ...prev.payment, bankName: event.target.value },
                                }))
                              }
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="payment-bank-account" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Nomor Rekening
                            </label>
                            <input
                              id="payment-bank-account"
                              type="text"
                              value={settings.payment.bankAccountNumber}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  payment: { ...prev.payment, bankAccountNumber: event.target.value },
                                }))
                              }
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            { field: "cashEnabled" as const, label: "Terima Tunai" },
                            { field: "cardEnabled" as const, label: "Terima Kartu/Debit" },
                            { field: "autoConfirmQris" as const, label: "Otomatis Konfirmasi QRIS" },
                          ].map((item) => (
                            <label
                              key={item.field}
                              className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-gray-600"
                            >
                              {item.label}
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                checked={settings.payment[item.field]}
                                onChange={() => togglePaymentField(item.field)}
                              />
                            </label>
                          ))}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label htmlFor="payment-service-charge" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Service Charge (%)
                            </label>
                            <input
                              id="payment-service-charge"
                              type="number"
                              min={0}
                              value={settings.payment.serviceCharge}
                              onChange={(event) => handlePaymentNumberChange("serviceCharge", event)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="payment-tax-rate" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Pajak (%)
                            </label>
                            <input
                              id="payment-tax-rate"
                              type="number"
                              min={0}
                              value={settings.payment.taxRate}
                              onChange={(event) => handlePaymentNumberChange("taxRate", event)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeSettingsSection === "notifications" ? (
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Notifikasi</p>
                          <h3 className="text-lg font-semibold text-gray-700">Pemberitahuan & Laporan</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Atur siapa yang menerima notifikasi pesanan dan ringkasan operasional.
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">notifications_active</span>
                      </div>

                      <div className="mt-6 space-y-4">
                        {[
                          {
                            field: "newOrder" as const,
                            title: "Pesanan Baru",
                            description: "Notifikasi real-time saat pesanan dari QRIS berhasil masuk.",
                          },
                          {
                            field: "lowStock" as const,
                            title: "Stok Hampir Habis",
                            description: "Terima peringatan ketika stok bahan baku mencapai batas minimum.",
                          },
                          {
                            field: "staffSchedule" as const,
                            title: "Pengingat Jadwal Staff",
                            description: "Kirim pengingat jadwal shift ke grup WhatsApp staff.",
                          },
                          {
                            field: "sound" as const,
                            title: "Bunyikan Bel",
                            description: "Putar suara notifikasi di perangkat kasir untuk setiap order baru.",
                          },
                        ].map((item) => (
                          <label
                            key={item.field}
                            className="flex items-start justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-700">{item.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                            </div>
                            <input
                              type="checkbox"
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              checked={settings.notifications[item.field]}
                              onChange={() => handleNotificationToggle(item.field)}
                            />
                          </label>
                        ))}

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label htmlFor="notification-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Email Laporan
                            </label>
                            <input
                              id="notification-email"
                              name="email"
                              type="email"
                              value={settings.notifications.email}
                              onChange={handleNotificationContactChange}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="notification-whatsapp" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Nomor WhatsApp
                            </label>
                            <input
                              id="notification-whatsapp"
                              name="whatsapp"
                              type="tel"
                              value={settings.notifications.whatsapp}
                              onChange={handleNotificationContactChange}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400">
                          Email harian dikirim pukul 22.00 WIB · Pesan WhatsApp akan diteruskan otomatis.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {activeSettingsSection === "access" ? (
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Tim Admin</p>
                          <h3 className="text-lg font-semibold text-gray-700">Akses Pengguna</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Kelola siapa saja yang memiliki akses ke dashboard admin dan pantau aktivitasnya.
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">group</span>
                      </div>

                      <div className="mt-6 space-y-4">
                        {settings.adminAccounts.map((account) => (
                          <div
                            key={account.email}
                            className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-700">{account.name}</p>
                              <p className="text-xs text-gray-500">
                                {account.email} {account.phone ? `· ${account.phone}` : ""}
                              </p>
                              <p className="text-xs text-gray-400">Terakhir aktif: {account.lastLogin}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-600">
                                {account.role}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  account.status === "active"
                                    ? "bg-emerald-100 text-emerald-600 border border-emerald-100"
                                    : "bg-amber-100 text-amber-600 border border-amber-100"
                                }`}
                              >
                                {account.status === "active" ? "Aktif" : "Menunggu"}
                              </span>
                              {account.role !== "Pemilik" ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdmin(account.email)}
                                  className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 transition"
                                  aria-label={`Hapus admin ${account.name}`}
                                >
                                  Hapus
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4">
                        <p className="text-sm font-semibold text-gray-700">Undang Admin Baru</p>
                        <p className="text-xs text-gray-500">
                          Kirim undangan ke email untuk memberikan akses dashboard. Undangan berlaku 24 jam.
                        </p>
                        <form onSubmit={handleAddAdminAccount} className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label htmlFor="invite-email" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Email Admin
                            </label>
                            <input
                              id="invite-email"
                              type="email"
                              value={newAdminEmail}
                              onChange={(event) => setNewAdminEmail(event.target.value)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                              placeholder="nama@perusahaan.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="invite-phone" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Nomor WhatsApp (opsional)
                            </label>
                            <input
                              id="invite-phone"
                              type="tel"
                              value={newAdminPhone}
                              onChange={(event) => setNewAdminPhone(event.target.value)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                              placeholder="+62 ..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="invite-role" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Peran
                            </label>
                            <select
                              id="invite-role"
                              value={newAdminRole}
                              onChange={(event) =>
                                setNewAdminRole(event.target.value as (typeof ADMIN_ROLE_OPTIONS)[number])
                              }
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            >
                              {ADMIN_ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-end">
                            <button
                              type="submit"
                              className="w-full rounded-full bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition"
                            >
                              Kirim Undangan
                            </button>
                          </div>
                          {adminInviteError ? (
                            <p className="md:col-span-2 text-xs font-semibold text-red-500">{adminInviteError}</p>
                          ) : (
                            <p className="md:col-span-2 text-xs text-gray-400">
                              Admin baru akan diminta membuat kata sandi ketika menerima undangan.
                            </p>
                          )}
                        </form>
                      </div>
                    </div>
                  ) : null}

                  {activeSettingsSection === "backup" ? (
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm p-6 space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Pusat Backup</p>
                          <h3 className="text-lg font-semibold text-gray-700">Ekspor Laporan Penjualan</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Pilih rentang waktu dan format laporan, lalu unduh file secara instan.
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">cloud_download</span>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="backup-range" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Rentang Waktu
                          </label>
                          <select
                            id="backup-range"
                            value={backupRange}
                            onChange={handleBackupRangeChange}
                            className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          >
                            {BACKUP_RANGE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {isCustomRangeIncomplete ? (
                            <p className="text-xs text-amber-500">
                              Lengkapi tanggal mulai dan akhir sebelum mengunduh.
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Format File</p>
                          <div className="flex flex-wrap gap-3">
                            {[
                              {
                                key: "csv" as const,
                                label: "CSV",
                                caption: "Spreadsheet (.csv) untuk analisis detail",
                              },
                              {
                                key: "pdf" as const,
                                label: "PDF",
                                caption: "Ringkasan siap cetak (.pdf)",
                              },
                            ].map((option) => {
                              const checked = selectedExportFormats[option.key];
                              return (
                                <label key={option.key} className="cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={checked}
                                    onChange={() => toggleExportFormat(option.key)}
                                  />
                                  <div
                                    className={`rounded-xl border px-4 py-3 shadow-sm transition ${
                                      checked
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100"
                                        : "border-emerald-100 bg-white text-gray-600 hover:border-emerald-200"
                                    }`}
                                  >
                                    <p className="text-sm font-semibold">{option.label}</p>
                                    <p className="text-xs text-gray-400">{option.caption}</p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-xs text-gray-400">Pilih minimal satu format laporan.</p>
                        </div>
                      </div>

                      {backupRange === "custom" ? (
                        <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <label htmlFor="backup-custom-start" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Dari Tanggal
                            </label>
                            <input
                              id="backup-custom-start"
                              type="date"
                              value={customRangeStart}
                              max={customRangeEnd || undefined}
                              onChange={(event) => handleCustomRangeChange("start", event.target.value)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="backup-custom-end" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Hingga Tanggal
                            </label>
                            <input
                              id="backup-custom-end"
                              type="date"
                              value={customRangeEnd}
                              min={customRangeStart || undefined}
                              onChange={(event) => handleCustomRangeChange("end", event.target.value)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <p className="sm:col-span-2 text-xs text-gray-400">
                            Untuk performa terbaik, gunakan rentang maksimal 90 hari.
                          </p>
                        </div>
                      ) : null}

                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Pratinjau</p>
                        <h4 className="text-sm font-semibold text-gray-700 mt-1">Ringkasan Periode</h4>
                        <p className="text-xs text-gray-500 mt-2">
                          Periode: <span className="font-semibold text-gray-700">{previewSummary.periodLabel}</span>
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-emerald-100 bg-white/70 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Total Transaksi</p>
                            <p className="mt-2 text-lg font-semibold text-gray-700">
                              {formatNumberID(previewSummary.totalOrders)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-emerald-100 bg-white/70 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Total Penjualan</p>
                            <p className="mt-2 text-lg font-semibold text-emerald-600">
                              {formatCurrencyIDR(previewSummary.totalRevenue)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-gray-500">
                          {isExportingBackup
                            ? "Menyiapkan laporan, mohon tunggu sebentar…"
                            : "Tekan tombol unduh untuk menghasilkan laporan."}
                        </div>
                        <button
                          type="button"
                          onClick={handleExportSalesBackup}
                          disabled={downloadDisabled}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {isExportingBackup ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                              Menyiapkan…
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-base">download</span>
                              Unduh Laporan
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {activeSettingsSection !== "backup" ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-400">
                        Perubahan disimpan otomatis di perangkat ini. Klik simpan untuk menandai konfigurasi final.
                      </p>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={handleResetSettings}
                          className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          Reset ke Default
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSettings}
                          className="rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-600 transition"
                        >
                          Simpan Perubahan
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>
      </div>
      {showClearConfirm || pendingToggleSlug ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 p-6 shadow-xl space-y-4">
            {showClearConfirm ? (
              <>
                <p className="text-sm font-semibold text-gray-800">Hapus semua riwayat pesanan?</p>
                <p className="text-xs text-gray-500">
                  Tindakan ini akan mengosongkan daftar pesanan. Data dapat hilang secara permanen.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    Batalkan
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-600"
                    onClick={() => {
                      clearOrders();
                      setShowClearConfirm(false);
                    }}
                  >
                    Hapus
                  </button>
                </div>
              </>
            ) : null}

            {pendingToggleSlug ? (
              <>
                <p className="text-sm font-semibold text-gray-800">Nonaktifkan QR meja?</p>
                <p className="text-xs text-gray-500">
                  Pelanggan tidak akan bisa memesan melalui QR meja ini sampai diaktifkan lagi.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                    onClick={() => setPendingToggleSlug(null)}
                  >
                    Batalkan
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-600"
                    onClick={() => {
                      handleToggleTable(pendingToggleSlug);
                      setPendingToggleSlug(null);
                    }}
                  >
                    Nonaktifkan
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
