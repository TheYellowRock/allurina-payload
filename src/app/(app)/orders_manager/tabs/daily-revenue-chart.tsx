"use client"

import { useState } from "react"

import { formatDh } from "@/lib/orders-manager/format"
import type { DailyRevenuePoint } from "@/lib/orders-manager/revenue-stats"

const CHART_HEIGHT = 280
// Virtual/logical coordinate space — the SVG scales this to the container's real width via
// `width="100%"` + `preserveAspectRatio="none"`, so bars stay responsive without any JS
// measurement or ResizeObserver. This sidesteps the CSS percentage-height trap entirely:
// every coordinate here is an absolute number in a fixed viewBox, never a `%` against an
// ambiguous parent.
const CHART_WIDTH = 1000
const PADDING = { top: 16, right: 12, bottom: 28, left: 64 }
const PLOT_WIDTH = CHART_WIDTH - PADDING.left - PADDING.right
const PLOT_HEIGHT = CHART_HEIGHT - PADDING.top - PADDING.bottom
const GRIDLINE_COUNT = 4

function formatAxisDh(n: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(n))} DH`
}

function formatAxisDate(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`)
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(d)
}

function formatTooltipDate(ymd: string): string {
  const d = new Date(`${ymd}T00:00:00`)
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d)
}

/** Rounds a data max up to a clean gridline step (1/2/5/10 × a power of ten) — never below the actual max. */
function niceMax(dataMax: number): number {
  if (dataMax <= 0) return 100
  const magnitude = 10 ** Math.floor(Math.log10(dataMax))
  const normalized = dataMax / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

export function DailyRevenueChart({ points }: { points: DailyRevenuePoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (points.length === 0) {
    return (
      <div style={{ height: CHART_HEIGHT }} className="flex items-center justify-center text-sm text-stone-500">
        Aucune donnée sur cette période.
      </div>
    )
  }

  const max = niceMax(Math.max(...points.map((p) => p.revenue)))
  const barGap = PLOT_WIDTH / points.length
  const barWidth = Math.max(2, barGap * 0.65)
  const xFor = (index: number) => PADDING.left + index * barGap + (barGap - barWidth) / 2
  const yFor = (value: number) => PADDING.top + PLOT_HEIGHT * (1 - value / max)

  const gridlineValues = Array.from({ length: GRIDLINE_COUNT + 1 }, (_, i) => (max / GRIDLINE_COUNT) * i)
  // Thin x-axis labels on long ranges so they don't overlap — aim for ~8 labels max.
  const labelStep = Math.max(1, Math.ceil(points.length / 8))

  const hoveredPoint = hovered !== null ? points[hovered] : null
  const tooltipLeftPct =
    hovered !== null ? Math.min(92, Math.max(8, ((xFor(hovered) + barWidth / 2) / CHART_WIDTH) * 100)) : 0

  return (
    <div className="relative" style={{ height: CHART_HEIGHT }}>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        width="100%"
        height={CHART_HEIGHT}
        preserveAspectRatio="none"
        role="img"
        aria-label="Chiffre d’affaires par jour"
      >
        {gridlineValues.map((v) => {
          const y = yFor(v)
          return (
            <g key={v}>
              <line x1={PADDING.left} x2={CHART_WIDTH - PADDING.right} y1={y} y2={y} stroke="#e7e5e4" strokeWidth={1} />
              <text x={PADDING.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#78716c">
                {formatAxisDh(v)}
              </text>
            </g>
          )
        })}

        {points.map((p, i) => {
          const barHeight = Math.max(p.revenue > 0 ? 2 : 0, PLOT_HEIGHT * (p.revenue / max))
          const x = xFor(i)
          const y = PADDING.top + PLOT_HEIGHT - barHeight
          return (
            <rect
              key={p.ymd}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={hovered === i ? "#1c1917" : "#44403c"}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((cur) => (cur === i ? null : cur))}
            />
          )
        })}

        {points.map((p, i) =>
          i % labelStep === 0 ? (
            <text
              key={`label-${p.ymd}`}
              x={xFor(i) + barWidth / 2}
              y={CHART_HEIGHT - PADDING.bottom + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#78716c"
            >
              {formatAxisDate(p.ymd)}
            </text>
          ) : null,
        )}
      </svg>

      {hoveredPoint ? (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-sm border border-stone-300 bg-white px-3 py-2 text-xs whitespace-nowrap shadow-md"
          style={{ left: `${tooltipLeftPct}%` }}
        >
          <p className="font-semibold text-stone-900">{formatTooltipDate(hoveredPoint.ymd)}</p>
          <p className="mt-0.5 text-stone-700">{formatDh(hoveredPoint.revenue)}</p>
          <p className="text-stone-500">
            {hoveredPoint.orderCount} commande{hoveredPoint.orderCount > 1 ? "s" : ""}
          </p>
        </div>
      ) : null}
    </div>
  )
}
