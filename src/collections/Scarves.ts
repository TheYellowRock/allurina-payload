import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

export const Scarves: CollectionConfig = {
  slug: 'scarves',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'price', 'stockQuantity', 'updatedAt'],
    group: 'Catalog',
  },
  fields: [
    {
      name: 'title',
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
      name: 'description',
      type: 'richText',
      editor: lexicalEditor({}),
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Prix en dirhams (Dh).',
      },
    },
    {
      name: 'stockQuantity',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Units on hand. Used with availability tags to compute what shoppers see.',
      },
    },
    {
      name: 'lowStockThreshold',
      type: 'number',
      defaultValue: 5,
      min: 0,
      admin: {
        description: 'When stock is above 0 but at or below this number, the storefront shows low stock (unless CMS tags override).',
      },
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Photo principale pour la vitrine.',
      },
    },
    {
      name: 'galleryImages',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description:
          'Photos supplémentaires pour la fiche produit (vues de détail, porté, etc.).',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Types de châles / matières (filtrage boutique).',
      },
    },
    {
      name: 'collections',
      type: 'relationship',
      relationTo: 'collections',
      hasMany: true,
      admin: {
        description: 'Collections merchandising (capsules, saisons, éditions limitées).',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        description: 'Style or theme labels (e.g. floral, winter).',
      },
    },
    {
      name: 'availabilityTags',
      type: 'relationship',
      relationTo: 'availability-tags',
      hasMany: true,
      admin: {
        description: 'Availability badges (In stock, Pre-order, …). The storefront merges these with stock.',
      },
    },
  ],
}
