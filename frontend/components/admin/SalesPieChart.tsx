"use client";

import { useEffect, useMemo, useState } from "react";

type PieDatum = {
  label: string;
  value: number;
  quantity: number;
};

type SalesPieChartProps = {
  chartData: PieDatum[];
  listData: PieDatum[];
  title?: string;
};

const COLORS = [
  "#34d399",
  "#60a5fa",
  "#fbbf24",
  "#f472b6",
  "#a78bfa",
  "#f97316",
  "#22d3ee",
  "#facc15",
  "#2dd4bf",
];

const CENTER = 110;
const OUTER_RADIUS = 90;
const INNER_RADIUS = 58;

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeDonutSegment(startAngle: number, endAngle: number) {
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const outerStart = polarToCartesian(CENTER, CENTER, OUTER_RADIUS, endAngle);
  const outerEnd = polarToCartesian(CENTER, CENTER, OUTER_RADIUS, startAngle);
  const innerStart = polarToCartesian(CENTER, CENTER, INNER_RADIUS, endAngle);
  const innerEnd = polarToCartesian(CENTER, CENTER, INNER_RADIUS, startAngle);

  return [
    `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArcFlag} 0 ${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)}`,
    `L ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)}`,
    `A ${INNER_RADIUS} ${INNER_RADIUS} 0 ${largeArcFlag} 1 ${innerStart.x.toFixed(3)} ${innerStart.y.toFixed(3)}`,
    "Z",
  ].join(" ");
}

export function SalesPieChart({ chartData, listData, title }: SalesPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    setActiveIndex(null);
  }, [chartData]);

  const totalValue = useMemo(
    () => chartData.reduce((sum, item) => sum + Math.max(item.value, 0), 0),
    [chartData]
  );

  const totalQuantity = useMemo(
    () => chartData.reduce((sum, item) => sum + Math.max(item.quantity, 0), 0),
    [chartData]
  );

  const segments = useMemo(() => {
    if (totalValue <= 0) {
      return [] as Array<{
        index: number;
        start: number;
        end: number;
        color: string;
      }>;
    }

    let cursor = 0;
    return chartData
      .map((item, index) => {
        const safeValue = Math.max(item.value, 0);
        if (safeValue <= 0) {
          return null;
        }
        const ratio = safeValue / totalValue;
        const start = cursor * 360;
        const end = (cursor + ratio) * 360;
        cursor += ratio;
        return {
          index,
          start,
          end,
          color: COLORS[index % COLORS.length],
        };
      })
      .filter((segment): segment is { index: number; start: number; end: number; color: string } => Boolean(segment));
  }, [chartData, totalValue]);

  const activeItem = activeIndex != null ? chartData[activeIndex] : null;
  const activeColor = activeIndex != null ? COLORS[activeIndex % COLORS.length] : undefined;

  const displayLabel = activeItem?.label ?? "Total";
  const displayValue = activeItem?.value ?? totalValue;
  const displayQuantity = activeItem?.quantity ?? totalQuantity;

  const formatCurrency = (amount: number) =>
    amount.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(220px,1fr)_minmax(0,2fr)]">
      <div className="flex items-center justify-center">
        <div className="relative h-56 w-56">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 220 220"
            role="img"
            aria-label="Komposisi penjualan per kategori"
            onMouseLeave={() => setActiveIndex(null)}
          >
            <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} fill="#f1f5f9" />
            {segments.length === 0
              ? null
              : segments.map((segment) => {
                  const path = describeDonutSegment(segment.start, segment.end);
                  const index = segment.index;
                  const data = chartData[index];
                  if (!data) {
                    return null;
                  }
                  return (
                    <path
                      key={`${data.label}-${segment.start.toFixed(2)}`}
                      d={path}
                      fill={segment.color}
                      fillOpacity={activeIndex == null || activeIndex === index ? 0.95 : 0.25}
                      className="outline-none transition-all duration-150"
                      onMouseEnter={() => setActiveIndex(index)}
                      onFocus={() => setActiveIndex(index)}
                      onBlur={() => setActiveIndex(null)}
                      tabIndex={0}
                    >
                      <title>
                        {`${data.label}: ${formatCurrency(Math.max(data.value, 0))} • ${Math.max(data.quantity, 0).toLocaleString("id-ID")} terjual`}
                      </title>
                    </path>
                  );
                })}
          </svg>
          <div className="pointer-events-none absolute inset-12 flex flex-col items-center justify-center rounded-full bg-white/95 text-center shadow-inner">
            <p
              className="text-[10px] uppercase tracking-[0.35em] text-gray-400"
              style={activeColor ? { color: activeColor } : undefined}
            >
              {displayLabel}
            </p>
            <p className="mt-2 text-base font-semibold text-gray-800">
              {displayValue > 0 ? formatCurrency(displayValue) : "Rp 0"}
            </p>
            <p className="text-[11px] font-medium text-emerald-600">
              {displayQuantity.toLocaleString("id-ID")} terjual
            </p>
            {title ? (
              <p className="mt-2 text-[11px] text-gray-500 px-4 leading-snug">{title}</p>
            ) : null}
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {listData.map((item, index) => {
          const percentage = totalValue > 0 ? ((Math.max(item.value, 0) / totalValue) * 100).toFixed(1) : "0.0";
          const isActive = activeIndex === index;
          const color = COLORS[index % COLORS.length];
          return (
            <li
              key={item.label}
              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                isActive
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-emerald-50/70 bg-white/80 hover:bg-emerald-50/60"
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
              tabIndex={0}
            >
              <span className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium truncate max-w-[160px]" title={item.label}>
                  {item.label}
                </span>
              </span>
              <span className="text-xs text-right text-gray-500 flex flex-col items-end">
                <span className="font-semibold text-gray-800">{formatCurrency(Math.max(item.value, 0))}</span>
                <span className="text-emerald-600 font-semibold">
                  {Math.max(item.quantity, 0).toLocaleString("id-ID")}
                  <span className="text-[11px] font-normal"> terjual</span>
                </span>
                <span className="text-[11px]">{percentage}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
