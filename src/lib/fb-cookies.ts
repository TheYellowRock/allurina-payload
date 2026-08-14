"use client"

/** Reads a cookie by name from `document.cookie`. Client-only. */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

/** Meta's browser-set click-id cookies — sent raw (unhashed) in CAPI `user_data`. */
export function readFbp(): string | null {
  return readCookie("_fbp")
}

export function readFbc(): string | null {
  return readCookie("_fbc")
}
