"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SalesPieChart } from "@/components/admin/SalesPieChart";
import { SalesTrendChart, type SalesTrendPoint } from "@/components/admin/SalesTrendChart";
import { useOrders } from "@/lib/orderStore";

const FALLBACK_TREND_SAMPLES: Record<"daily" | "weekly" | "monthly", SalesTrendPoint[]> = {
  daily: [
    { label: "Sen, 8 Apr", value: 2150000, quantity: 42 },
    { label: "Sel, 9 Apr", value: 2485000, quantity: 46 },
    { label: "Rab, 10 Apr", value: 2675000, quantity: 51 },
    { label: "Kam, 11 Apr", value: 2540000, quantity: 47 },
    { label: "Jum, 12 Apr", value: 2985000, quantity: 56 },
    { label: "Sab, 13 Apr", value: 3150000, quantity: 63 },
    { label: "Min, 14 Apr", value: 2860000, quantity: 58 },
  ],
  weekly: [
    { label: "26 Feb - 3 Mar", value: 12540000, quantity: 268 },
    { label: "4 - 10 Mar", value: 13280000, quantity: 284 },
    { label: "11 - 17 Mar", value: 14120000, quantity: 297 },
    { label: "18 - 24 Mar", value: 13850000, quantity: 289 },
    { label: "25 - 31 Mar", value: 14680000, quantity: 304 },
    { label: "1 - 7 Apr", value: 15260000, quantity: 318 },
    { label: "8 - 14 Apr", value: 16120000, quantity: 335 },
    { label: "15 - 21 Apr", value: 16890000, quantity: 349 },
  ],
  monthly: [
    { label: "Nov 2023", value: 18250000, quantity: 365 },
    { label: "Des 2023", value: 20500000, quantity: 418 },
    { label: "Jan 2024", value: 19850000, quantity: 402 },
    { label: "Feb 2024", value: 18950000, quantity: 387 },
    { label: "Mar 2024", value: 21400000, quantity: 436 },
    { label: "Apr 2024", value: 22350000, quantity: 452 },
  ],
};

const FALLBACK_SALES_PIE_DATA = [
  { label: "Pistachio Series", value: 7450000, quantity: 162 },
  { label: "Matcha Club", value: 5180000, quantity: 124 },
  { label: "Signature Coffee", value: 4680000, quantity: 110 },
  { label: "Snack & Dessert", value: 3450000, quantity: 98 },
  { label: "Seasonal Specials", value: 2300000, quantity: 62 },
  { label: "Cold Brew Lab", value: 1850000, quantity: 48 },
  { label: "Beans Subscription", value: 1250000, quantity: 27 },
  { label: "Merchandise", value: 950000, quantity: 34 },
];

const SALES_RANGE_OPTIONS = [
  { key: "daily", label: "Harian" },
  { key: "weekly", label: "Mingguan" },
  { key: "monthly", label: "Bulanan" },
  { key: "custom", label: "Custom" },
] as const;

type SalesRangeKey = (typeof SALES_RANGE_OPTIONS)[number]["key"];

type PieDatum = {
  label: string;
  value: number;
  quantity: number;
};

type SalesInsights = {
  pieChart: PieDatum[];
  pieList: PieDatum[];
  pieLabel: string;
  pieIsSample: boolean;
  trend: SalesTrendPoint[];
  trendLabel: string;
  trendIsSample: boolean;
  customError: string | null;
};

function useSalesInsights(range: SalesRangeKey, customStart: string, customEnd: string): SalesInsights {
  const { orders } = useOrders();

  const insights = useMemo(() => {
    const normalizeDate = (input: Date) => {
      const normalized = new Date(input);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const startOfWeek = (input: Date) => {
      const date = normalizeDate(input);
      const day = date.getDay();
      const diff = (day + 6) % 7;
      date.setDate(date.getDate() - diff);
      return date;
    };

    const startOfMonth = (input: Date) => {
      const date = normalizeDate(input);
      date.setDate(1);
      return date;
    };

    const addDays = (input: Date, days: number) => {
      const date = new Date(input);
      date.setDate(date.getDate() + days);
      return normalizeDate(date);
    };

    const addMonths = (input: Date, months: number) => {
      const date = new Date(input);
      date.setMonth(date.getMonth() + months);
      return normalizeDate(date);
    };

    const differenceInDays = (start: Date, end: Date) => Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const endOfMonth = (input: Date) => {
      const date = new Date(input);
      date.setMonth(date.getMonth() + 1, 0);
      return normalizeDate(date);
    };

    const alignToBucketStart = (date: Date, bucket: "day" | "week" | "month") => {
      if (bucket === "week") {
        return startOfWeek(date);
      }
      if (bucket === "month") {
        return startOfMonth(date);
      }
      return normalizeDate(date);
    };

    const advanceBucket = (date: Date, bucket: "day" | "week" | "month", steps = 1) => {
      if (bucket === "week") {
        return addDays(date, 7 * steps);
      }
      if (bucket === "month") {
        return addMonths(date, steps);
      }
      return addDays(date, steps);
    };

    const bucketStartDate = (date: Date, bucket: "day" | "week" | "month") => alignToBucketStart(date, bucket);

    const today = normalizeDate(new Date());
    const dayLabelFormatter = new Intl.DateTimeFormat("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const monthLabelFormatter = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    });
    const dayMonthFormatter = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    });
    const fullDateFormatter = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let insightStart = today;
    let insightEnd = today;
    let insightLabel = `Hari ini (${dayLabelFormatter.format(today)})`;

    let trendBucket: "day" | "week" | "month" = "day";
    let trendStart = addDays(today, -6);
    let trendCount = 7;
    let trendLabel = "7 hari terakhir";

    let customError: string | null = null;

    switch (range) {
      case "daily": {
        insightStart = today;
        insightEnd = today;
        insightLabel = `Hari ini (${dayLabelFormatter.format(today)})`;
        trendBucket = "day";
        trendStart = addDays(today, -6);
        trendCount = 7;
        trendLabel = "7 hari terakhir";
        break;
      }
      case "weekly": {
        insightStart = addDays(today, -6);
        insightEnd = today;
        insightLabel = "7 hari terakhir";
        trendBucket = "week";
        const currentWeekStart = startOfWeek(today);
        trendCount = 8;
        trendStart = addDays(currentWeekStart, -7 * (trendCount - 1));
        trendLabel = "8 minggu terakhir";
        break;
      }
      case "monthly": {
        const currentMonthStart = startOfMonth(today);
        insightStart = currentMonthStart;
        insightEnd = today;
        insightLabel = `Bulan ${monthLabelFormatter.format(today)}`;
        trendBucket = "month";
        trendCount = 6;
        trendStart = addMonths(currentMonthStart, -(trendCount - 1));
        trendLabel = "6 bulan terakhir";
        break;
      }
      case "custom": {
        let parsedStart = customStart ? normalizeDate(new Date(customStart)) : null;
        let parsedEnd = customEnd ? normalizeDate(new Date(customEnd)) : null;

        if (!parsedStart || Number.isNaN(parsedStart.getTime()) || !parsedEnd || Number.isNaN(parsedEnd.getTime())) {
          customError = "Pilih rentang tanggal valid.";
          parsedStart = addDays(today, -6);
          parsedEnd = today;
        }

        if (parsedStart > parsedEnd) {
          const swap = parsedStart;
          parsedStart = parsedEnd;
          parsedEnd = swap;
        }

        insightStart = parsedStart;
        insightEnd = parsedEnd > today ? today : parsedEnd;

        let diffDays = differenceInDays(insightStart, insightEnd) + 1;
        if (diffDays > 30) {
          customError = "Rentang maksimal 30 hari.";
          insightEnd = addDays(insightStart, 29);
          if (insightEnd > today) {
            insightEnd = today;
          }
          diffDays = differenceInDays(insightStart, insightEnd) + 1;
        }

        insightLabel = `${fullDateFormatter.format(insightStart)} - ${fullDateFormatter.format(insightEnd)}`;

        trendBucket = "day";
        trendStart = insightStart;
        trendCount = Math.max(1, diffDays);
        trendLabel = `${dayMonthFormatter.format(insightStart)} - ${dayMonthFormatter.format(insightEnd)}`;
        break;
      }
      default:
        break;
    }

    if (insightEnd > today) {
      insightEnd = today;
    }
    if (insightStart > insightEnd) {
      insightStart = insightEnd;
    }

    const trendStartAligned = alignToBucketStart(trendStart, trendBucket);
    const trendLastStart = advanceBucket(trendStartAligned, trendBucket, trendCount - 1);

    const pieBuckets = new Map<string, { value: number; quantity: number }>();

    orders.forEach((order) => {
      const createdAt = new Date(order.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        return;
      }
      const normalizedOrderDate = normalizeDate(createdAt);
      if (normalizedOrderDate < insightStart || normalizedOrderDate > insightEnd) {
        return;
      }

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const label = item.category?.trim() || item.name || "Lainnya";
          const entry = pieBuckets.get(label) ?? { value: 0, quantity: 0 };
          const itemValue = (item.unitPrice ?? 0) * (item.quantity ?? 0);
          entry.value += itemValue > 0 ? itemValue : 0;
          entry.quantity += item.quantity ?? 0;
          pieBuckets.set(label, entry);
        });
      }
    });

    const pieList = Array.from(pieBuckets.entries())
      .map(([label, data]) => ({ label, value: data.value, quantity: data.quantity }))
      .sort((a, b) => b.value - a.value);

    const pieHasData = pieList.some((item) => item.value > 0 || item.quantity > 0);
    const pieResult = pieHasData
      ? pieList
      : FALLBACK_SALES_PIE_DATA.map((item) => ({ ...item }));

    const trendBuckets = new Map<number, { value: number; quantity: number }>();
    const trendRangeEndForEntries = (() => {
      if (trendBucket === "week") {
        return addDays(trendLastStart, 6);
      }
      if (trendBucket === "month") {
        return endOfMonth(trendLastStart);
      }
      return advanceBucket(trendStartAligned, "day", trendCount - 1);
    })();

    orders.forEach((order) => {
      const createdAt = new Date(order.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        return;
      }
      const normalizedOrderDate = normalizeDate(createdAt);
      if (normalizedOrderDate < trendStartAligned || normalizedOrderDate > trendRangeEndForEntries) {
        return;
      }

      const bucketDate = bucketStartDate(normalizedOrderDate, trendBucket);
      if (bucketDate < trendStartAligned || bucketDate > trendLastStart) {
        return;
      }

      const key = bucketDate.getTime();
      const entry = trendBuckets.get(key) ?? { value: 0, quantity: 0 };
      entry.value += order.total;
      const itemCount = order.items?.reduce((acc, item) => acc + (item.quantity ?? 0), 0) ?? 0;
      entry.quantity += itemCount;
      trendBuckets.set(key, entry);
    });

    const formatTrendLabel = (bucketDate: Date) => {
      if (trendBucket === "month") {
        return monthLabelFormatter.format(bucketDate);
      }
      if (trendBucket === "week") {
        const weekEnd = addDays(bucketDate, 6);
        return `${dayMonthFormatter.format(bucketDate)} - ${dayMonthFormatter.format(weekEnd)}`;
      }
      return dayLabelFormatter.format(bucketDate);
    };

    const generateSampleTrend = () => {
      const baseSamples =
        trendBucket === "month"
          ? FALLBACK_TREND_SAMPLES.monthly
          : trendBucket === "week"
          ? FALLBACK_TREND_SAMPLES.weekly
          : FALLBACK_TREND_SAMPLES.daily;

      const results: SalesTrendPoint[] = [];
      let cursor = trendStartAligned;
      for (let index = 0; index < trendCount; index++) {
        const sample = baseSamples[Math.min(index, baseSamples.length - 1)];
        results.push({
          label: formatTrendLabel(cursor),
          value: sample.value,
          quantity: sample.quantity,
        });
        cursor = advanceBucket(cursor, trendBucket);
      }
      return results;
    };

    const trend: SalesTrendPoint[] = [];
    let cursor = trendStartAligned;
    for (let index = 0; index < trendCount; index++) {
      const key = cursor.getTime();
      const bucketData = trendBuckets.get(key) ?? { value: 0, quantity: 0 };
      trend.push({
        label: formatTrendLabel(cursor),
        value: bucketData.value,
        quantity: bucketData.quantity,
      });
      cursor = advanceBucket(cursor, trendBucket);
    }

    const trendHasData = trend.some((item) => item.value > 0 || item.quantity > 0);
    const trendResult = trendHasData ? trend : generateSampleTrend();

    return {
      pieChart: pieResult,
      pieList: pieResult,
      pieLabel: insightLabel,
      pieIsSample: !pieHasData,
      trend: trendResult,
      trendLabel,
      trendIsSample: !trendHasData,
      customError,
    };
  }, [orders, range, customStart, customEnd]);

  return insights;
}

export default function SalesReportPage() {
  const [salesRange, setSalesRange] = useState<SalesRangeKey>("daily");
  const [salesCustomStart, setSalesCustomStart] = useState("");
  const [salesCustomEnd, setSalesCustomEnd] = useState("");
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [trendTargetInput, setTrendTargetInput] = useState("" );
  const trendTargetValue = useMemo(() => {
    const numeric = Number(trendTargetInput.replace(/[^0-9]/g, ""));
    if (!numeric || Number.isNaN(numeric) || numeric <= 0) {
      return null;
    }
    return numeric;
  }, [trendTargetInput]);
  const salesInsights = useSalesInsights(salesRange, salesCustomStart, salesCustomEnd);
  const displayedCategories = useMemo(() => {
    const base = salesInsights.pieList ?? [];
    return showAllCategories ? base : base.slice(0, 5);
  }, [showAllCategories, salesInsights.pieList]);
  const hasExtraCategories = salesInsights.pieList.length > 5;

  useEffect(() => {
    setShowAllCategories(false);
  }, [salesRange, salesCustomStart, salesCustomEnd]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5f9] via-white to-[#ecfdf5]">
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white grid place-items-center shadow">
              <span className="material-symbols-outlined text-2xl">monitoring</span>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Laporan</p>
              <h1 className="text-xl font-semibold text-gray-700">Ringkasan Penjualan</h1>
              <p className="text-sm text-gray-500">Analisis performa penjualan berdasarkan kategori dan periode.</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Kembali ke Dashboard
            </Link>
            <p className="text-[11px] text-gray-400">
              Insight: {salesInsights.pieLabel}
              <span className="mx-1">·</span>
              Tren: {salesInsights.trendLabel}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8">
        <section className="rounded-3xl border border-emerald-100/80 bg-white/85 px-6 py-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-emerald-500">Filter Periode</p>
              <h2 className="text-sm font-semibold text-gray-700">Pilih rentang waktu laporan</h2>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-full border border-emerald-200 bg-emerald-50/50 p-1 shadow-sm">
                  {SALES_RANGE_OPTIONS.map((option) => {
                    const isActive = salesRange === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSalesRange(option.key)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          isActive ? "bg-emerald-500 text-white shadow" : "text-emerald-600 hover:bg-emerald-100"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {salesRange === "custom" ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                    <label className="font-semibold" htmlFor="filter-range-start">
                      Mulai
                    </label>
                    <input
                      id="filter-range-start"
                      type="date"
                      value={salesCustomStart}
                      onChange={(event) => setSalesCustomStart(event.target.value)}
                      className="rounded-lg border border-emerald-200 px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-100"
                    />
                    <label className="font-semibold" htmlFor="filter-range-end">
                      Selesai
                    </label>
                    <input
                      id="filter-range-end"
                      type="date"
                      value={salesCustomEnd}
                      onChange={(event) => setSalesCustomEnd(event.target.value)}
                      className="rounded-lg border border-emerald-200 px-2 py-1 text-xs focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-100"
                    />
                  </div>
                ) : null}
              </div>
              {salesRange === "custom" && salesInsights.customError ? (
                <p className="text-[11px] font-medium text-red-500">{salesInsights.customError}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-emerald-100/80 bg-white/85 p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-700">Insight Penjualan</h2>
              <p className="text-sm text-gray-500">Performa penjualan berdasarkan kategori.</p>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-medium text-emerald-600">Periode: {salesInsights.pieLabel}</p>
              {hasExtraCategories ? (
                <button
                  type="button"
                  onClick={() => setShowAllCategories((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
                >
                  {showAllCategories ? "Tutup Detail" : "Lihat Detail"}
                  <span className="material-symbols-outlined text-sm">
                    {showAllCategories ? "expand_less" : "expand_more"}
                  </span>
                </button>
              ) : null}
            </div>

            <SalesPieChart
              chartData={displayedCategories}
              listData={displayedCategories}
              title={`Periode: ${salesInsights.pieLabel}${showAllCategories ? " • Semua kategori" : " • Top 5"}`}
            />

            <div className="rounded-2xl border border-emerald-50 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-700">
              <p className="font-semibold text-emerald-800">Tips Analisis</p>
              <p>Kombinasikan data tren dan komposisi kategori untuk menentukan strategi promo mingguan.</p>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100/80 bg-white/85 p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Grafik Tren Penjualan</h2>
                <p className="text-sm text-gray-500">Pantau pendapatan dan produk terjual sesuai rentang waktu.</p>
                <p className="text-xs font-medium text-emerald-600 mt-1">Periode: {salesInsights.trendLabel}</p>
              </div>
              <div className="flex flex-col gap-2 text-right">
                <label htmlFor="trend-target-input" className="text-xs font-semibold uppercase tracking-wide text-emerald-500">
                  Target Pendapatan
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-500">
                      Rp
                    </span>
                    <input
                      id="trend-target-input"
                      inputMode="numeric"
                      value={trendTargetInput ? Number(trendTargetInput).toLocaleString("id-ID") : ""}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/[^0-9]/g, "");
                        setTrendTargetInput(digits);
                      }}
                      placeholder="Mis. 5.000.000"
                      className="rounded-full border border-emerald-200 bg-white px-9 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-100"
                    />
                  </div>
                  {trendTargetValue ? (
                    <button
                      type="button"
                      onClick={() => setTrendTargetInput("")}
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Reset
                    </button>
                  ) : null}
                </div>
                {trendTargetValue ? (
                  <p className="text-[11px] font-medium text-emerald-500">
                    Target aktif: {trendTargetValue.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                  </p>
                ) : (
                  <p className="text-[11px] text-gray-400">Masukkan nominal target untuk menandai batas pencapaian.</p>
                )}
              </div>
            </div>

            {salesInsights.trendIsSample ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                <span className="material-symbols-outlined text-base leading-none">info</span>
                Data sample ditampilkan sementara.
              </div>
            ) : null}

            <div className="mt-6">
              <SalesTrendChart
                data={salesInsights.trend}
                caption={
                  salesInsights.trendIsSample
                    ? `Periode sample: ${salesInsights.trendLabel}. Tambahkan pesanan untuk melihat grafik berdasarkan data aktual.`
                    : `Grafik diperbarui otomatis dari pesanan yang tercatat (${salesInsights.trendLabel}).`
                }
                target={trendTargetValue}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-emerald-100/80 bg-white/85 p-6 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Ekspor & Bagikan</h2>
              <p className="text-sm text-gray-500">Siapkan laporan penjualan versi PDF atau spreadsheet.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition">
                <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                Download PDF
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition">
                <span className="material-symbols-outlined text-sm">grid_on</span>
                Download CSV
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Ekspor otomatis akan menggunakan rentang waktu yang sedang aktif. Fitur integrasi backend akan menambahkan ringkasan metrik dan data transaksi detail.
          </p>
        </section>
      </main>
    </div>
  );
}
