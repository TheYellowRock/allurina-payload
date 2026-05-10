/** Strip “Châles en …” and show each word capitalized (e.g. Fil De Lin, Satin). */
function titleCaseMaterialWords(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

export function chalesTypeLabel(fullName: string): string {
  const afterEn = fullName.replace(/^Châles\s+en\s+/i, "").trim()
  if (afterEn) return titleCaseMaterialWords(afterEn)

  const afterChales = fullName.replace(/^Châles\s+/i, "").trim()
  if (afterChales) return titleCaseMaterialWords(afterChales)

  return fullName
}
