"use client"

import { useSyncExternalStore } from "react"

/** Tailwind `md` breakpoint — viewport widths below this are treated as mobile. */
const MOBILE_MQ = "(max-width: 767px)"

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(MOBILE_MQ)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.matchMedia(MOBILE_MQ).matches
}

function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
