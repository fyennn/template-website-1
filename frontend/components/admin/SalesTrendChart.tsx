"use client";

import { useMemo } from "react";

export type SalesTrendPoint = {
  label: string;
  value: number;
  quantity: number;
};

export type SalesTrendChartProps = {
  data: SalesTrendPoint[];
  caption?: string;
  target?: number | null;
};

export function SalesTrendChart({ data, caption, target }: SalesTrendChartProps) {
  const targetPatternId = useMemo(() => `target-stripe-${Math.random().toString(36).slice(2, 8)}`, []);

  const metrics = useMemo(() => {
    if (data.length === 0) {
      return null;
    }

    const chartHeight = 220;
    const chartWidth = Math.max(520, data.length * 120);
    const padding = 36;
    const maxDataValue = data.reduce((acc, item) => Math.max(acc, item.value), 0);
    const targetValue = typeof target === "number" && target > 0 ? target : null;
    const maxValue = targetValue ? Math.max(maxDataValue, targetValue) : maxDataValue;
    const safeMax = maxValue <= 0 ? 1 : maxValue;
    const step = (chartWidth - padding * 2) / Math.max(data.length - 1, 1);

    const points = data.map((item, index) => {
      const x = padding + index * step;
      const ratio = item.value <= 0 ? 0 : item.value / safeMax;
      const y = padding + (1 - ratio) * (chartHeight - padding * 2);
      return { x, y };
    });

    return {
      points,
      width: chartWidth,
      height: chartHeight,
      safeMax,
      padding,
    };
  }, [data, target]);

  if (!metrics) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white/80 px-4 py-12 text-center text-sm text-gray-500">
        Belum ada data penjualan pada periode ini.
      </div>
    );
  }

  const { points, width, height, safeMax, padding } = metrics;

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const targetLineY = target && target > 0
    ? padding + (1 - target / safeMax) * (height - padding * 2)
    : null;
  const targetRectHeight = targetLineY !== null ? Math.max(height - padding - targetLineY, 0) : null;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-emerald-100/80 bg-white/90 p-4 shadow-sm">
        <div className="w-full overflow-x-auto">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Grafik tren pendapatan"
            className="block min-w-max"
          >
            {targetLineY !== null ? (
              <defs>
                <pattern id={targetPatternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="rgba(16, 185, 129, 0.06)" />
                  <rect width="3" height="6" fill="rgba(16, 185, 129, 0.1)" />
                </pattern>
              </defs>
            ) : null}

            {targetLineY !== null ? (
              <g>
                {targetRectHeight && targetRectHeight > 0 ? (
                  <rect
                    x={padding}
                    y={targetLineY}
                    width={width - padding * 2}
                    height={targetRectHeight}
                    fill={`url(#${targetPatternId})`}
                  />
                ) : null}
                <line
                  x1={padding}
                  x2={width - padding}
                  y1={targetLineY}
                  y2={targetLineY}
                  stroke="rgba(16, 185, 129, 0.45)"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                />
                <text
                  x={width - padding}
                  y={Math.max(targetLineY - 8, 16)}
                  textAnchor="end"
                  className="text-[11px] font-semibold"
                  fill="rgba(16, 107, 78, 0.9)"
                >
                  Target: {target?.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                </text>
              </g>
            ) : null}

            <path
              d={path}
              fill="none"
              stroke="rgba(16, 185, 129, 0.85)"
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {points.map((point, index) => {
              const datum = data[index];
              const meetsTarget = target && target > 0 ? datum.value >= target : null;
              const pointStroke = meetsTarget === null ? "rgba(16, 185, 129, 0.9)" : meetsTarget ? "rgba(16, 185, 129, 0.9)" : "rgba(248, 113, 113, 0.7)";
              const pointFill = meetsTarget === null ? "rgba(16, 185, 129, 0.95)" : meetsTarget ? "rgba(16, 185, 129, 0.95)" : "rgba(248, 113, 113, 0.85)";
              const valueColor = meetsTarget === false ? "#B91C1C" : "#047857";
              return (
                <g key={datum.label}>
                  <circle cx={point.x} cy={point.y} r={5.5} fill="#fff" stroke={pointStroke} strokeWidth={2} />
                  <circle cx={point.x} cy={point.y} r={3} fill={pointFill} />
                  <text
                    x={point.x}
                    y={Math.max(point.y - 16, 16)}
                    textAnchor="middle"
                    className="text-[11px] font-semibold"
                    fill={valueColor}
                  >
                    {datum.value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                  </text>
                  <text
                    x={point.x}
                    y={Math.min(point.y + 32, height - 12)}
                    textAnchor="middle"
                    className="text-[11px] text-gray-500"
                  >
                    {datum.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {caption ? (
        <p className="text-xs font-medium text-gray-500 flex items-center gap-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {caption}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item, index) => {
          const meetsTarget = target && target > 0 ? item.value >= target : null;
          const indicatorColor = meetsTarget === null ? "bg-emerald-400" : meetsTarget ? "bg-emerald-500" : "bg-rose-400";
          const borderColor = meetsTarget === null ? "border-emerald-50/80" : meetsTarget ? "border-emerald-200" : "border-rose-200";
          const difference = target && target > 0 ? item.value - target : null;
          const formattedDifference = difference !== null
            ? Math.abs(difference).toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })
            : null;
          return (
            <div
              key={`${item.label}-${index}`}
              className={`rounded-2xl border ${borderColor} bg-white/80 px-4 py-3 flex items-center justify-between shadow-sm`}
            >
              <span className="flex items-center gap-3 text-sm text-gray-700">
                <span className={`h-2.5 w-2.5 rounded-full ${indicatorColor}`} aria-hidden />
                <span className="font-medium">{item.label}</span>
              </span>
              <span className="text-xs text-right text-gray-500 flex flex-col items-end">
                <span className="font-semibold text-gray-800 text-sm">
                  {item.value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                </span>
                <span className="text-emerald-600 font-semibold">
                  {item.quantity.toLocaleString("id-ID")} terjual
                </span>
                {difference !== null && formattedDifference ? (
                  <span className={`text-[11px] font-semibold ${difference >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                    {difference >= 0 ? "+" : "-"}
                    {formattedDifference}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
