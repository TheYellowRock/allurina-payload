import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'updatedAt'],
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
      name: 'productType',
      type: 'relationship',
      relationTo: 'product-types',
      label: 'Type de produit',
      admin: { description: 'Catégorie propre à un type (ex. matières de châles). Vide = tous types.' },
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
