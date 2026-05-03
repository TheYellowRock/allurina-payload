/** Display label for “Châles” submenu (drops leading “Châles ”). */
export function chalesTypeLabel(fullName: string): string {
  return fullName.replace(/^Châles\s+/i, "").trim() || fullName
}
