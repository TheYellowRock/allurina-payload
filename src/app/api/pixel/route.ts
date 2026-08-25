import { NextResponse } from "next/server"

import { sendServerEvent } from "@/lib/conversions-api"
import type { CapiEventData } from "@/lib/conversions-api"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
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

  try {
    await sendServerEvent(eventName, eventData)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[pixel/capi]", err)
    return NextResponse.json({ error: "CAPI error" }, { status: 502 })
  }
}
