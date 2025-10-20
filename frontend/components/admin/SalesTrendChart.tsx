"use client";

import { useId, useMemo } from "react";

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

type ChartMetrics = {
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
  padding: { top: number; right: number; bottom: number; left: number };
  lowerBound: number;
  range: number;
};

export function SalesTrendChart({ data, caption, target }: SalesTrendChartProps) {
  const baseId = useId().replace(/:/g, "-");
  const targetPatternId = `target-stripe-${baseId}`;
  const areaGradientId = `trend-area-${baseId}`;

  const metrics = useMemo(() => {
    if (data.length === 0) {
      return null;
    }

    const chartHeight = 260;
    const chartWidth = Math.max(640, data.length * 140);
    const padding = { top: 36, right: 56, bottom: 56, left: 56 };
    const maxDataValue = data.reduce((acc, item) => Math.max(acc, item.value), 0);
    const minDataValue = data.reduce((acc, item) => Math.min(acc, item.value), Number.POSITIVE_INFINITY);
    const targetValue = typeof target === "number" && target > 0 ? target : null;
    const combinedMax = targetValue !== null ? Math.max(maxDataValue, targetValue) : maxDataValue;
    const combinedMin = targetValue !== null ? Math.min(minDataValue, targetValue) : minDataValue;
    const rawRange = combinedMax - combinedMin;
    const softRange = rawRange === 0 ? Math.max(combinedMax * 0.2, 1) : rawRange;
    const margin = softRange * 0.2;
    const lowerBound = combinedMin - margin;
    const upperBound = combinedMax + margin;
    const range = Math.max(upperBound - lowerBound, 1);
    const horizontalPadding = padding.left + padding.right;
    const verticalPadding = padding.top + padding.bottom;
    const step = (chartWidth - horizontalPadding) / Math.max(data.length - 1, 1);

    const points = data.map((item, index) => {
      const x = padding.left + index * step;
      const ratio = (item.value - lowerBound) / range;
      const clampedRatio = Number.isFinite(ratio) ? Math.max(0, Math.min(1, ratio)) : 0;
      const y =
        padding.top +
        (1 - clampedRatio) * (chartHeight - verticalPadding);
      return { x, y };
    });

    return {
      points,
      width: chartWidth,
      height: chartHeight,
      padding,
      lowerBound,
      range,
    } as ChartMetrics;
  }, [data, target]);

  if (!metrics) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white/80 px-4 py-12 text-center text-sm text-gray-500">
        Belum ada data penjualan pada periode ini.
      </div>
    );
  }

  const { points, width, height, padding, lowerBound, range } = metrics;

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");

  const baselineY = height - padding.bottom;
  const areaPath =
    points.length > 0
      ? [
          `M ${points[0].x.toFixed(2)} ${baselineY.toFixed(2)}`,
          ...points.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
          `L ${points[points.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)}`,
          "Z",
        ].join(" ")
      : "";

  const safeRange = range > 0 ? range : 1;
  const targetRatio =
    target && target > 0 ? (target - lowerBound) / safeRange : null;
  const targetLineY =
    targetRatio !== null && Number.isFinite(targetRatio)
      ? padding.top + (1 - Math.max(0, Math.min(1, targetRatio))) * (height - (padding.top + padding.bottom))
      : null;
  const targetRectHeight =
    targetLineY !== null ? Math.max(baselineY - targetLineY, 0) : null;

  const gridLineCount = 4;
  const gridLines = Array.from({ length: gridLineCount }, (_, index) => ({
    y:
      padding.top +
      ((height - (padding.top + padding.bottom)) / (gridLineCount - 1)) * index,
  }));

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
            <defs>
              <linearGradient id={areaGradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.28)" />
                <stop offset="100%" stopColor="rgba(16, 185, 129, 0.04)" />
              </linearGradient>
            </defs>

            {targetLineY !== null ? (
              <defs>
                <pattern id={targetPatternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="6" height="6" fill="rgba(16, 185, 129, 0.06)" />
                  <rect width="3" height="6" fill="rgba(16, 185, 129, 0.1)" />
                </pattern>
              </defs>
            ) : null}

            <g>
              {gridLines.map((line, index) => (
                <line
                  key={`grid-${line.y.toFixed(2)}-${index}`}
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={line.y}
                  y2={line.y}
                  stroke="rgba(226, 232, 240, 0.6)"
                  strokeWidth={1}
                  strokeDasharray={index === 0 || index === gridLineCount - 1 ? "4 2" : "2 4"}
                />
              ))}
            </g>

            {targetLineY !== null ? (
              <g>
                {targetRectHeight && targetRectHeight > 0 ? (
                  <rect
                    x={padding.left}
                    y={targetLineY}
                    width={width - (padding.left + padding.right)}
                    height={targetRectHeight}
                    fill={`url(#${targetPatternId})`}
                  />
                ) : null}
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={targetLineY}
                  y2={targetLineY}
                  stroke="rgba(16, 185, 129, 0.45)"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                />
              </g>
            ) : null}

            {areaPath ? (
              <path
                d={areaPath}
                fill={`url(#${areaGradientId})`}
                opacity={0.9}
              />
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
              const difference = target && target > 0 ? datum.value - target : null;
              const formattedDifference =
                difference !== null
                  ? `${difference >= 0 ? "+" : "-"}${Math.abs(difference).toLocaleString("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    })}`
                  : null;
              const tooltipLines = [
                datum.label,
                `Pendapatan: ${datum.value.toLocaleString("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  maximumFractionDigits: 0,
                })}`,
                `Terjual: ${datum.quantity.toLocaleString("id-ID")} item`,
              ];
              if (formattedDifference) {
                tooltipLines.push(`Selisih target: ${formattedDifference}`);
              }
              return (
                <g key={datum.label}>
                  <title>{tooltipLines.join("\n")}</title>
                  <circle cx={point.x} cy={point.y} r={5.5} fill="#fff" stroke={pointStroke} strokeWidth={2} />
                  <circle cx={point.x} cy={point.y} r={3} fill={pointFill} />
                  <text
                    x={point.x}
                    y={Math.max(point.y - 16, padding.top + 8)}
                    textAnchor="middle"
                    className="text-[11px] font-semibold"
                    fill={valueColor}
                  >
                    {datum.value.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}
                  </text>
                  <text
                    x={point.x}
                    y={Math.min(point.y + 32, height - padding.bottom + 18)}
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
