/** Business timezone for every date bucket in orders-manager. */
export const CRM_TIMEZONE = "Africa/Casablanca"

export function ymdInCasablanca(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CRM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d)
  const y = parts.find((p) => p.type === "year")?.value
  const m = parts.find((p) => p.type === "month")?.value
  const day = parts.find((p) => p.type === "day")?.value
  if (!y || !m || !day) return ""
  return `${y}-${m}-${day}`
}

export function shiftYmd(ymd: string, deltaDays: number): string {
  const [year, mo, d] = ymd.split("-").map(Number)
  const utcNoon = Date.UTC(year, mo - 1, d, 12, 0, 0)
  return ymdInCasablanca(new Date(utcNoon + deltaDays * 86_400_000))
}

/**
 * Offset (minutes, east positive) of Casablanca time from UTC at the given instant.
 * Computed via Intl rather than a fixed constant because Morocco shifts by exactly one
 * hour for "Ramadan time" on dates that move every year — there is no fixed UTC+1.
 */
function casablancaOffsetMinutes(d: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CRM_TIMEZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(d)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"))
  return Math.round((asUtc - d.getTime()) / 60_000)
}

/** UTC instant of Casablanca-local midnight for the given `YYYY-MM-DD`. */
export function startOfDayUtcIso(ymd: string): string {
  const [year, mo, d] = ymd.split("-").map(Number)
  const guessUtc = Date.UTC(year, mo - 1, d, 0, 0, 0)
  const offsetMinutes = casablancaOffsetMinutes(new Date(guessUtc))
  return new Date(guessUtc - offsetMinutes * 60_000).toISOString()
}

/** Exclusive upper bound — UTC instant of the start of the day AFTER `ymd`, Casablanca-local. */
export function dayAfterUtcIso(ymd: string): string {
  return startOfDayUtcIso(shiftYmd(ymd, 1))
}
