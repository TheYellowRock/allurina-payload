import { shiftYmd, startOfDayUtcIso, ymdInCasablanca } from "./casablanca-time"

export const RANGE_KEYS = ["this_month", "last_month", "last_7", "last_30", "custom"] as const
export type RangeKey = (typeof RANGE_KEYS)[number]

export function isRangeKey(v: unknown): v is RangeKey {
  return typeof v === "string" && (RANGE_KEYS as readonly string[]).includes(v)
}

export type ResolvedRange = {
  key: RangeKey
  startYmd: string
  endYmd: string
  label: string
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function clampCustomDates(
  fromRaw: string | undefined,
  toRaw: string | undefined,
  todayYmd: string,
): { startYmd: string; endYmd: string } {
  const from = fromRaw && DATE_RE.test(fromRaw) ? fromRaw : todayYmd
  const to = toRaw && DATE_RE.test(toRaw) ? toRaw : todayYmd
  const [startYmd, endYmdRaw] = from <= to ? [from, to] : [to, from]
  // Never let a custom range reach into the future — createdAt can't be after "now".
  const endYmd = endYmdRaw > todayYmd ? todayYmd : endYmdRaw
  return { startYmd, endYmd }
}

export function resolveDateRange(
  params: { range?: string; from?: string; to?: string },
  now: Date = new Date(),
): ResolvedRange {
  const todayYmd = ymdInCasablanca(now)
  const key: RangeKey = isRangeKey(params.range) ? params.range : "this_month"

  switch (key) {
    case "last_7":
      return { key, startYmd: shiftYmd(todayYmd, -6), endYmd: todayYmd, label: "7 derniers jours" }
    case "last_30":
      return { key, startYmd: shiftYmd(todayYmd, -29), endYmd: todayYmd, label: "30 derniers jours" }
    case "last_month": {
      const [y, m] = todayYmd.split("-")
      const prevMonthLastDay = shiftYmd(`${y}-${m}-01`, -1)
      const [py, pm] = prevMonthLastDay.split("-")
      return {
        key,
        startYmd: `${py}-${pm}-01`,
        endYmd: prevMonthLastDay,
        label: "Mois dernier",
      }
    }
    case "custom": {
      const { startYmd, endYmd } = clampCustomDates(params.from, params.to, todayYmd)
      return { key, startYmd, endYmd, label: "Période personnalisée" }
    }
    case "this_month":
    default: {
      const [y, m] = todayYmd.split("-")
      return { key: "this_month", startYmd: `${y}-${m}-01`, endYmd: todayYmd, label: "Ce mois-ci" }
    }
  }
}

/**
 * Same length in days, immediately prior, non-overlapping — applied the same way
 * regardless of range kind, so "last month" isn't compared against a differently-sized
 * "month before that" when the current range is a partial/in-progress period.
 */
export function previousEquivalentRange(range: ResolvedRange): ResolvedRange {
  const start = new Date(startOfDayUtcIso(range.startYmd)).getTime()
  const end = new Date(startOfDayUtcIso(range.endYmd)).getTime()
  const lengthDays = Math.round((end - start) / 86_400_000) + 1
  const prevEndYmd = shiftYmd(range.startYmd, -1)
  const prevStartYmd = shiftYmd(prevEndYmd, -(lengthDays - 1))
  return { key: range.key, startYmd: prevStartYmd, endYmd: prevEndYmd, label: "Période précédente" }
}

/** Bounds for a Payload `where: { createdAt: {...} }` clause covering the full range, inclusive. */
export function rangeToWhereBounds(range: ResolvedRange): { greater_than_equal: string; less_than: string } {
  return {
    greater_than_equal: startOfDayUtcIso(range.startYmd),
    less_than: startOfDayUtcIso(shiftYmd(range.endYmd, 1)),
  }
}
