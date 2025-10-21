"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useAuth } from "@/lib/authStore";
import { useOrders } from "@/lib/orderStore";
import { formatTableLabel } from "@/lib/tables";
import { PRODUCT_CATALOG } from "@/lib/products";
import { getAdminAccountsForSettings } from "@/lib/adminUsers";
import type { ChangeEvent } from "react";

type AdminNavKey = "dashboard" | "cashier" | "products" | "tables" | "kitchen" | "settings";

const NAV_ITEMS: Array<{ key: AdminNavKey; label: string; icon: string }> = [
  { key: "dashboard", label: "Ringkasan", icon: "space_dashboard" },
  { key: "cashier", label: "Kasir", icon: "point_of_sale" },
  { key: "products", label: "Produk", icon: "coffee" },
  { key: "tables", label: "Meja", icon: "table_restaurant" },
  { key: "kitchen", label: "Kitchen", icon: "receipt_long" },
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

type AdminAccount = {
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "active" | "pending" | "inactive";
  lastLogin: string;
};

const ADMIN_STATUS_META: Record<
  AdminAccount["status"],
  { label: string; className: string }
> = {
  active: {
    label: "Aktif",
    className: "bg-emerald-100 text-emerald-600",
  },
  inactive: {
    label: "Nonaktif",
    className: "bg-gray-100 text-gray-500",
  },
  pending: {
    label: "Menunggu",
    className: "bg-amber-100 text-amber-600",
  },
};

function computeInitials(source: string | undefined, fallback = "AD") {
  if (!source) {
    return fallback;
  }
  const initials = source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || fallback;
}

type PaymentAudienceOptions = {
  qrisEnabled: boolean;
  shopeePayEnabled: boolean;
  goPayEnabled: boolean;
  ovoEnabled: boolean;
  danaEnabled: boolean;
};

type CashierPaymentOptions = {
  qrisEnabled: boolean;
  cashEnabled: boolean;
  cardEnabled: boolean;
};

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
    bankAccountName: string;
    bankAccountNumber: string;
    user: PaymentAudienceOptions;
    cashier: CashierPaymentOptions;
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
    lowStockThreshold: number;
    staffScheduleReminderTime: number;
    staffScheduleGroupLink: string;
  };
  adminAccounts: Array<AdminAccount>;
};

type ProductCategory = string;

type ProductFormState = {
  name: string;
  category: ProductCategory;
  price: string;
  description: string;
  sku: string;
  imageUrl: string;
  imagePreviewUrl: string | null;
  highlight: string;
  isAvailable: boolean;
  isFeatured: boolean;
  soldOut: boolean;
  hotOption: boolean;
  icedOption: boolean;
  prepTime: string;
  calories: string;
  customizations: CustomizationGroup[];
};

type AdminProductRecord = {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  sku: string;
  imageUrl: string;
  highlight: string;
  isAvailable: boolean;
  isFeatured: boolean;
  soldOut: boolean;
  hotOption: boolean;
  icedOption: boolean;
  prepTime: string;
  calories: string;
  createdAt: string;
  customizations: CustomizationGroup[];
};

type CustomizationGroup = {
  id: string;
  name: string;
  type: "single" | "multiple";
  required: boolean;
  helperText?: string;
  options: CustomizationOption[];
};

type CustomizationOption = {
  id: string;
  label: string;
  priceAdjustment: number;
};

const SAMPLE_PRODUCTS: AdminProductRecord[] = [
  {
    id: "sample-pistachio-latte",
    name: "Pistachio Latte",
    category: "pistachio-series",
    price: 55000,
    description: "Creme pistachio dengan espresso signature.",
    sku: "PST-001",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBZ6c9w2xX2kDiuabOBwANz7uF-RlHvb5-M45NrSbvbnLTN0ftsnUf9HjJjqVLAMgwSw17xI3Sn_IZjdUflf7rw0sirs6pcbq5URj0mrYxoQ0vNq0id-53cCFRtlLzkt2CTGyG76CiADHW5eyOmhGQEhylw2Qr_VvQX_VE1XtDjNtUVz3-bzG4UJ8pzBjGFuQdmgfl30oK1TbN4_4Y5W-6-5Qp7cp5gxpA-GgvnakgO3Jdlr1a0slJMrdPqZXsomuhiHkaRET7IJqM",
    highlight: "Best seller pistachio series",
    isAvailable: true,
    isFeatured: true,
    soldOut: false,
    hotOption: true,
    icedOption: true,
    prepTime: "7",
    calories: "320",
    createdAt: new Date().toISOString(),
    customizations: [
      {
        id: "sample-size",
        name: "Ukuran",
        type: "single",
        required: true,
        helperText: "Pilih ukuran cup",
        options: [
          { id: "size-small", label: "Small", priceAdjustment: -3000 },
          { id: "size-regular", label: "Regular", priceAdjustment: 0 },
          { id: "size-large", label: "Large", priceAdjustment: 5000 },
        ],
      },
      {
        id: "sample-topping",
        name: "Tambahan",
        type: "multiple",
        required: false,
        helperText: "Boleh pilih lebih dari satu",
        options: [
          { id: "top-cream", label: "Whipped Cream", priceAdjustment: 5000 },
          { id: "top-caramel", label: "Caramel Drizzle", priceAdjustment: 5000 },
        ],
      },
    ],
  },
  {
    id: "sample-matcha-frappe",
    name: "Matcha Frappe",
    category: "matcha-club",
    price: 52500,
    description: "Matcha premium dengan tekstur creamy dingin.",
    sku: "MTC-002",
    imageUrl: "/images/products/matcha-frappe.jpg",
    highlight: "Blend matcha favorit pelanggan",
    isAvailable: true,
    isFeatured: false,
    soldOut: false,
    hotOption: false,
    icedOption: true,
    prepTime: "5",
    calories: "290",
    createdAt: new Date().toISOString(),
    customizations: [
      {
        id: "sample-matcha-ice",
        name: "Level Es",
        type: "single",
        required: true,
        options: [
          { id: "ice-less", label: "Less Ice", priceAdjustment: 0 },
          { id: "ice-normal", label: "Normal", priceAdjustment: 0 },
          { id: "ice-extra", label: "Extra Ice", priceAdjustment: 0 },
        ],
      },
    ],
  },
  {
    id: "sample-ethiopia-yirgacheffe",
    name: "Ethiopia Yirgacheffe",
    category: "master-soe-series",
    price: 150000,
    description: "Single origin dengan notes fruity & floral.",
    sku: "SOE-ETH",
    imageUrl: "/images/products/ethiopia-yirgacheffe.jpg",
    highlight: "Limited roast mingguan",
    isAvailable: true,
    isFeatured: true,
    soldOut: false,
    hotOption: true,
    icedOption: false,
    prepTime: "4",
    calories: "5",
    createdAt: new Date().toISOString(),
    customizations: [],
  },
];

const PRODUCTS_STORAGE_KEY = "spm-admin-products";
const CUSTOMIZATION_TEMPLATES: Array<{
  key: string;
  label: string;
  description: string;
  group: Omit<CustomizationGroup, "id">;
}> = [
  {
    key: "size",
    label: "Template Ukuran",
    description: "Small / Regular / Large",
    group: {
      name: "Ukuran",
      type: "single",
      required: true,
      helperText: "Pilih ukuran cup",
      options: [
        { id: "", label: "Small", priceAdjustment: -3000 },
        { id: "", label: "Regular", priceAdjustment: 0 },
        { id: "", label: "Large", priceAdjustment: 5000 },
      ],
    },
  },
  {
    key: "ice",
    label: "Level Es",
    description: "No Ice / Less Ice / Normal / Extra Ice",
    group: {
      name: "Level Es",
      type: "single",
      required: true,
      helperText: "Sesuaikan preferensi es pelanggan",
      options: [
        { id: "", label: "No Ice", priceAdjustment: 0 },
        { id: "", label: "Less Ice", priceAdjustment: 0 },
        { id: "", label: "Normal", priceAdjustment: 0 },
        { id: "", label: "Extra Ice", priceAdjustment: 0 },
      ],
    },
  },
  {
    key: "sweetness",
    label: "Level Gula",
    description: "No Sugar / Less / Normal / Extra",
    group: {
      name: "Level Gula",
      type: "single",
      required: true,
      helperText: "Bantu pelanggan mengatur kadar gula",
      options: [
        { id: "", label: "No Sugar", priceAdjustment: 0 },
        { id: "", label: "Less Sugar", priceAdjustment: 0 },
        { id: "", label: "Normal", priceAdjustment: 0 },
        { id: "", label: "Extra Sugar", priceAdjustment: 0 },
      ],
    },
  },
  {
    key: "topping",
    label: "Topping Favorit",
    description: "Boba / Extra Shot / Whipped Cream",
    group: {
      name: "Tambahan",
      type: "multiple",
      required: false,
      helperText: "Boleh pilih lebih dari satu",
      options: [
        { id: "", label: "Boba", priceAdjustment: 8000 },
        { id: "", label: "Extra Shot", priceAdjustment: 10000 },
        { id: "", label: "Whipped Cream", priceAdjustment: 5000 },
        { id: "", label: "Caramel Drizzle", priceAdjustment: 5000 },
      ],
    },
  },
];

function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_CATEGORY_OPTIONS = Object.keys(PRODUCT_CATALOG).filter((key) => key !== "all");
const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  "pistachio-series": "local_cafe",
  "matcha-club": "spa",
  "master-soe-series": "coffee_maker",
  merchandise: "shopping_bag",
};

const CATEGORY_ICON_CHOICES = [
  "local_cafe",
  "coffee",
  "coffee_maker",
  "restaurant",
  "restaurant_menu",
  "bakery_dining",
  "brunch_dining",
  "ramen_dining",
  "soup_kitchen",
  "emoji_food_beverage",
  "blender",
  "cookie",
  "cake",
  "icecream",
  "lunch_dining",
  "breakfast_dining",
  "dinner_dining",
  "nutrition",
  "egg_alt",
  "water_drop",
  "energy_savings_leaf",
  "spa",
  "local_dining",
  "rice_bowl",
  "takeout_dining",
  "fastfood",
  "delivery_dining",
  "outdoor_grill",
  "kebab_dining",
  "set_meal",
  "local_bar",
  "wine_bar",
  "liquor",
  "local_drink",
  "sports_bar",
];

const CATEGORIES_STORAGE_KEY = "spm-admin-categories";
const CATEGORIES_STORAGE_VERSION = 2;
const DEFAULT_NEW_CATEGORY_ICON = CATEGORY_ICON_CHOICES[0];
const ALLOWED_CATEGORY_ICON_SET = new Set([...CATEGORY_ICON_CHOICES, ...Object.values(DEFAULT_CATEGORY_ICONS)]);

function normalizeCategoryIcon(rawIcon: string | undefined, slug?: string) {
  const trimmed = rawIcon?.trim() ?? "";
  if (trimmed && ALLOWED_CATEGORY_ICON_SET.has(trimmed)) {
    return trimmed;
  }
  if (slug && DEFAULT_CATEGORY_ICONS[slug]) {
    return DEFAULT_CATEGORY_ICONS[slug];
  }
  return DEFAULT_NEW_CATEGORY_ICON;
}

function slugifyCategoryName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveCategoryIcon(slug: string, icons: Record<string, string>) {
  return icons[slug] ?? DEFAULT_CATEGORY_ICONS[slug] ?? "category";
}

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
    bankName: "BCA",
    bankAccountName: "SPM Café",
    bankAccountNumber: "1234567890",
    user: {
      qrisEnabled: true,
      shopeePayEnabled: false,
      goPayEnabled: false,
      ovoEnabled: false,
      danaEnabled: false,
    },
    cashier: {
      qrisEnabled: true,
      cashEnabled: true,
      cardEnabled: true,
    },
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
    lowStockThreshold: 500,
    staffScheduleReminderTime: 1,
    staffScheduleGroupLink: "",
  },
  adminAccounts: getAdminAccountsForSettings(),
};

type LegacyPaymentSettings = Partial<AdminSettings["payment"]> & {
  cashEnabled?: boolean;
  cardEnabled?: boolean;
  qrisEnabled?: boolean;
  shopeePayEnabled?: boolean;
  goPayEnabled?: boolean;
  ovoEnabled?: boolean;
  danaEnabled?: boolean;
};

function normalizePaymentSettings(
  stored?: Partial<AdminSettings["payment"]> | null
): AdminSettings["payment"] {
  const base = DEFAULT_ADMIN_SETTINGS.payment;
  const legacy: LegacyPaymentSettings = stored ?? {};
  const {
    cashEnabled: legacyCashEnabled,
    cardEnabled: legacyCardEnabled,
    qrisEnabled: legacyQrisEnabled,
    shopeePayEnabled: legacyShopeePayEnabled,
    goPayEnabled: legacyGoPayEnabled,
    ovoEnabled: legacyOvoEnabled,
    danaEnabled: legacyDanaEnabled,
    user: storedUser,
    cashier: storedCashier,
    ...rest
  } = legacy ?? {};
  const normalized: AdminSettings["payment"] = {
    ...base,
    ...rest,
    user: {
      ...base.user,
      ...(storedUser ?? {}),
    },
    cashier: {
      ...base.cashier,
      ...(storedCashier ?? {}),
    },
  };

  // Backward compatibility for legacy flat flags
  if (typeof legacyCashEnabled === "boolean") {
    normalized.cashier.cashEnabled = legacyCashEnabled;
  }
  if (typeof legacyCardEnabled === "boolean") {
    normalized.cashier.cardEnabled = legacyCardEnabled;
  }
  if (typeof legacyQrisEnabled === "boolean") {
    normalized.cashier.qrisEnabled = legacyQrisEnabled;
    normalized.user.qrisEnabled = legacyQrisEnabled;
  }
  if (typeof legacyShopeePayEnabled === "boolean") {
    normalized.user.shopeePayEnabled = legacyShopeePayEnabled;
  }
  if (typeof legacyGoPayEnabled === "boolean") {
    normalized.user.goPayEnabled = legacyGoPayEnabled;
  }
  if (typeof legacyOvoEnabled === "boolean") {
    normalized.user.ovoEnabled = legacyOvoEnabled;
  }
  if (typeof legacyDanaEnabled === "boolean") {
    normalized.user.danaEnabled = legacyDanaEnabled;
  }

  return normalized;
}

function createDefaultSettings(): AdminSettings {
  return {
    store: { ...DEFAULT_ADMIN_SETTINGS.store },
    hours: DEFAULT_ADMIN_SETTINGS.hours.map((entry) => ({ ...entry })),
    payment: normalizePaymentSettings(null),
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
          status: account.status || "inactive",
        }))
      : DEFAULT_ADMIN_SETTINGS.adminAccounts.map((entry) => ({ ...entry }));

  return {
    store: { ...DEFAULT_ADMIN_SETTINGS.store, ...(stored.store ?? {}) },
    hours: mergedHours,
    payment: normalizePaymentSettings(stored.payment),
    notifications: { ...DEFAULT_ADMIN_SETTINGS.notifications, ...(stored.notifications ?? {}) },
    adminAccounts: mergedAccounts,
  };
}

function createEmptyProductForm(): ProductFormState {
  return {
    name: "",
    category: "pistachio-series",
    price: "",
    description: "",
    sku: "",
    imageUrl: "",
    imagePreviewUrl: null,
    highlight: "",
    isAvailable: true,
    isFeatured: false,
    soldOut: false,
    hotOption: true,
    icedOption: true,
    prepTime: "",
    calories: "",
    customizations: [],
  };
}

function formatCategoryLabel(slug: string) {
  return slug
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}


type SettingsSectionKey =
  | "store"
  | "categories"
  | "hours"
  | "payment"
  | "notifications"
  | "access";

const SETTINGS_SECTIONS: Array<{
  key: SettingsSectionKey;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: "store",
    label: "Informasi Toko",
    description: "Profil & kontak bisnis Anda",
    icon: "storefront",
  },
  {
    key: "categories",
    label: "Kategori Produk",
    description: "Atur daftar & ikon menu",
    icon: "category",
  },
  {
    key: "hours",
    label: "Jam Operasional",
    description: "Atur jadwal buka toko",
    icon: "schedule",
  },
  {
    key: "payment",
    label: "Pembayaran",
    description: "Metode & biaya transaksi",
    icon: "credit_card",
  },
  {
    key: "notifications",
    label: "Notifikasi",
    description: "Pengaturan pemberitahuan",
    icon: "notifications_active",
  },
  {
    key: "access",
    label: "Akses Pengguna",
    description: "Kelola tim admin",
    icon: "group",
  },
];

// Daftar bank umum di Indonesia untuk dropdown
const BANK_OPTIONS: string[] = [
  "BCA",
  "Mandiri",
  "BRI",
  "BNI",
  "CIMB Niaga",
  "Permata",
  "Danamon",
  "BTN",
  "BSI",
  "OCBC NISP",
  "Maybank",
  "BJB",
  "Bank Jatim",
  "Bank Jateng",
  "Bank Mega",
  "Jago",
  "SeaBank",
  "Neo Commerce",
  "Allo Bank",
];
function formatCurrencyIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPriceAdjustment(amount: number): string {
  if (!amount) {
    return "+Rp 0";
  }
  const formatted = formatCurrencyIDR(Math.abs(amount));
  return amount > 0 ? `+${formatted}` : `-${formatted}`;
}

function formatTableCode(index: number): string {
  return `M-${index.toString().padStart(2, "0")}`;
}

function formatTableName(index: number): string {
  return `Meja ${index.toString().padStart(2, "0")}`;
}

async function generateTableEntry(index: number, origin: string, active = true): Promise<TableEntry> {
  const slug = formatTableCode(index);
  const url = `${origin}/menu?cards=${slug}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: "#059669",
      light: "#ffffff",
    },
  });
  return {
    id: index,
    name: formatTableName(index),
    slug,
    url,
    qrDataUrl,
    active,
  };
}

function OrderListSection({
  title,
  description,
  orders,
  onMarkServed,
  actionLabel,
}: OrderListSectionProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-white/70 shadow-sm p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{title}</p>
        <p className="text-sm text-gray-500 mt-2">{description}</p>
        <p className="text-sm text-gray-400 mt-4">Belum ada pesanan dalam kategori ini.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/70 shadow-sm p-6 space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Pesanan #{order.id.slice(0, 8)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTableLabel(order.tableId)} · {new Date(order.createdAt).toLocaleString('id-ID', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <span className="text-sm font-semibold text-emerald-600">
                {order.totalLabel}
              </span>
            </div>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-gray-500">{item.linePriceLabel}</span>
                </div>
              ))}
            </div>
            {onMarkServed && order.status !== "served" && (
              <button
                type="button"
                onClick={() => onMarkServed(order.id)}
                className="w-full rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-600 transition"
              >
                {actionLabel}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isReady, logout } = useAuth();
  const displayName = user?.name ?? "Admin";
  const displayEmail = user?.email ?? "admin@spmcafe.id";
  const avatarColor = user?.avatarColor ?? "#34d399";
  const avatarInitials = user?.avatarInitials ?? computeInitials(displayName);
  const { orders, markServed, clearOrders } = useOrders();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [activeKey, setActiveKey] = useState<AdminNavKey>("dashboard");
  const [tables, setTables] = useState<TableEntry[]>([]);
  const [isGeneratingTable, setIsGeneratingTable] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [pendingToggleSlug, setPendingToggleSlug] = useState<string | null>(null);
  const [pendingDeleteTable, setPendingDeleteTable] = useState<TableEntry | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(() => createDefaultSettings());
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savedSettings, setSavedSettings] = useState<AdminSettings | null>(null);
  const [savedAdminAccounts, setSavedAdminAccounts] = useState<AdminAccount[]>([]);
  const [pendingSave, setPendingSave] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] =
    useState<SettingsSectionKey>("store");
  const settingsHydratedRef = useRef(false);
  const [showLowStockConfig, setShowLowStockConfig] = useState(false);
  const [showStaffScheduleConfig, setShowStaffScheduleConfig] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState<ProductFormState>(() => createEmptyProductForm());
  const [products, setProducts] = useState<AdminProductRecord[]>(SAMPLE_PRODUCTS);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productSubmitStatus, setProductSubmitStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCategoryDeleteMode, setIsCategoryDeleteMode] = useState(false);

  const isEditingProduct = Boolean(editingProductId);

  const [categoryOptions, setCategoryOptions] = useState<string[]>(() => [...DEFAULT_CATEGORY_OPTIONS]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>(() => ({ ...DEFAULT_CATEGORY_ICONS }));
  const [savedCategoryOptions, setSavedCategoryOptions] = useState<string[]>(() => [...DEFAULT_CATEGORY_OPTIONS]);
  const [savedCategoryIcons, setSavedCategoryIcons] = useState<Record<string, string>>(() => ({ ...DEFAULT_CATEGORY_ICONS }));
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState(DEFAULT_NEW_CATEGORY_ICON);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const fallbackCategory = categoryOptions[0] ?? "pistachio-series";
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }),
    []
  );
  const formattedPricePreview = useMemo(() => {
    const numeric = Number(productForm.price || 0);
    if (!numeric) {
      return "Rp 0";
    }
    return currencyFormatter.format(numeric);
  }, [productForm.price, currencyFormatter]);
  const productImagePreview = productForm.imagePreviewUrl || productForm.imageUrl || "";

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoadingProducts(false);
      return;
    }

    const mergedOptions = [...DEFAULT_CATEGORY_OPTIONS];
    const mergedIcons: Record<string, string> = { ...DEFAULT_CATEGORY_ICONS };

    const ensureCategory = (slug: string, icon?: string) => {
      if (!slug) {
        return;
      }
      const normalized = slugifyCategoryName(slug);
      if (!normalized) {
        return;
      }
      if (!mergedOptions.includes(normalized)) {
        mergedOptions.push(normalized);
      }
      const resolvedIcon = normalizeCategoryIcon(icon, normalized);
      mergedIcons[normalized] = resolvedIcon;
    };

    let resolvedProducts: AdminProductRecord[] = SAMPLE_PRODUCTS;

    try {
      const storedCategoriesRaw = window.localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (storedCategoriesRaw) {
        try {
          const parsed = JSON.parse(storedCategoriesRaw);
          if (Array.isArray(parsed)) {
            parsed.forEach((entry) => {
              if (typeof entry === "string") {
                ensureCategory(entry);
              } else if (entry && typeof entry === "object") {
                const candidate = entry as { slug?: unknown; icon?: unknown };
                const slug = typeof candidate.slug === "string" ? candidate.slug : "";
                const icon = typeof candidate.icon === "string" ? candidate.icon : undefined;
                ensureCategory(slug, icon);
              }
            });
          } else if (parsed && typeof parsed === "object") {
            const storedEntries: unknown[] = Array.isArray(parsed.categories)
              ? parsed.categories
              : [];
            const iconOverrides =
              parsed.icons && typeof parsed.icons === "object"
                ? (parsed.icons as Record<string, unknown>)
                : {};

            storedEntries.forEach((entry) => {
              if (typeof entry === "string") {
                const override =
                  typeof iconOverrides[entry] === "string" ? iconOverrides[entry] : undefined;
                ensureCategory(entry, override);
              } else if (entry && typeof entry === "object") {
                const candidate = entry as { slug?: unknown; icon?: unknown };
                const slug = typeof candidate.slug === "string" ? candidate.slug : "";
                const legacyIcon = typeof candidate.icon === "string" ? candidate.icon : undefined;
                const override =
                  typeof iconOverrides[slug] === "string" ? iconOverrides[slug] : legacyIcon;
                ensureCategory(slug, override);
              }
            });

            Object.entries(iconOverrides).forEach(([slug, icon]) => {
              if (typeof slug === "string" && typeof icon === "string") {
                ensureCategory(slug, icon);
              }
            });
          }
        } catch (error) {
          console.warn("Gagal parsing kategori dari localStorage", error);
        }
      }

      const storedProducts = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (storedProducts) {
        const parsedProducts = JSON.parse(storedProducts) as AdminProductRecord[];
        if (Array.isArray(parsedProducts) && parsedProducts.length > 0) {
          resolvedProducts = parsedProducts;
        }
      }
    } catch (error) {
      console.error("Failed to load stored products", error);
    }

    resolvedProducts = resolvedProducts.map((item) => {
      ensureCategory(item.category);
      return {
        ...item,
        soldOut: Boolean(item.soldOut),
      };
    });

    const uniqueOptions = Array.from(new Set(mergedOptions));
    const iconSnapshot = { ...mergedIcons };

    setCategoryOptions(uniqueOptions);
    setCategoryIcons(iconSnapshot);
    setSavedCategoryOptions(uniqueOptions);
    setSavedCategoryIcons(iconSnapshot);
    setProducts(resolvedProducts);
    setIsLoadingProducts(false);
  }, []);

  useEffect(() => {
    if (isLoadingProducts) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
    } catch (error) {
      console.error("Failed to persist products", error);
    }
  }, [products, isLoadingProducts]);

  const resetProductForm = (options?: { keepStatus?: boolean }) => {
    setProductForm(createEmptyProductForm());
    setEditingProductId(null);
    if (!options?.keepStatus) {
      setProductSubmitStatus(null);
    }
  };

  const openAddProduct = () => {
    resetProductForm();
    setShowAddProduct(true);
  };

  const closeAddProduct = () => {
    resetProductForm();
    setShowAddProduct(false);
  };

  const openEditProduct = (product: AdminProductRecord) => {
    setProductSubmitStatus(null);
    const safeCategory = categoryOptions.includes(product.category)
      ? product.category
      : fallbackCategory;
    if (!categoryOptions.includes(safeCategory)) {
      setCategoryOptions((prev) => (prev.includes(safeCategory) ? prev : [...prev, safeCategory]));
    }
    setProductForm({
      name: product.name,
      category: safeCategory,
      price: String(product.price),
      description: product.description ?? "",
      sku: product.sku ?? "",
      imageUrl: product.imageUrl ?? "",
      imagePreviewUrl: product.imageUrl ? product.imageUrl : null,
      highlight: product.highlight ?? "",
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      soldOut: product.soldOut ?? false,
      hotOption: product.hotOption,
      icedOption: product.icedOption,
      prepTime: product.prepTime ?? "",
      calories: product.calories ?? "",
      customizations: (product.customizations ?? []).map((group) => ({
        ...group,
        options: group.options.map((option) => ({ ...option })),
      })),
    });
    setEditingProductId(product.id);
    setShowAddProduct(true);
  };

  const handleProductInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    if (name === "price") {
      const sanitized = value.replace(/[^\d]/g, "");
      setProductForm((prev) => ({ ...prev, price: sanitized }));
      return;
    }
    setProductForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "imageUrl"
        ? {
            imagePreviewUrl: value ? value : null,
          }
        : {}),
    }));
  };

  const handleProductSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value, name } = event.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: value as ProductCategory,
    }));
  };

  const handleProductCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setProductForm((prev) => {
      const updated = { ...prev, [name]: checked } as ProductFormState;
      if (name === "soldOut") {
        if (checked) {
          updated.isAvailable = false;
        }
      }
      return updated;
    });
  };

  const handleProductFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setProductForm((prev) => ({
        ...prev,
        imageUrl: "",
        imagePreviewUrl: null,
      }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setProductForm((prev) => ({
        ...prev,
        imageUrl: result,
        imagePreviewUrl: result || prev.imagePreviewUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const showCategoryMessage = (message: string, duration = 2000) => {
    setCategoryMessage(message);
    window.setTimeout(() => setCategoryMessage(null), duration);
  };

  const setCategoryIconValue = (slug: string, value: string | null | undefined) => {
    if (!slug) {
      return;
    }
    const normalizedIcon = normalizeCategoryIcon(value ?? "", slug);
    setCategoryIcons((prev) => {
      const next = { ...prev };
      next[slug] = normalizedIcon;
      return next;
    });
    setIsDirty(true);
  };

  const handleResetCategoryIcon = (slug: string) => {
    const fallbackIcon = DEFAULT_CATEGORY_ICONS[slug] ?? DEFAULT_NEW_CATEGORY_ICON;
    setCategoryIconValue(slug, fallbackIcon);
    showCategoryMessage(`Ikon kategori ${formatCategoryLabel(slug)} dikembalikan ke ikon awal.`, 2000);
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showCategoryMessage("Masukkan nama kategori terlebih dahulu.");
      return;
    }

    const slug = slugifyCategoryName(trimmed);
    if (!slug) {
      showCategoryMessage("Nama kategori tidak valid.");
      return;
    }

    const iconValue = newCategoryIcon.trim();
    const alreadyExists = categoryOptions.includes(slug);

    if (!alreadyExists) {
      setCategoryOptions((prev) => [...prev, slug]);
    }

    setCategoryIconValue(slug, iconValue);
    setProductForm((prev) => ({ ...prev, category: slug }));
    setNewCategoryName("");
    setNewCategoryIcon(DEFAULT_NEW_CATEGORY_ICON);
    setIsDirty(true);

    showCategoryMessage(
      alreadyExists
        ? `Ikon kategori ${formatCategoryLabel(slug)} diperbarui.`
        : `Kategori ${formatCategoryLabel(slug)} siap digunakan.`,
      2200
    );
  };

  const handleRemoveCategory = (slug: string) => {
    const nextOptions = categoryOptions.filter((item) => item !== slug);
    if (nextOptions.length === 0) {
      showCategoryMessage("Minimal harus ada satu kategori tersisa.");
      return;
    }

    const fallback = nextOptions[0];

    setCategoryOptions(nextOptions);
    setCategoryIcons((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    setProducts((prev) =>
      prev.map((product) => (product.category === slug ? { ...product, category: fallback } : product))
    );
    setProductForm((prev) => (prev.category === slug ? { ...prev, category: fallback } : prev));
    showCategoryMessage(`Kategori ${formatCategoryLabel(slug)} dihapus. Produk dipindahkan ke ${formatCategoryLabel(fallback)}.`, 2200);
    setIsDirty(true);
  };

  const handleCustomizationGroupUpdate = (
    groupId: string,
    updater: (group: CustomizationGroup) => CustomizationGroup
  ) => {
    setProductForm((prev) => ({
      ...prev,
      customizations: prev.customizations.map((group) =>
        group.id === groupId ? updater(group) : group
      ),
    }));
  };

  const handleGroupFieldChange = <K extends keyof CustomizationGroup>(
    groupId: string,
    field: K,
    value: CustomizationGroup[K]
  ) => {
    handleCustomizationGroupUpdate(groupId, (group) => ({
      ...group,
      [field]: value,
    }));
  };

  const handleOptionFieldChange = (
    groupId: string,
    optionId: string,
    field: keyof CustomizationOption,
    value: string
  ) => {
    handleCustomizationGroupUpdate(groupId, (group) => ({
      ...group,
      options: group.options.map((option) =>
        option.id === optionId
          ? {
              ...option,
              [field]: field === "priceAdjustment" ? Number(value || 0) : value,
            }
          : option
      ),
    }));
  };

  const handleOptionPriceInputChange = (
    groupId: string,
    optionId: string,
    rawValue: string
  ) => {
    let sanitized = rawValue.replace(/[^0-9-]/g, "");
    if (sanitized.startsWith("-")) {
      sanitized = "-" + sanitized.slice(1).replace(/[^0-9]/g, "");
    } else {
      sanitized = sanitized.replace(/[^0-9]/g, "");
    }

    const numeric = sanitized === "" || sanitized === "-" ? 0 : Number(sanitized);

    handleCustomizationGroupUpdate(groupId, (group) => ({
      ...group,
      options: group.options.map((option) =>
        option.id === optionId ? { ...option, priceAdjustment: numeric } : option
      ),
    }));
  };

  const handleRemoveOption = (groupId: string, optionId: string) => {
    handleCustomizationGroupUpdate(groupId, (group) => ({
      ...group,
      options: group.options.filter((option) => option.id !== optionId),
    }));
  };

  const handleAddOption = (groupId: string) => {
    handleCustomizationGroupUpdate(groupId, (group) => ({
      ...group,
      options: [
        ...group.options,
        {
          id: createId("opt"),
          label: `Pilihan ${group.options.length + 1}`,
          priceAdjustment: 0,
        },
      ],
    }));
  };

  const handleRemoveGroup = (groupId: string) => {
    setProductForm((prev) => ({
      ...prev,
      customizations: prev.customizations.filter((group) => group.id !== groupId),
    }));
  };

  const addEmptyCustomizationGroup = () => {
    setProductForm((prev) => ({
      ...prev,
      customizations: [
        ...prev.customizations,
        {
          id: createId("cst"),
          name: "Variasi Baru",
          type: "single",
          required: false,
          helperText: "",
          options: [
            { id: createId("opt"), label: "Pilihan 1", priceAdjustment: 0 },
            { id: createId("opt"), label: "Pilihan 2", priceAdjustment: 0 },
          ],
        },
      ],
    }));
  };

  const applyCustomizationTemplate = (templateKey: string) => {
    const template = CUSTOMIZATION_TEMPLATES.find((item) => item.key === templateKey);
    if (!template) {
      return;
    }
    const group: CustomizationGroup = {
      id: createId("cst"),
      ...template.group,
      options: template.group.options.map((option) => ({
        id: createId("opt"),
        label: option.label,
        priceAdjustment: option.priceAdjustment,
      })),
    };
    setProductForm((prev) => ({
      ...prev,
      customizations: [...prev.customizations, group],
    }));
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProductSubmitStatus(null);
    setIsSavingProduct(true);
    try {
      const parsedPrice = Number(productForm.price || 0);
      if (!parsedPrice || Number.isNaN(parsedPrice)) {
        throw new Error("Harga produk belum diisi dengan benar.");
      }

      const imageUrl = productForm.imageUrl.trim();
      if (!imageUrl) {
        throw new Error("Harap unggah atau isi URL gambar produk.");
      }

      const normalizedCustomizations = productForm.customizations.map((group) => ({
        ...group,
        options: group.options.map((option) => ({ ...option })),
      }));

      const baseProduct = {
        name: productForm.name.trim(),
        category: productForm.category,
        price: parsedPrice,
        description: productForm.description.trim(),
        sku: productForm.sku.trim(),
        imageUrl,
        highlight: productForm.highlight.trim(),
        isAvailable: productForm.soldOut ? false : productForm.isAvailable,
        isFeatured: productForm.isFeatured,
        soldOut: productForm.soldOut,
        hotOption: productForm.hotOption,
        icedOption: productForm.icedOption,
        prepTime: productForm.prepTime.trim(),
        calories: productForm.calories.trim(),
        customizations: normalizedCustomizations,
      };

      if (!categoryOptions.includes(baseProduct.category)) {
        setCategoryOptions((prev) => (prev.includes(baseProduct.category) ? prev : [...prev, baseProduct.category]));
      }

      if (editingProductId) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingProductId
              ? {
                  ...item,
                  ...baseProduct,
                  category: baseProduct.category,
                }
              : item
          )
        );
        setProductSubmitStatus({
          type: "success",
          message: "Perubahan produk tersimpan.",
        });
      } else {
        const newProduct: AdminProductRecord = {
          id: `prd_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
          ...baseProduct,
          createdAt: new Date().toISOString(),
        };
        setProducts((prev) => [newProduct, ...prev]);
        setProductSubmitStatus({
          type: "success",
          message: "Produk berhasil ditambahkan ke katalog.",
        });
        resetProductForm({ keepStatus: true });
      }
    } catch (error) {
      console.error("Product submission error", error);
      setProductSubmitStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan produk.",
      });
    } finally {
      setIsSavingProduct(false);
    }
  };

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
    setIsDirty(true);
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
    setIsDirty(true);
  };

  const toggleCashierPaymentField = (field: keyof CashierPaymentOptions) => {
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        cashier: {
          ...prev.payment.cashier,
          [field]: !prev.payment.cashier[field],
        },
      },
    }));
    setIsDirty(true);
  };

  const toggleUserPaymentField = (field: keyof PaymentAudienceOptions) => {
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        user: {
          ...prev.payment.user,
          [field]: !prev.payment.user[field],
        },
      },
    }));
    setIsDirty(true);
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
    setIsDirty(true);
  };

  const handleNotificationToggle = (field: "newOrder" | "lowStock" | "staffSchedule" | "sound") => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field],
      },
    }));
    setIsDirty(true);
  };

  const handlePaymentNumberChange = (
    field: "serviceCharge" | "taxRate",
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const parsedValue = Number(event.target.value);
    const safeValue = Number.isFinite(parsedValue)
      ? Math.max(0, Math.min(100, parsedValue))
      : 0;
    setSettings((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        [field]: safeValue,
      },
    }));
    setIsDirty(true);
  };

  const handleLowStockThresholdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        lowStockThreshold: isNaN(value) ? 0 : value,
      },
    }));
    setIsDirty(true);
  };

  const handleStaffScheduleReminderTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        staffScheduleReminderTime: isNaN(value) ? 0 : value,
      },
    }));
    setIsDirty(true);
  };

  const handleStaffScheduleGroupLinkChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        staffScheduleGroupLink: value,
      },
    }));
    setIsDirty(true);
  };

  useEffect(() => {
    if (!isReady) {
      return;
    }
    if (!isAdmin) {
      router.replace("/login");
    }
  }, [isAdmin, isReady, router]);

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
      setAdminAccounts(resolvedSettings.adminAccounts);
      setSavedSettings(resolvedSettings);
      setSavedAdminAccounts(resolvedSettings.adminAccounts);
      setIsDirty(false);
    } catch (error) {
      console.error("Failed to bootstrap settings", error);
      const fallback = createDefaultSettings();
      settingsHydratedRef.current = true;
      setSettings(fallback);
      setAdminAccounts(fallback.adminAccounts);
      setSavedSettings(fallback);
      setSavedAdminAccounts(fallback.adminAccounts);
      setIsDirty(false);
    }
  }, [isAdmin]);

  // Persist only when user clicks Save
  useEffect(() => {
    if (!pendingSave) return;
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ ...settings, adminAccounts }));

        const uniqueCategories = Array.from(new Set(categoryOptions));
        const payload = {
          version: CATEGORIES_STORAGE_VERSION,
          categories: uniqueCategories,
          icons: Object.fromEntries(
            uniqueCategories.map((slug) => [slug, resolveCategoryIcon(slug, categoryIcons)])
          ),
        };
        window.localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(payload));
        window.dispatchEvent(new Event("spm:categories-updated"));
        window.dispatchEvent(new Event("spm:payment-updated"));
      }
      setSavedSettings(settings);
      setSavedAdminAccounts(adminAccounts);
      setSavedCategoryOptions([...categoryOptions]);
      setSavedCategoryIcons({ ...categoryIcons });
      setIsDirty(false);
      setSaveMessage("Perubahan disimpan.");
      window.setTimeout(() => setSaveMessage(null), 2600);
    } catch (error) {
      console.error("Failed to persist settings", error);
    } finally {
      setPendingSave(false);
    }
  }, [pendingSave, settings, adminAccounts, categoryOptions, categoryIcons]);
  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let isMounted = true;

    const bootstrapTables = async () => {
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        let resolvedTables: TableEntry[];
        let storedEntries: Array<{ id: number; active: boolean }> | null = null;

        if (typeof window !== "undefined") {
          const stored = window.localStorage.getItem(TABLES_STORAGE_KEY);
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as Array<Partial<TableEntry>>;
              if (Array.isArray(parsed) && parsed.length > 0) {
                storedEntries = parsed
                  .map((entry, index) => ({
                    id: entry?.id ?? index + 1,
                    active: entry?.active !== false,
                  }))
                  .sort((a, b) => a.id - b.id);
              }
            } catch (error) {
              console.error("Failed to parse stored tables", error);
            }
          }
        }

        if (storedEntries) {
          resolvedTables = await Promise.all(
            storedEntries.map(({ id, active }) => generateTableEntry(id, origin, active))
          );
        } else {
          const defaultIndices = [1, 2, 3];
          resolvedTables = await Promise.all(
            defaultIndices.map((index) => generateTableEntry(index, origin))
          );
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(resolvedTables));
        }

        if (isMounted) {
          setTables(resolvedTables);
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

  const nextTableIndex = useMemo(
    () => tables.reduce((max, table) => Math.max(max, table.id), 0) + 1,
    [tables]
  );

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
        const next = [...prev, entry].sort((a, b) => a.id - b.id);
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

  const handleDeleteTable = (slug: string) => {
    setTables((prev) => {
      const next = prev.filter((entry) => entry.slug !== slug).sort((a, b) => a.id - b.id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TABLES_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  };
  const handleSaveAll = () => {
    if (!isDirty) return;
    setPendingSave(true);
  };

  const handleCancelAll = () => {
    if (!savedSettings) return;
    setSettings(savedSettings);
    setAdminAccounts(savedAdminAccounts);
    setCategoryOptions([...savedCategoryOptions]);
    setCategoryIcons({ ...savedCategoryIcons });
    setNewCategoryName("");
    setNewCategoryIcon(DEFAULT_NEW_CATEGORY_ICON);
    setCategoryMessage(null);
    setIsCategoryDeleteMode(false);
    setIsDirty(false);
    setSaveMessage("Perubahan dibatalkan.");
    window.setTimeout(() => setSaveMessage(null), 1800);
  };

  const handleCopyText = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSaveMessage(`${label ?? "Teks"} disalin.`);
      window.setTimeout(() => setSaveMessage(null), 1600);
    } catch (e) {
      console.error("Clipboard error", e);
    }
  };

  const renderProductModal = () => {
    if (!showAddProduct) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
        <div className="absolute inset-0" aria-hidden="true" onClick={closeAddProduct} />
        <div className="relative z-10 w-full max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-transparent to-blue-50" />
            <div className="relative max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 border-b border-emerald-100/60 px-6 py-5 lg:px-10">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
                    {isEditingProduct ? "Edit Produk" : "Produk Baru"}
                  </p>
                  <h2 className="text-xl font-semibold text-gray-800">
                    {isEditingProduct ? "Perbarui Informasi Produk" : "Tambah Produk"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {isEditingProduct
                      ? "Ubah detail produk agar katalog selalu up-to-date."
                      : "Lengkapi detail berikut untuk memasukkan produk ke katalog digital."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAddProduct}
                  className="rounded-full border border-emerald-100 bg-white/70 p-2 text-emerald-500 shadow-sm hover:bg-emerald-50 transition"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
              <div className="relative grid gap-6 px-6 py-6 lg:grid-cols-[1.7fr,1fr] lg:px-10 lg:py-8">
                <form className="space-y-6" onSubmit={handleProductSubmit}>
                  <div className="space-y-4 rounded-2xl border border-emerald-50 bg-white/90 p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700">Informasi Utama</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-sm text-gray-600">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Nama Produk
                        </span>
                        <input
                          name="name"
                          value={productForm.name}
                          onChange={handleProductInputChange}
                          placeholder="Contoh: Pistachio Latte"
                          className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          required
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm text-gray-600">
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                          Kategori
                        </span>
                        <select
                          name="category"
                          value={productForm.category}
                          onChange={handleProductSelectChange}
                          className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        >
                          {categoryOptions.map((category) => (
                            <option key={category} value={category}>
                              {formatCategoryLabel(category)}
                            </option>
                          ))}
                        </select>
                        <p className="mt-3 text-xs text-gray-500">
                          Kategori dikelola melalui menu Pengaturan &rarr; Kategori Produk.
                        </p>
                      </label>
                    </div>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Deskripsi
                      </span>
                      <textarea
                        name="description"
                        value={productForm.description}
                        onChange={handleProductInputChange}
                        placeholder="Tuliskan deskripsi singkat yang menggugah selera…"
                        rows={4}
                        className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Highlight / Selling Point
                      </span>
                      <input
                        name="highlight"
                        value={productForm.highlight}
                        onChange={handleProductInputChange}
                        placeholder="Contoh: Signature roasted pistachio cream"
                        className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm text-gray-600">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                        Harga Produk
                      </span>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                          Rp
                        </span>
                        <input
                          name="price"
                          value={productForm.price}
                          onChange={handleProductInputChange}
                          inputMode="numeric"
                          pattern="\d*"
                          placeholder="Contoh: 55000"
                          className="rounded-xl border border-emerald-100 bg-white px-4 py-3 pl-11 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Ditampilkan sebagai <span className="font-semibold text-emerald-600">{formattedPricePreview}</span>
                      </p>
                    </label>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-emerald-50 bg-white/90 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-700">Detail Tambahan</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Opsional
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                        <label className="flex flex-col gap-2 text-sm text-gray-600">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Unggah Gambar Produk
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductFileChange}
                            className="block w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-600 hover:file:bg-emerald-200"
                          />
                        </label>
                        <div className="space-y-2 text-xs text-gray-500">
                          <p className="font-semibold uppercase tracking-[0.2em] text-gray-500">
                            atau gunakan URL gambar
                          </p>
                          <input
                            name="imageUrl"
                            value={productForm.imageUrl}
                            onChange={handleProductInputChange}
                            placeholder="https://…"
                            className="rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                          <p>Pilih salah satu metode agar katalog menyimpan gambar produk.</p>
                        </div>
                      </div>
                      <div className="grid gap-4">
                        <label className="flex flex-col gap-2 text-sm text-gray-600">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Waktu Penyajian (menit)
                          </span>
                          <input
                            name="prepTime"
                            value={productForm.prepTime}
                            onChange={handleProductInputChange}
                            placeholder="Contoh: 7"
                            className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                          <p className="text-xs text-gray-400">Tampil di aplikasi staff sebagai estimasi penyajian.</p>
                        </label>
                        <label className="flex flex-col gap-2 text-sm text-gray-600">
                          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Kalori (opsional)
                          </span>
                          <input
                            name="calories"
                            value={productForm.calories}
                            onChange={handleProductInputChange}
                            placeholder="Contoh: 320"
                            className="rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                          <p className="text-xs text-gray-400">Berguna untuk pelanggan yang memantau nutrisi.</p>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 rounded-2xl border border-emerald-50 bg-white/90 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-gray-700">Pengaturan Menu</p>
                      <span className="text-xs text-gray-400">Kontrol visibilitas & opsi penyajian</span>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {[
                        {
                          name: "isAvailable" as const,
                          title: "Aktif di katalog",
                          description: "Produk dapat dipesan pelanggan.",
                          icon: "storefront",
                          accent: "from-emerald-100 via-emerald-50 to-white",
                          checked: productForm.isAvailable,
                        },
                        {
                          name: "isFeatured" as const,
                          title: "Tandai sebagai unggulan",
                          description: "Tampilkan di bagian rekomendasi.",
                          icon: "star",
                          accent: "from-emerald-100 via-white to-emerald-50",
                          checked: productForm.isFeatured,
                        },
                        {
                          name: "soldOut" as const,
                          title: "Tandai habis",
                          description: "Sembunyikan tombol pesan pada aplikasi pelanggan.",
                          icon: "inventory_2",
                          accent: "from-red-100 via-red-50 to-white",
                          checked: productForm.soldOut,
                        },
                        {
                          name: "hotOption" as const,
                          title: "Tersedia pilihan panas",
                          description: "Pelanggan bisa memesan versi hot.",
                          icon: "local_cafe",
                          accent: "from-orange-100 via-white to-orange-50",
                          checked: productForm.hotOption,
                        },
                        {
                          name: "icedOption" as const,
                          title: "Tersedia pilihan dingin",
                          description: "Sediakan varian iced / cold brew.",
                          icon: "ac_unit",
                          accent: "from-blue-100 via-white to-blue-50",
                          checked: productForm.icedOption,
                        },
                      ].map((item) => {
                        const disableAvailability = item.name === "isAvailable" && productForm.soldOut;
                        const iconColor = item.name === "soldOut" ? "text-red-500" : "text-emerald-500";
                        const containerClasses = [
                          "group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br px-4 py-4 text-sm text-gray-600 shadow-sm transition",
                          item.accent,
                          disableAvailability ? "opacity-60 cursor-not-allowed" : "hover:shadow-md",
                        ].join(" ");
                        return (
                          <label key={item.name} className={containerClasses}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="rounded-2xl bg-white/80 p-2 shadow-sm">
                                  <span className={`material-symbols-outlined text-base ${iconColor}`}>
                                    {item.icon}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-700">{item.title}</p>
                                  <p className="text-xs text-gray-500">{item.description}</p>
                                  {item.name === "soldOut" ? (
                                    <p className="mt-1 text-[11px] text-red-500">Produk akan ditandai habis di aplikasi pelanggan.</p>
                                  ) : null}
                                  {disableAvailability ? (
                                    <p className="mt-1 text-[11px] text-red-500">Matikan status habis untuk mengaktifkan kembali.</p>
                                  ) : null}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                name={item.name}
                                checked={item.checked}
                                onChange={handleProductCheckboxChange}
                                disabled={disableAvailability}
                                className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                              />
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-5 rounded-2xl border border-emerald-50 bg-white/90 p-5 shadow-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Kustomisasi Pelanggan</p>
                        <p className="text-xs text-gray-500">
                          Tambahkan opsi seperti ukuran gelas, level es, atau topping agar pelanggan bisa request sesuai preferensi.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {CUSTOMIZATION_TEMPLATES.map((template) => (
                          <button
                            key={template.key}
                            type="button"
                            onClick={() => applyCustomizationTemplate(template.key)}
                            className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm transition hover:bg-emerald-50"
                          >
                            {template.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={addEmptyCustomizationGroup}
                          className="rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:bg-emerald-50"
                        >
                          Tambah Manual
                        </button>
                      </div>
                    </div>

                    {productForm.customizations.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-6 text-sm text-emerald-600">
                        Belum ada opsi kustomisasi. Gunakan template di atas agar admin tidak perlu mengetik ulang permintaan pelanggan yang umum.
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {productForm.customizations.map((group, index) => (
                          <div
                            key={group.id}
                            className="rounded-3xl border border-emerald-100 bg-white shadow-[0_12px_30px_-18px_rgba(16,185,129,0.35)] overflow-hidden"
                          >
                            <div className="bg-gradient-to-r from-emerald-50 via-white to-transparent px-5 py-4 space-y-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
                                <div className="flex-1 space-y-3">
                                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                    Nama Grup
                                    <input
                                      value={group.name}
                                      onChange={(event) => handleGroupFieldChange(group.id, "name", event.target.value)}
                                      className="mt-1 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    />
                                  </label>
                                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                    Catatan (opsional)
                                    <input
                                      value={group.helperText ?? ""}
                                      onChange={(event) => handleGroupFieldChange(group.id, "helperText", event.target.value)}
                                      placeholder="Contoh: Pilih maksimal 2 topping"
                                      className="mt-1 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    />
                                  </label>
                                </div>
                                <div className="grid gap-3 sm:w-64">
                                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                    Tipe Pilihan
                                    <select
                                      value={group.type}
                                      onChange={(event) => handleGroupFieldChange(group.id, "type", event.target.value as CustomizationGroup["type"])}
                                      className="mt-1 rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    >
                                      <option value="single">Pilih satu</option>
                                      <option value="multiple">Boleh banyak</option>
                                    </select>
                                  </label>
                                  <label className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-sm text-gray-600 shadow-sm">
                                    <input
                                      type="checkbox"
                                      checked={group.required}
                                      onChange={(event) => handleGroupFieldChange(group.id, "required", event.target.checked)}
                                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    Wajib dipilih pelanggan
                                  </label>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-600">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                    {group.type === "single" ? "Pilih satu" : "Boleh banyak"}
                                  </span>
                                  {group.required ? (
                                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                      Wajib
                                    </span>
                                  ) : null}
                                  <span className="text-gray-400">Set #{index + 1}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGroup(group.id)}
                                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-500 shadow-sm transition hover:bg-red-100"
                                >
                                  Hapus Grup
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3 px-5 py-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Daftar Pilihan</p>
                              <div className="space-y-3">
                                {group.options.map((option) => (
                                  <div
                                    key={option.id}
                                    className="rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm"
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                                      <div className="flex-1">
                                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                          Nama Pilihan
                                          <input
                                            value={option.label}
                                            onChange={(event) => handleOptionFieldChange(group.id, option.id, "label", event.target.value)}
                                            placeholder="Contoh: Extra Shot"
                                            className="mt-1 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                          />
                                        </label>
                                      </div>
                                      <div className="w-full sm:w-48">
                                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                          Penyesuaian Harga
                                          <div className="mt-1 flex items-center gap-2 rounded-lg border border-emerald-100 bg-white px-3 py-2 shadow-inner">
                                            <span className="text-sm font-semibold text-gray-500">Rp</span>
                                            <input
                                              type="text"
                                              inputMode="numeric"
                                              pattern="-?[0-9]*"
                                              value={option.priceAdjustment === 0 ? "" : option.priceAdjustment.toString()}
                                              onChange={(event) => handleOptionPriceInputChange(group.id, option.id, event.target.value)}
                                              className="w-full border-none bg-transparent text-sm font-semibold text-gray-700 focus:outline-none"
                                              placeholder="0"
                                            />
                                          </div>
                                        </label>
                                        <p className="text-[11px] text-emerald-500 mt-1">
                                          Ditampilkan sebagai {formatPriceAdjustment(option.priceAdjustment)}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveOption(group.id, option.id)}
                                        className="self-start rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-500 shadow-sm transition hover:bg-red-100"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleAddOption(group.id)}
                                  className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-600 shadow-sm transition hover:bg-emerald-50"
                                >
                                  Tambah Pilihan
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {productSubmitStatus ? (
                      <div
                        className={`order-last sm:order-first inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-sm ${
                          productSubmitStatus.type === "success"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-red-200 bg-red-50 text-red-600"
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">
                          {productSubmitStatus.type === "success" ? "task_alt" : "error"}
                        </span>
                        {productSubmitStatus.message}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={closeAddProduct}
                      className="order-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-100 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProduct}
                      className="order-1 sm:order-last inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-600 transition disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSavingProduct ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-base">
                            progress_activity
                          </span>
                          Menyimpan…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-base">check_small</span>
                          {isEditingProduct ? "Simpan Perubahan" : "Simpan Produk"}
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <aside className="space-y-4">
                  <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-emerald-50/60 shadow-inner">
                    <div className="relative h-48 bg-gradient-to-br from-emerald-200 via-emerald-100 to-white">
                      {productImagePreview ? (
                        <Image
                          src={productImagePreview}
                          alt={productForm.name || "Preview produk"}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                          className="h-full w-full object-cover"
                          priority
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-emerald-700">
                          Preview gambar akan muncul di sini
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-white/90 px-4 py-2 shadow-lg">
                        <span className="text-sm font-semibold text-emerald-600">
                          {formattedPricePreview}
                        </span>
                        <div className="flex items-center gap-2">
                          {productForm.soldOut ? (
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                              Habis
                            </span>
                          ) : null}
                          <span className="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-1">
                            <CategoryIcon
                              value={resolveCategoryIcon(productForm.category, categoryIcons)}
                              className="text-sm text-emerald-600"
                            />
                          </span>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {formatCategoryLabel(productForm.category)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3 px-5 py-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {productForm.name || "Nama Produk"}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {productForm.description || "Deskripsi singkat produk akan tampil di sini."}
                        </p>
                      </div>
                      {productForm.highlight ? (
                        <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-emerald-600 shadow-sm">
                          <span className="material-symbols-outlined text-base">sparkles</span>
                          {productForm.highlight}
                        </div>
                      ) : null}
                      {productForm.soldOut ? (
                        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 shadow-sm">
                          <span className="material-symbols-outlined text-base">report</span>
                          Produk ditandai habis — pelanggan tidak dapat memesan.
                        </div>
                      ) : null}
                      {productForm.customizations.length ? (
                        <div className="space-y-2 rounded-2xl border border-emerald-100 bg-white/80 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                            Pilihan Request
                          </p>
                          <div className="space-y-2">
                            {productForm.customizations.map((group) => (
                              <div key={group.id} className="text-xs text-gray-600">
                                <p className="font-semibold text-gray-700">
                                  {group.name} {group.required ? <span className="text-emerald-500">(wajib)</span> : null}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {group.helperText || (group.type === "single" ? "Pilih salah satu" : "Boleh lebih dari satu")}
                                </p>
                                <ul className="mt-1 flex flex-wrap gap-1">
                                  {group.options.map((option) => (
                                    <li
                                      key={option.id}
                                      className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-600"
                                    >
                                      {option.label || "Tanpa nama"}
                                      {option.priceAdjustment !== 0 ? (
                                        <span className="ml-1 text-[10px] font-medium text-emerald-500">
                                          {formatPriceAdjustment(option.priceAdjustment)}
                                        </span>
                                      ) : null}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">
                          Belum ada kustomisasi pelanggan. Gunakan template untuk meniru pengalaman order seperti di menu pelanggan.
                        </p>
                      )}
                      <div className="grid gap-3 text-xs text-gray-500">
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
                          <span className="material-symbols-outlined text-base text-emerald-500">schedule</span>
                          <span>{productForm.prepTime ? `${productForm.prepTime} menit` : "Estimasi waktu belum diisi"}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
                          <span className="material-symbols-outlined text-base text-emerald-500">local_fire_department</span>
                          <span>{productForm.calories ? `${productForm.calories} kkal` : "Informasi kalori opsional"}</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white/80 px-3 py-2">
                          <span className="material-symbols-outlined text-base text-emerald-500">coffee</span>
                          <span>
                            {[
                              productForm.hotOption ? "Hot" : null,
                              productForm.icedOption ? "Iced" : null,
                            ]
                              .filter(Boolean)
                              .join(" & ") || "Pilih varian penyajian"}
                          </span>
                        </div>
                        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                          productForm.soldOut
                            ? "border-red-200 bg-red-50"
                            : "border-emerald-100 bg-white/80"
                        }`}>
                          <span className={`material-symbols-outlined text-base ${
                            productForm.soldOut ? "text-red-500" : "text-emerald-500"
                          }`}>
                            {productForm.soldOut ? "block" : productForm.isAvailable ? "task_alt" : "event_busy"}
                          </span>
                          <span className={productForm.soldOut ? "text-red-600" : "text-gray-600"}>
                            {productForm.soldOut
                              ? "Produk ditandai habis dan tidak dapat dipesan"
                              : productForm.isAvailable
                              ? "Produk aktif dan siap dipesan"
                              : "Produk sedang disembunyikan"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-emerald-100 bg-white/90 p-4 text-xs text-gray-500 shadow-sm space-y-2">
                    <p className="font-semibold text-gray-700">Tips Katalog</p>
                    <p>Gunakan foto resolusi tinggi agar tampilan menu terasa profesional.</p>
                    <p>Tambahkan tag maksimal 5 kata kunci untuk memudahkan pencarian.</p>
                    <p>Highlight singkat membantu pelanggan mengetahui keistimewaan produk.</p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isReady) {
    return null;
  }

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
              <Link
                href="/admin/profile"
                className="flex items-center gap-2 rounded-full border border-transparent px-2 py-1 transition hover:border-emerald-100 hover:bg-emerald-50/60"
              >
                <div
                  className="h-9 w-9 rounded-full grid place-items-center text-sm font-semibold text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {avatarInitials}
                </div>
                <div className="leading-tight text-left">
                  <p className="font-semibold text-gray-700">{displayName}</p>
                  <p className="text-xs text-gray-500">{displayEmail}</p>
                </div>
              </Link>
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
            
            // Special handling for kitchen view - navigate to separate page
            if (item.key === "kitchen") {
              return (
                <Link
                  key={item.key}
                  href="/orders"
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition text-gray-500 hover:bg-emerald-50`}
                >
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            }

            if (item.key === "cashier") {
              return (
                <Link
                  key={item.key}
                  href="/cashier"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition text-gray-500 hover:bg-emerald-50"
                >
                  <span className="material-symbols-outlined text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            }
            
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

              {/* Quick Actions */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  href="/orders"
                  className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-lg">receipt_long</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Kelola Pesanan</h3>
                        <p className="text-sm text-gray-600">Lihat & update status pesanan</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-emerald-500 transition-colors">
                      arrow_forward
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-gray-600">{orders.filter(o => o.status === 'pending').length} Menunggu</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-gray-600">{orders.filter(o => o.status === 'preparing').length} Diproses</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-gray-600">{orders.filter(o => o.status === 'ready').length} Siap</span>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/admin/sales-report"
                  className="group rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 via-white to-gray-100/60 p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                        <span className="material-symbols-outlined text-white text-lg">analytics</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                          Laporan Penjualan
                        </h3>
                        <p className="text-sm text-gray-600">Lihat laporan detail & insight.</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 transition group-hover:text-emerald-500 group-hover:translate-x-1">
                      trending_up
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">Klik untuk membuka halaman laporan.</p>
                </Link>
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
                  onClick={openAddProduct}
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
                    {isLoadingProducts ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                          Memuat data produk…
                        </td>
                      </tr>
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                          Belum ada produk di katalog. Tambahkan produk baru untuk mulai menjual.
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product.id} className="text-gray-600">
                          <td className="px-4 py-3 font-medium text-gray-700">
                            {product.name}
                            {product.soldOut ? (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">
                                <span className="material-symbols-outlined text-[13px]">block</span>
                                Habis
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">
                                <CategoryIcon
                                  value={resolveCategoryIcon(product.category, categoryIcons)}
                                  className="text-sm"
                                />
                              </span>
                              <div>
                                <p className="font-medium text-gray-600">
                                  {formatCategoryLabel(product.category)}
                                </p>
                                {product.customizations?.length ? (
                                  <p className="text-xs text-emerald-500 mt-1">
                                    {product.customizations.length} set permintaan pelanggan
                                  </p>
                                ) : null}
                                {product.soldOut ? (
                                  <p className="text-xs text-red-500 mt-1">Tidak dapat dipesan — stok habis.</p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            {currencyFormatter.format(product.price)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openEditProduct(product)}
                              className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
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
                        <button
                          type="button"
                          onClick={() => setPendingDeleteTable(table)}
                          className="rounded-full border border-red-200 bg-white px-3 py-1 font-semibold text-red-500 transition hover:bg-red-50"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-white border border-emerald-100/80 p-3 shadow grid place-items-center">
                      <Image
                        src={table.qrDataUrl}
                        alt={`QR untuk ${table.name}`}
                        width={144}
                        height={144}
                        className="h-36 w-36 object-contain"
                        sizes="144px"
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

          {activeKey === "kitchen" ? (
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

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleCancelAll}
                      disabled={!isDirty}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        isDirty
                          ? "border-gray-200 text-gray-600 hover:bg-gray-100"
                          : "border-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={!isDirty}
                      className={`rounded-full px-4 py-2 text-xs font-semibold transition shadow ${
                        isDirty
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : "bg-emerald-100 text-emerald-400 cursor-not-allowed"
                      }`}
                    >
                      Simpan Perubahan
                    </button>
                  </div>

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
                          />
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeSettingsSection === "categories" ? (
                    <div className="rounded-3xl border border-emerald-100 bg-white/85 shadow-sm p-6 space-y-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Menu Digital</p>
                          <h3 className="text-lg font-semibold text-gray-700">Kategori Produk</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Pilih ikon yang konsisten agar pelanggan mudah mengenali setiap kategori di menu.
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">category</span>
                      </div>

                      {categoryMessage ? (
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-600 shadow-sm">
                          {categoryMessage}
                        </div>
                      ) : null}

                      <div className="grid gap-6 xl:grid-cols-[minmax(0,320px)_1fr]">
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-inner space-y-4">
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                Nama kategori baru
                              </label>
                              <input
                                value={newCategoryName}
                                onChange={(event) => setNewCategoryName(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    handleAddCategory();
                                  }
                                }}
                                placeholder="Contoh: Seasonal Drinks"
                                className="mt-1 w-full rounded-xl border border-emerald-100 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                Pilih ikon kategori
                              </label>
                              <div className="mt-2 flex items-center gap-3">
                                <select
                                  value={newCategoryIcon}
                                  onChange={(event) => setNewCategoryIcon(event.target.value)}
                                  className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                >
                                  {CATEGORY_ICON_CHOICES.map((icon) => (
                                    <option key={icon} value={icon}>
                                      {icon}
                                    </option>
                                  ))}
                                </select>
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                                  <CategoryIcon value={newCategoryIcon} className="text-base" />
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={handleAddCategory}
                                className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-600 shadow-sm transition hover:bg-emerald-50"
                              >
                                Tambah kategori
                              </button>
                            </div>
                            <p className="text-[11px] text-gray-500">
                              Gunakan ikon yang sama dengan tema produk agar navigasi menu terasa konsisten.
                            </p>
                          </div>

                          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/70 to-white p-5 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-700">Kelola kategori</p>
                                <p className="text-xs text-gray-500">
                                  Aktifkan mode hapus untuk menghapus kategori.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsCategoryDeleteMode((prev) => !prev)}
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                                  isCategoryDeleteMode
                                    ? "border border-red-200 bg-red-50 text-red-600"
                                    : "border border-emerald-200 bg-white text-emerald-600"
                                }`}
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                {isCategoryDeleteMode ? "Batalkan" : "Aktifkan"}
                              </button>
                            </div>
                            <div className="text-xs text-gray-500">
                              {isCategoryDeleteMode
                                ? "Pilih kategori di daftar untuk dihapus. Minimal satu kategori harus tersisa."
                                : "Tombol hapus akan muncul pada kategori setelah mode diaktifkan."}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {categoryOptions.map((category) => {
                            const iconValue = resolveCategoryIcon(category, categoryIcons);
                            const trimmedIconValue = iconValue.trim() || DEFAULT_NEW_CATEGORY_ICON;
                            const optionCandidates = CATEGORY_ICON_CHOICES.includes(trimmedIconValue)
                              ? CATEGORY_ICON_CHOICES
                              : [trimmedIconValue, ...CATEGORY_ICON_CHOICES];
                            const selectOptions = Array.from(new Set(optionCandidates));

                            return (
                              <div
                                key={category}
                                className="rounded-3xl border border-emerald-100 bg-white/90 px-5 py-4 shadow-sm transition hover:shadow-md"
                              >
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                                    <CategoryIcon value={iconValue} className="text-base" />
                                  </span>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {formatCategoryLabel(category)}
                                    </p>
                                    <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400">
                                      {category}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                  <div className="space-y-1">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-500">
                                      Material icon
                                    </p>
                                    <select
                                      value={trimmedIconValue}
                                      onChange={(event) => {
                                        const value = event.target.value;
                                        setCategoryIconValue(category, value);
                                        showCategoryMessage(`Ikon kategori ${formatCategoryLabel(category)} diperbarui.`, 1800);
                                      }}
                                      className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    >
                                      {selectOptions.map((icon) => (
                                        <option key={icon} value={icon}>
                                          {icon}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleResetCategoryIcon(category)}
                                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm transition hover:bg-gray-100"
                                  >
                                    Reset ikon
                                  </button>
                                  {isCategoryDeleteMode ? (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCategory(category)}
                                      className="rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 shadow-sm transition hover:bg-red-100"
                                    >
                                      Hapus kategori
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                              onChange={(event) => {
                                setSettings((prev) => ({
                                  ...prev,
                                  payment: { ...prev.payment, qrisMerchantName: event.target.value },
                                }));
                                setIsDirty(true);
                              }}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="payment-qris-id" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              ID Merchant / QRIS
                            </label>
                            <div className="relative">
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
                                onInput={() => setIsDirty(true)}
                                className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 pr-10 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                              />
                              <button
                                type="button"
                                onClick={() => handleCopyText(settings.payment.qrisId, "ID Merchant")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-700"
                                aria-label="Salin ID Merchant"
                              >
                                <span className="material-symbols-outlined text-base">content_copy</span>
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="payment-bank-name" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Nama Bank
                            </label>
                            <select
                              id="payment-bank-name"
                              value={settings.payment.bankName}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  payment: { ...prev.payment, bankName: event.target.value },
                                }))
                              }
                              onInput={() => setIsDirty(true)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            >
                              {BANK_OPTIONS.map((name) => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="payment-bank-account-name" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Nama Pemilik Rekening (Atas Nama)
                            </label>
                            <input
                              id="payment-bank-account-name"
                              type="text"
                              value={settings.payment.bankAccountName}
                              onChange={(event) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  payment: { ...prev.payment, bankAccountName: event.target.value },
                                }))
                              }
                              onInput={() => setIsDirty(true)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="payment-bank-account" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Nomor Rekening
                            </label>
                            <input
                              id="payment-bank-account"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              type="text"
                              value={settings.payment.bankAccountNumber}
                              onChange={(event) => {
                                const digits = event.target.value.replace(/\D/g, "");
                                setSettings((prev) => ({
                                  ...prev,
                                  payment: { ...prev.payment, bankAccountNumber: digits },
                                }));
                                setIsDirty(true);
                              }}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                            <p className="text-xs text-gray-400">Hanya angka, tanpa spasi atau tanda hubung.</p>
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                                  Versi Pengguna
                                </p>
                                <p className="text-sm text-gray-600">
                                  Pilihan pembayaran yang tampil di aplikasi pelanggan.
                                </p>
                              </div>
                              <span className="material-symbols-outlined text-emerald-500 text-xl">smartphone</span>
                            </div>
                            <div className="space-y-2">
                              {[
                                { field: "qrisEnabled" as const, label: "QRIS" },
                                { field: "shopeePayEnabled" as const, label: "ShopeePay" },
                                { field: "goPayEnabled" as const, label: "GoPay" },
                                { field: "ovoEnabled" as const, label: "OVO" },
                                { field: "danaEnabled" as const, label: "Dana" },
                              ].map((item) => (
                                <label
                                  key={`user-${item.field}`}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-gray-600"
                                >
                                  {item.label}
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={settings.payment.user[item.field]}
                                    onChange={() => toggleUserPaymentField(item.field)}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                                  Versi Kasir
                                </p>
                                <p className="text-sm text-gray-600">
                                  Kontrol metode pembayaran yang tersedia di perangkat kasir.
                                </p>
                              </div>
                              <span className="material-symbols-outlined text-emerald-500 text-xl">point_of_sale</span>
                            </div>
                            <div className="space-y-2">
                              {[
                                { field: "qrisEnabled" as const, label: "QRIS" },
                                { field: "cashEnabled" as const, label: "Terima Tunai" },
                                { field: "cardEnabled" as const, label: "Terima Kartu/Debit" },
                              ].map((item) => (
                                <label
                                  key={`cashier-${item.field}`}
                                  className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-gray-600"
                                >
                                  {item.label}
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={settings.payment.cashier[item.field]}
                                    onChange={() => toggleCashierPaymentField(item.field)}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
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
                              max={100}
                              value={settings.payment.serviceCharge}
                              onChange={(event) => handlePaymentNumberChange("serviceCharge", event)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                            <p className="text-xs text-gray-400">Pajak dihitung dari total setelah service charge.</p>
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="payment-tax-rate" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                              Pajak (%)
                            </label>
                            <input
                              id="payment-tax-rate"
                              type="number"
                              min={0}
                              max={100}
                              value={settings.payment.taxRate}
                              onChange={(event) => handlePaymentNumberChange("taxRate", event)}
                              className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                            />
                            <p className="text-xs text-gray-400">Nilai 0–100. Urutan hitung: subtotal + service, lalu pajak.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {activeSettingsSection === "hours" ? (
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Jam Operasional</p>
                          <h3 className="text-lg font-semibold text-gray-700">Atur Jadwal Buka Toko</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Sesuaikan jam buka dan tutup toko untuk setiap hari.
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">schedule</span>
                      </div>
                      <div className="mt-6 space-y-4">
                        {settings.hours.map((hour, index) => (
                          <div key={index} className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-semibold text-gray-700">{hour.day}</p>
                              </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label htmlFor={`open-${index}`} className="text-xs font-semibold text-gray-500">
                                Buka:
                              </label>
                              <input
                                id={`open-${index}`}
                                type="time"
                                value={hour.open}
                                onChange={(e) => handleHourChange(index, "open", e.target.value)}
                                className="w-32 sm:w-36 rounded-xl border border-emerald-100 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label htmlFor={`close-${index}`} className="text-xs font-semibold text-gray-500">
                                Tutup:
                              </label>
                              <input
                                id={`close-${index}`}
                                type="time"
                                value={hour.close}
                                onChange={(e) => handleHourChange(index, "close", e.target.value)}
                                className="w-32 sm:w-36 rounded-xl border border-emerald-100 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                              />
                            </div>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={hour.closed}
                                    onChange={(e) => handleHourChange(index, "closed", e.target.checked)}
                                  />
                                  <span className="text-xs font-semibold text-gray-500">Tutup</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {activeSettingsSection === "notifications" ? (
                    <div className="rounded-2xl border border-emerald-100 bg-white/80 shadow-sm p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Notifikasi</p>
                          <h3 className="text-lg font-semibold text-gray-700">Pengaturan Notifikasi</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Atur notifikasi real-time dan laporan otomatis.
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-emerald-500 text-2xl">notifications_active</span>
                      </div>

                      <div className="mt-6 space-y-8">
                        {/* Notifikasi Real-time */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-700 mb-3">Notifikasi Real-time</h4>
                          <div className="space-y-4">
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
                          </div>
                        </div>

                        {/* Konfigurasi Notifikasi Spesifik */}
                        <div className="space-y-4">
                          {settings.notifications.lowStock && (
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold text-gray-700">Konfigurasi Stok Hampir Habis</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Atur ambang batas minimum untuk notifikasi stok.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowLowStockConfig(!showLowStockConfig)}
                                  className="text-emerald-600 hover:text-emerald-700"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {showLowStockConfig ? "expand_less" : "expand_more"}
                                  </span>
                                </button>
                              </div>
                              {showLowStockConfig && (
                                <div className="mt-3 space-y-3">
                                  <div className="space-y-2">
                                    <label htmlFor="low-stock-threshold" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                      Ambang Batas Stok (gram)
                                    </label>
                                    <input
                                      id="low-stock-threshold"
                                      type="number"
                                      value={settings.notifications.lowStockThreshold}
                                      onChange={handleLowStockThresholdChange}
                                      className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    />
                                    <p className="text-xs text-gray-400">
                                      Notifikasi akan muncul ketika stok kurang dari nilai ini.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {settings.notifications.staffSchedule && (
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold text-gray-700">Konfigurasi Pengingat Jadwal Staff</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Atur pengingat jadwal shift staff.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowStaffScheduleConfig(!showStaffScheduleConfig)}
                                  className="text-emerald-600 hover:text-emerald-700"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {showStaffScheduleConfig ? "expand_less" : "expand_more"}
                                  </span>
                                </button>
                              </div>
                              {showStaffScheduleConfig && (
                                <div className="mt-3 space-y-3">
                                  <div className="space-y-2">
                                    <label htmlFor="staff-schedule-reminder" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                      Waktu Pengingat (jam sebelum shift)
                                    </label>
                                    <input
                                      id="staff-schedule-reminder"
                                      type="number"
                                      value={settings.notifications.staffScheduleReminderTime}
                                      onChange={handleStaffScheduleReminderTimeChange}
                                      className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                    />
                                    <p className="text-xs text-gray-400">
                                      Kirim pengingat {settings.notifications.staffScheduleReminderTime} jam sebelum shift dimulai.
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    <label htmlFor="staff-schedule-group" className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                                      Tautan Grup WhatsApp Staff
                                    </label>
                                    <input
                                      id="staff-schedule-group"
                                      type="text"
                                      value={settings.notifications.staffScheduleGroupLink}
                                      onChange={handleStaffScheduleGroupLinkChange}
                                      className="w-full rounded-xl border border-emerald-100 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                      placeholder="https://chat.whatsapp.com/..."
                                    />
                                    <p className="text-xs text-gray-400">
                                      Masukkan tautan grup WhatsApp untuk pengiriman pengingat.
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Laporan Otomatis */}
                        <div>
                          <h4 className="text-md font-semibold text-gray-700 mb-3">Laporan Otomatis</h4>
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
                          <div className="mt-3">
                            <p className="text-xs text-gray-400">
                              Email harian dikirim pukul 22.00 WIB · Pesan WhatsApp akan diteruskan otomatis.
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Laporan harian mencakup ringkasan penjualan, stok, dan aktivitas operasional.
                            </p>
                          </div>
                        </div>
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

                      <div className="mt-6 overflow-x-auto">
                        <table className="min-w-full divide-y divide-emerald-100 text-sm">
                          <thead className="bg-emerald-50/40 text-left text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                            <tr>
                              <th className="px-4 py-3">Nama</th>
                              <th className="px-4 py-3">Email</th>
                              <th className="px-4 py-3">Peran</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Terakhir Aktif</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-50 bg-white/60">
                            {adminAccounts.map((account) => {
                              const statusMeta = ADMIN_STATUS_META[account.status] ?? ADMIN_STATUS_META.inactive;
                              const lastLoginLabel =
                                account.lastLogin && account.lastLogin.trim().length > 0
                                  ? account.lastLogin
                                  : "Belum ada aktivitas";
                              return (
                                <tr key={account.email} className="text-gray-600">
                                  <td className="px-4 py-3 font-medium text-gray-700">{account.name}</td>
                                  <td className="px-4 py-3">{account.email}</td>
                                  <td className="px-4 py-3">{account.role}</td>
                                  <td className="px-4 py-3">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                                      {statusMeta.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="text-sm font-medium text-gray-700">{lastLoginLabel}</p>
                                    <p className="text-xs text-gray-400">Terakhir login</p>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
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
      {renderProductModal()}
      {showClearConfirm || pendingToggleSlug || pendingDeleteTable ? (
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

            {pendingDeleteTable ? (
              <>
                <p className="text-sm font-semibold text-gray-800">
                  Hapus {pendingDeleteTable.name}?
                </p>
                <p className="text-xs text-gray-500">
                  QR dan tautan meja {pendingDeleteTable.slug} akan dihapus. Cetak ulang QR baru jika diperlukan.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                    onClick={() => setPendingDeleteTable(null)}
                  >
                    Batalkan
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-600"
                    onClick={() => {
                      handleDeleteTable(pendingDeleteTable.slug);
                      setPendingDeleteTable(null);
                    }}
                  >
                    Hapus
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
