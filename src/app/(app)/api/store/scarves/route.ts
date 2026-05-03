import { NextResponse } from 'next/server'

import { getScarvesWithAvailability } from '@/lib/getScarvesStorefront'

/**
 * Local storefront JSON: same availability resolution as server components,
 * backed by Payload on this host (no external commerce API).
 */
export async function GET() {
  try {
    const data = await getScarvesWithAvailability()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[store/scarves]', error)
    return NextResponse.json(
      { error: 'Failed to load scarves', scarves: [] },
      { status: 500 },
    )
  }
}
