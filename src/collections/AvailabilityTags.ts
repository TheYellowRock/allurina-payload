import type { CollectionConfig } from 'payload'

export const availabilityStatuses = [
  'in_stock',
  'low_stock',
  'out_of_stock',
  'pre_order',
  'coming_soon',
] as const

export type AvailabilityStatus = (typeof availabilityStatuses)[number]

export const AvailabilityTags: CollectionConfig = {
  slug: 'availability-tags',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'status', 'updatedAt'],
    description: 'Badges such as In stock, Pre-order. The status drives storefront logic.',
    group: 'Catalog',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'in_stock',
      options: availabilityStatuses.map((value) => ({
        label: value
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        value,
      })),
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional note for editors (not shown on the storefront by default).',
      },
    },
  ],
}
