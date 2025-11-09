export type AdminNavKey =
  | "overview"
  | "menu-products"
  | "menu-variants"
  | "menu-categories"
  | "menu-master-products"
  | "menu-master-variants"
  | "menu-master-categories"
  | "customer-list"
  | "customer-bulk"
  | "customer-voucher"
  | "table-overview"
  | "table-layout"
  | "table-qr"
  | "table-reservations"
  | "kitchen"
  | "settings";

export type SidebarNavSection = {
  title: string;
  items: Array<{ key: AdminNavKey; label: string; icon: string; badge?: string }>;
};

export const NAV_SECTIONS: SidebarNavSection[] = [
  {
    title: "Ringkasan",
    items: [{ key: "overview", label: "Dashboard", icon: "space_dashboard" }],
  },
  {
    title: "Menu",
    items: [
      { key: "menu-products", label: "Produk", icon: "coffee" },
      { key: "menu-variants", label: "Varian", icon: "tune" },
      { key: "menu-categories", label: "Kategori", icon: "category" },
      { key: "menu-master-products", label: "Master Produk", icon: "inventory_2" },
      { key: "menu-master-variants", label: "Master Varian", icon: "widgets" },
      { key: "menu-master-categories", label: "Master Kategori", icon: "view_list" },
    ],
  },
  {
    title: "Pelanggan",
    items: [
      { key: "customer-list", label: "Pelanggan", icon: "group" },
      { key: "customer-bulk", label: "Pesan Massal", icon: "campaign" },
      { key: "customer-voucher", label: "Voucher", icon: "confirmation_number" },
    ],
  },
  {
    title: "Manajemen Meja",
    items: [
      { key: "table-overview", label: "Ringkasan Meja", icon: "table_restaurant" },
      { key: "table-layout", label: "Varian & Layout", icon: "grid_view" },
      { key: "table-qr", label: "QR & Ordering", icon: "qr_code_2" },
      { key: "table-reservations", label: "Reservasi", icon: "event" },
    ],
  },
  {
    title: "Operasional",
    items: [
      { key: "kitchen", label: "Dapur & Pesanan", icon: "receipt_long" },
      { key: "settings", label: "Pengaturan", icon: "settings" },
    ],
  },
];

const ADMIN_SECTION_SEGMENTS: Record<AdminNavKey, string> = {
  overview: "dashboard",
  "menu-products": "produk",
  "menu-variants": "varian",
  "menu-categories": "kategori",
  "menu-master-products": "master-produk",
  "menu-master-variants": "master-varian",
  "menu-master-categories": "master-kategori",
  "customer-list": "pelanggan",
  "customer-bulk": "pesan-massal",
  "customer-voucher": "voucher",
  "table-overview": "ringkasan-meja",
  "table-layout": "varian-layout",
  "table-qr": "qr-ordering",
  "table-reservations": "reservasi",
  kitchen: "kitchen",
  settings: "pengaturan",
};

export function getAdminSectionRoute(key: AdminNavKey) {
  const segment = ADMIN_SECTION_SEGMENTS[key] ?? "dashboard";
  if (key === "kitchen") {
    return "/orders";
  }
  if (key === "settings") {
    return "/admin/pengaturan";
  }
  return `/admin/${segment}`;
}

export function getAdminSectionKeyFromSegment(segment: string | undefined): AdminNavKey {
  if (!segment) {
    return "overview";
  }
  const match = (Object.entries(ADMIN_SECTION_SEGMENTS) as Array<[AdminNavKey, string]>).find(
    ([, slug]) => slug === segment
  );
  if (match) {
    const [key] = match;
    if (key === "kitchen") {
      return "overview";
    }
    if (key === "settings") {
      return "settings";
    }
    return key;
  }
  return "overview";
}
