import {
  availabilityStatuses,
  type AvailabilityStatus,
} from '@/collections/AvailabilityTags'

export type StorefrontAvailability = {
  status: AvailabilityStatus
  label: string
  source: 'cms' | 'stock'
}

type PopulatedAvailabilityTag = {
  id: string
  name: string
  status: AvailabilityStatus
}

function isAvailabilityStatus(value: string): value is AvailabilityStatus {
  return (availabilityStatuses as readonly string[]).includes(value)
}

function normalizeAvailabilityTags(raw: unknown): PopulatedAvailabilityTag[] {
  if (!raw || !Array.isArray(raw)) return []
  const out: PopulatedAvailabilityTag[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const name = o.name
    const status = o.status
    if (typeof name !== 'string' || typeof status !== 'string') continue
    if (!isAvailabilityStatus(status)) continue
    out.push({
      id: String(o.id ?? ''),
      name,
      status,
    })
  }
  return out
}

/**
 * Storefront availability from CMS « availability-tags » only, plus a hard guard:
 * quantity 0 is always treated as rupture (even if tags are stale).
 */
export function resolveStorefrontAvailability(input: {
  stockQuantity: number
  availabilityTags: unknown
}): StorefrontAvailability {
  const tags = normalizeAvailabilityTags(input.availabilityTags)

  const cmsOut = tags.find((t) => t.status === 'out_of_stock')
  if (cmsOut) {
    return { status: 'out_of_stock', label: cmsOut.name, source: 'cms' }
  }

  const waitlist = tags.find(
    (t) => t.status === 'pre_order' || t.status === 'coming_soon',
  )
  if (waitlist) {
    return { status: waitlist.status, label: waitlist.name, source: 'cms' }
  }

  if (input.stockQuantity <= 0) {
    return { status: 'out_of_stock', label: 'Rupture', source: 'stock' }
  }

  const cmsLow = tags.find((t) => t.status === 'low_stock')
  if (cmsLow) {
    return { status: 'low_stock', label: cmsLow.name, source: 'cms' }
  }

  const cmsIn = tags.find((t) => t.status === 'in_stock')
  if (cmsIn) {
    return { status: 'in_stock', label: cmsIn.name, source: 'cms' }
  }

  return { status: 'in_stock', label: 'Disponible', source: 'stock' }
}
