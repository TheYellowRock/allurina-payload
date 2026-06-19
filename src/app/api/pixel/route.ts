import { NextRequest, NextResponse } from "next/server"

import { sendServerEvent } from "@/lib/conversions-api"
import type { CapiEventData } from "@/lib/conversions-api"

export async function POST(request: NextRequest) {
  let body: { eventName?: string; eventData?: CapiEventData }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { eventName, eventData = {} } = body
  if (!eventName) {
    return NextResponse.json({ error: "Missing eventName" }, { status: 400 })
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined
  const userAgent = request.headers.get("user-agent") ?? undefined

  try {
    await sendServerEvent(eventName, { ...eventData, ip, userAgent })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[pixel/capi]", err)
    return NextResponse.json({ error: "CAPI error" }, { status: 502 })
  }
}
