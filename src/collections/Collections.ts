import type { CollectionConfig } from 'payload'

export const Collections: CollectionConfig = {
  slug: 'collections',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
    group: 'Catalog',
    description: 'Collections merchandising (capsules, saisons, stories). Assignez-les aux produits en plus des catégories matière.',
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
      name: 'description',
      type: 'textarea',
    },
  ],
}
