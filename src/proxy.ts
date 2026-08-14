import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const FBC_COOKIE_NAME = "_fbc"
/** Matches the lifetime Meta's own Pixel script uses for `_fbc`. */
const FBC_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90

/**
 * Captures `fbclid` from the landing URL and writes an `_fbc` cookie in Meta's format
 * (`fb.1.<timestamp>.<fbclid>`) so it's available even when the Pixel script itself
 * hasn't run yet (ad blockers, slow script load) or hasn't set one yet. Never overwrites
 * an `_fbc` the Pixel already set.
 */
export function proxy(request: NextRequest) {
  const fbclid = request.nextUrl.searchParams.get("fbclid")
  if (!fbclid || request.cookies.has(FBC_COOKIE_NAME)) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  response.cookies.set({
    name: FBC_COOKIE_NAME,
    value: `fb.1.${Date.now()}.${fbclid}`,
    maxAge: FBC_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
  return response
}

export const config = {
  matcher: ["/((?!api|admin|_next/static|_next/image|favicon.ico).*)"],
}
