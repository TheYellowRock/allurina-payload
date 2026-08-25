/** Exact, unabbreviated Dh amount with grouped thousands and 2 decimals — e.g. "12 847,50 DH". */
export function formatDh(n: number): string {
  const safe = Number.isFinite(n) ? n : 0
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe)
  return `${formatted} DH`
}

/** Signed percentage, e.g. "+12,4 %" / "-3,0 %". */
export function formatSignedPercent(fraction: number): string {
  const pct = fraction * 100
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(pct)
  return `${formatted} %`
}

export function formatPercent(fraction: number): string {
  const pct = fraction * 100
  return `${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(pct)} %`
}

const RELATIVE_UNITS: Array<{ limitSeconds: number; divisor: number; unit: string }> = [
  { limitSeconds: 3600, divisor: 60, unit: "min" },
  { limitSeconds: 86_400, divisor: 3600, unit: "h" },
  { limitSeconds: 86_400 * 30, divisor: 86_400, unit: "j" },
]

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ""
  const diffSeconds = Math.max(0, Math.round((now.getTime() - then) / 1000))
  if (diffSeconds < 60) return "à l’instant"
  for (const { limitSeconds, divisor, unit } of RELATIVE_UNITS) {
    if (diffSeconds < limitSeconds) {
      const value = Math.max(1, Math.round(diffSeconds / divisor))
      return `il y a ${value} ${unit}`
    }
  }
  return `le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(iso))}`
}
