"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { formatCurrency } from "@/lib/products";
import { useProductCatalogData } from "@/hooks/useProductCatalog";
import { categoryToPath } from "@/lib/navigation";
import { useCart, type PaymentMethodKey } from "@/lib/cartStore";
import { isCashierCardSlug, isTakeawaySlug } from "@/lib/tables";

const ADMIN_SETTINGS_STORAGE_KEY = "spm-admin-settings";
const PAYMENT_SETTINGS_EVENT = "spm:payment-updated";

const formatPercentageDisplay = (value: number): string => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "0%";
  }
  const formatted = Number.isInteger(numeric)
    ? numeric.toFixed(0)
    : numeric.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted}%`;
};

type UserPaymentConfig = {
  qrisEnabled: boolean;
  shopeePayEnabled: boolean;
  goPayEnabled: boolean;
  ovoEnabled: boolean;
  danaEnabled: boolean;
};

type CashierPaymentConfig = {
  qrisEnabled: boolean;
  cashEnabled: boolean;
  cardEnabled: boolean;
};

type PaymentState = {
  cashier: CashierPaymentConfig;
  user: UserPaymentConfig;
};

type StoredAdminSettings = {
  payment?: {
    cashier?: Partial<CashierPaymentConfig>;
    user?: Partial<UserPaymentConfig>;
    cashEnabled?: boolean;
    cardEnabled?: boolean;
    qrisEnabled?: boolean;
    shopeePayEnabled?: boolean;
    goPayEnabled?: boolean;
    ovoEnabled?: boolean;
    danaEnabled?: boolean;
    [key: string]: unknown;
  };
};

const DEFAULT_PAYMENT_STATE: PaymentState = {
  cashier: {
    qrisEnabled: true,
    cashEnabled: true,
    cardEnabled: true,
  },
  user: {
    qrisEnabled: true,
    shopeePayEnabled: false,
    goPayEnabled: false,
    ovoEnabled: false,
    danaEnabled: false,
  },
};

const createDefaultPaymentState = (): PaymentState => ({
  cashier: { ...DEFAULT_PAYMENT_STATE.cashier },
  user: { ...DEFAULT_PAYMENT_STATE.user },
});

type PaymentMethodDefinition = {
  key: PaymentMethodKey;
  label: string;
  active: boolean;
  renderIcon: (isActive: boolean) => React.ReactNode;
};

export default function CartPage() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    lines,
    summary,
    updateQuantity,
    removeItem,
    tableId,
    paymentMethod,
    setPaymentMethod,
  } = useCart();
  const { allProductsWithCategory } = useProductCatalogData();
  const isCashierContext =
    pathname?.startsWith("/cashier") ||
    isCashierCardSlug(tableId) ||
    isTakeawaySlug(tableId);
  const baseMenuPath = isCashierContext ? "/cashier/menu" : "/menu";
  const baseCartPath = isCashierContext ? "/cashier/cart" : "/cart";
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [paymentToggles, setPaymentToggles] = useState<PaymentState>(() =>
    createDefaultPaymentState()
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const applyPaymentSettings = () => {
      try {
        const raw = window.localStorage.getItem(ADMIN_SETTINGS_STORAGE_KEY);
        if (!raw) {
          setPaymentToggles(createDefaultPaymentState());
          return;
        }
        const parsed = JSON.parse(raw) as StoredAdminSettings;
        const payment = parsed?.payment ?? {};
        const cashier = (payment as { cashier?: Partial<CashierPaymentConfig> }).cashier ?? {};
        const user = (payment as { user?: Partial<UserPaymentConfig> }).user ?? {};
        const resolveToggle = (
          primary: unknown,
          legacy: unknown,
          fallback: boolean
        ): boolean =>
          typeof primary === "boolean"
            ? primary
            : typeof legacy === "boolean"
            ? legacy
            : fallback;

        setPaymentToggles({
          cashier: {
            qrisEnabled: resolveToggle(
              cashier.qrisEnabled,
              payment.qrisEnabled,
              DEFAULT_PAYMENT_STATE.cashier.qrisEnabled
            ),
            cashEnabled: resolveToggle(
              cashier.cashEnabled,
              payment.cashEnabled,
              DEFAULT_PAYMENT_STATE.cashier.cashEnabled
            ),
            cardEnabled: resolveToggle(
              cashier.cardEnabled,
              payment.cardEnabled,
              DEFAULT_PAYMENT_STATE.cashier.cardEnabled
            ),
          },
          user: {
            qrisEnabled: resolveToggle(
              user.qrisEnabled,
              payment.qrisEnabled,
              DEFAULT_PAYMENT_STATE.user.qrisEnabled
            ),
            shopeePayEnabled: resolveToggle(
              user.shopeePayEnabled,
              (payment as { shopeePayEnabled?: boolean }).shopeePayEnabled,
              DEFAULT_PAYMENT_STATE.user.shopeePayEnabled
            ),
            goPayEnabled: resolveToggle(
              user.goPayEnabled,
              (payment as { goPayEnabled?: boolean }).goPayEnabled,
              DEFAULT_PAYMENT_STATE.user.goPayEnabled
            ),
            ovoEnabled: resolveToggle(
              user.ovoEnabled,
              (payment as { ovoEnabled?: boolean }).ovoEnabled,
              DEFAULT_PAYMENT_STATE.user.ovoEnabled
            ),
            danaEnabled: resolveToggle(
              user.danaEnabled,
              (payment as { danaEnabled?: boolean }).danaEnabled,
              DEFAULT_PAYMENT_STATE.user.danaEnabled
            ),
          },
        });
      } catch (error) {
        console.error("Failed to load admin payment settings", error);
        setPaymentToggles(createDefaultPaymentState());
      }
    };

    applyPaymentSettings();

    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === ADMIN_SETTINGS_STORAGE_KEY) {
        applyPaymentSettings();
      }
    };

    const handlePaymentUpdated = () => applyPaymentSettings();

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener(PAYMENT_SETTINGS_EVENT, handlePaymentUpdated);
    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener(PAYMENT_SETTINGS_EVENT, handlePaymentUpdated);
    };
  }, []);

  const withTableQuery = useCallback(
    (path: string) => {
      let targetPath = path;
      if (isCashierContext && path.startsWith("/menu")) {
        targetPath = path.replace("/menu", baseMenuPath);
      }
      if (!tableId) {
        return targetPath;
      }
      const [base, hash] = targetPath.split("#");
      const separator = base.includes("?") ? "&" : "?";
      return `${base}${separator}cards=${encodeURIComponent(tableId)}${
        hash ? `#${hash}` : ""
      }`;
    },
    [baseMenuPath, isCashierContext, tableId]
  );

  const recommendations = useMemo(() => {
    const seen = new Set<string>();
    return allProductsWithCategory.filter(({ product }) => {
      if (seen.has(product.id)) {
        return false;
      }
      seen.add(product.id);
      return true;
    })
      .filter(({ product }) => !lines.some((line) => line.productId === product.id))
      .slice(0, 3);
  }, [lines, allProductsWithCategory]);

  const materialIconRenderer = useCallback(
    (iconName: string) =>
      // eslint-disable-next-line react/display-name
      (isActive: boolean) => (
        <span
          className={`material-symbols-outlined text-lg ${
            isActive ? "text-emerald-600" : "text-gray-400"
          }`}
        >
          {iconName}
        </span>
      ),
    []
  );

  const renderShopeeIcon = useCallback(
    (isActive: boolean) => (
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl transition-opacity"
        style={{ opacity: isActive ? 1 : 0.4 }}
      >
        <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
          <path
            fill="#FF5F00"
            d="M11 13h14c1.657 0 3 1.343 3 3v12c0 1.657-1.343 3-3 3H11c-1.657 0-3-1.343-3-3V16c0-1.657 1.343-3 3-3z"
          />
          <path
            fill="#FF5F00"
            d="M22.5 12h-2.4c0-1.274-1.001-2.3-2.1-2.3s-2.1 1.026-2.1 2.3H13.5c0-2.499 2.05-4.7 4.5-4.7s4.5 2.201 4.5 4.7z"
          />
          <text
            x="18"
            y="25"
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#FFFFFF"
            fontFamily="Inter, 'Helvetica Neue', Arial, sans-serif"
          >
            S
          </text>
        </svg>
      </span>
    ),
    []
  );

  const renderGoPayIcon = useCallback(
    (isActive: boolean) => (
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl transition-opacity"
        style={{ opacity: isActive ? 1 : 0.4 }}
      >
        <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="gopayGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#02C3FF" />
              <stop offset="100%" stopColor="#0095DA" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="28" height="28" rx="14" fill="url(#gopayGradient)" />
          <rect x="11" y="11" width="16" height="16" rx="6" fill="#FFFFFF" />
          <rect x="14" y="13" width="10" height="2" rx="1" fill="#00AED6" opacity="0.7" />
          <path
            fill="#00AED6"
            d="M24.4 20.1c0-.994-.82-1.8-1.82-1.8s-1.82.806-1.82 1.8c0 .662.35 1.245.88 1.554v1.676c0 .402.33.73.73.73h.42c.402 0 .73-.328.73-.73v-1.676c.53-.309.88-.892.88-1.554z"
          />
        </svg>
      </span>
    ),
    []
  );

  const renderOvoIcon = useCallback(
    (isActive: boolean) => (
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl transition-opacity"
        style={{ opacity: isActive ? 1 : 0.4 }}
      >
        <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
          <circle cx="18" cy="18" r="14" fill="#4C2A85" />
          <circle cx="18" cy="18" r="8.5" fill="none" stroke="#FFFFFF" strokeWidth="3" />
        </svg>
      </span>
    ),
    []
  );

  const renderDanaIcon = useCallback(
    (isActive: boolean) => (
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl transition-opacity"
        style={{ opacity: isActive ? 1 : 0.4 }}
      >
        <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="danaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00A6FF" />
              <stop offset="100%" stopColor="#0077D7" />
            </linearGradient>
          </defs>
          <circle cx="18" cy="18" r="14" fill="url(#danaGradient)" />
          <path
            fill="#F8FBFF"
            d="M10.4 16.2c0-.53.42-.97.95-1.01 2.1-.16 4.1-.83 6.09-1.57 2.28-.86 4.56-1.72 6.93-1.72 1.48 0 1.63.92 1.63 2.08v5.86c0 .69-.48 1.3-1.15 1.46-2.04.49-4.2 1.12-6.16 1.95-2.04.87-4.1 1.82-6.33 1.82-0.98 0-1.96-.62-1.96-1.59V16.2z"
          />
        </svg>
      </span>
    ),
    []
  );

  const paymentMethods: PaymentMethodDefinition[] = useMemo(() => {
    if (isCashierContext) {
      const options = paymentToggles.cashier;
      return [
        {
          key: "qris",
          label: "QRIS",
          active: options.qrisEnabled,
          renderIcon: materialIconRenderer("qr_code_2"),
        },
        {
          key: "cash",
          label: "Tunai",
          active: options.cashEnabled,
          renderIcon: materialIconRenderer("payments"),
        },
        {
          key: "card",
          label: "Kartu/Debit",
          active: options.cardEnabled,
          renderIcon: materialIconRenderer("credit_card"),
        },
      ];
    }

    const options = paymentToggles.user;
    return [
      {
        key: "qris",
        label: "QRIS",
        active: options.qrisEnabled,
        renderIcon: materialIconRenderer("qr_code_2"),
      },
      {
        key: "shopeepay",
        label: "ShopeePay",
        active: options.shopeePayEnabled,
        renderIcon: renderShopeeIcon,
      },
      {
        key: "gopay",
        label: "GoPay",
        active: options.goPayEnabled,
        renderIcon: renderGoPayIcon,
      },
      {
        key: "ovo",
        label: "OVO",
        active: options.ovoEnabled,
        renderIcon: renderOvoIcon,
      },
      {
        key: "dana",
        label: "Dana",
        active: options.danaEnabled,
        renderIcon: renderDanaIcon,
      },
    ];
  }, [
    isCashierContext,
    materialIconRenderer,
    paymentToggles,
    renderDanaIcon,
    renderGoPayIcon,
    renderOvoIcon,
    renderShopeeIcon,
  ]);

  useEffect(() => {
    const activeKeys = paymentMethods.filter((method) => method.active).map((method) => method.key);
    if (activeKeys.length === 0) {
      if (paymentMethod !== null) {
        setPaymentMethod(null);
      }
      return;
    }
    if (!paymentMethod || !activeKeys.includes(paymentMethod)) {
      setPaymentMethod(activeKeys[0]);
    }
  }, [paymentMethods, paymentMethod, setPaymentMethod]);

  if (lines.length === 0) {
    return (
      <AppShell
        activeSlug="pistachio-series"
        hideNavigation
        hideSearch
        title="Checkout"
        hideCartFab
        backHref={withTableQuery(categoryToPath("all"))}
        hideLocation
      >
        <main className="p-6">
          <div className="max-w-2xl mx-auto text-center bg-white/70 backdrop-blur rounded-3xl shadow-sm p-10">
            <p className="text-lg font-semibold text-gray-700">
              Keranjangmu masih kosong.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Jelajahi menu dan temukan minuman favoritmu.
            </p>
            <Link
              href={withTableQuery(categoryToPath("all"))}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-color)] text-white px-6 py-3 text-sm font-semibold mt-6"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Kembali ke Menu
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeSlug="pistachio-series"
      hideNavigation
      hideSearch
      title="Checkout"
      hideCartFab
      backHref={withTableQuery(categoryToPath("all"))}
      hideLocation
    >
      <div className="grid gap-6 p-4 pb-32 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <article className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
              Detail Pesanan
            </p>

            <div className="space-y-6">
              {lines.map((line) => (
                <div
                  key={`${line.productId}-${line.cartIndex}`}
                  className="rounded-2xl border border-white/70 bg-white/60 p-4 sm:p-5 space-y-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl shadow-inner">
                        <Image
                          src={line.product.image}
                          alt={line.product.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-gray-800">
                          {line.product.name}
                        </h2>
                        <p className="text-xs text-gray-500">
                          {line.product.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="cart-quantity-button h-8 w-8 rounded-full border flex items-center justify-center"
                          onClick={() => {
                            if (line.quantity - 1 <= 0) {
                              setPendingRemove(line.cartIndex);
                              return;
                            }
                            updateQuantity(line.cartIndex, line.quantity - 1);
                          }}
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="text-sm font-semibold text-gray-700">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="cart-quantity-button h-8 w-8 rounded-full border flex items-center justify-center"
                          onClick={() => updateQuantity(line.cartIndex, line.quantity + 1)}
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Subtotal</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {line.lineTotalLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 text-xs text-gray-600">
                    {line.options.map((option) => (
                      <div key={option.group + option.label} className="flex justify-between">
                        <span className="font-medium text-gray-500">
                          {option.group}
                        </span>
                        <span>
                          {option.label}
                          {option.priceDelta
                            ? ` (${formatCurrency(option.priceDelta)})`
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                    <Link
                      href={`/products/${line.productId}?redirect=${encodeURIComponent(
                        "/cart"
                      )}&updateIndex=${line.cartIndex}&qty=${line.quantity}&selected=${encodeURIComponent(
                        JSON.stringify(line.options)
                      )}`}
                      className="cart-back-link text-emerald-600 hover:text-emerald-700"
                    >
                      Ubah
                    </Link>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      className="cart-remove-button inline-flex items-center gap-1 text-red-400 hover:text-red-600"
                      onClick={() => setPendingRemove(line.cartIndex)}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>

          {recommendations.length > 0 ? (
            <section className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                    Menu Special Hari Ini
                  </p>
                  <p className="text-base font-semibold text-gray-800 mt-1">
                    Rekomendasi tambahan khusus untukmu
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4" data-animate-grid>
                {recommendations.map(({ product }, index) => (
                  <ProductCard
                    key={`recommend-${product.id}`}
                    product={product}
                    index={index}
                    redirectTo={withTableQuery(baseCartPath)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Ada tambahan lainnya?
              </p>
              <p className="text-xs text-gray-500">
                Kamu bisa tambahin juga loh
              </p>
            </div>
            <Link
              href={withTableQuery(categoryToPath("all"))}
              className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-2 text-xs font-semibold hover:bg-emerald-100"
            >
              Tambah
              <span className="material-symbols-outlined text-sm">add</span>
            </Link>
          </section>

          <section className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Voucher Diskon</p>
              <button
                type="button"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Gunakan
              </button>
            </div>
            <input
              type="text"
              placeholder="Masukkan kode voucher"
              className="w-full rounded-full border border-white/60 bg-white/70 px-4 py-3 text-sm text-gray-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
            />
          </section>

          <section className="rounded-3xl bg-white/80 backdrop-blur shadow-sm p-6 space-y-4">
            <p className="text-sm font-semibold text-gray-700">Metode Pembayaran</p>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const isSelected = paymentMethod === method.key;
                const baseButtonClass =
                  "w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40";
                const stateClass = method.active
                  ? isSelected
                    ? "bg-emerald-50/90 border-emerald-200 text-emerald-700 shadow-sm"
                    : "bg-white/80 border-white/70 text-gray-700 hover:border-emerald-200 hover:bg-white"
                  : "bg-white/60 border-white/70 text-gray-400 cursor-not-allowed";

                return (
                  <button
                    key={method.key}
                    type="button"
                    disabled={!method.active}
                    onClick={() => method.active && setPaymentMethod(method.key)}
                    className={`${baseButtonClass} ${stateClass}`}
                  >
                    <span className="flex items-center gap-3">
                      {method.renderIcon(method.active)}
                      <span className="font-medium">{method.label}</span>
                    </span>
                    {method.active ? (
                      <span className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            isSelected ? "text-emerald-600" : "text-gray-400"
                          }`}
                        >
                          {isSelected ? "Dipilih" : "Pilih"}
                        </span>
                        <span
                          className={`material-symbols-outlined ${
                            isSelected ? "text-emerald-500" : "text-gray-300"
                          }`}
                        >
                          {isSelected ? "check_circle" : "radio_button_unchecked"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-400">Sedang tidak aktif</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        </section>

        <aside className="rounded-3xl bg-white/85 backdrop-blur shadow-lg border border-white/60 p-6 space-y-6 h-fit">
          <div>
            <p className="text-sm font-semibold text-gray-700">Ringkasan Pesanan</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>{summary.subtotalLabel}</span>
              </div>
              {summary.serviceChargeRate > 0 || summary.serviceCharge > 0 ? (
                <div className="flex justify-between text-gray-500">
                  <span>
                    Service Charge ({formatPercentageDisplay(summary.serviceChargeRate)})
                  </span>
                  <span>{summary.serviceChargeLabel}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-gray-500">
                <span>Pajak ({formatPercentageDisplay(summary.taxRate)})</span>
                <span>{summary.taxLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/60">
            <span className="text-base font-semibold text-gray-700">Total</span>
            <span className="text-lg font-bold text-gray-900">
              {summary.totalLabel}
            </span>
          </div>

          <button
            type="button"
            disabled={!paymentMethod}
            className="cart-checkout-button w-full px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              if (!paymentMethod) {
                return;
              }
              router.push("/checkout");
            }}
          >
            Pesan Sekarang
          </button>
        </aside>
      </div>

      {pendingRemove !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white/95 p-6 shadow-xl space-y-4">
            <p className="text-sm font-semibold text-gray-800">
              Hapus pesanan ini dari keranjang?
            </p>
            <p className="text-xs text-gray-500">
              Kamu masih bisa menambahkannya kembali kapan saja di halaman menu.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100"
                onClick={() => setPendingRemove(null)}
              >
                Batalkan
              </button>
              <button
                type="button"
                className="rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-red-600"
                onClick={() => {
                  removeItem(pendingRemove);
                  setPendingRemove(null);
                }}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
