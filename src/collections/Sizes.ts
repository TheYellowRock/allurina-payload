import type { CollectionConfig } from 'payload'

/**
 * Sizes are data (not a select/enum) so adding one — or a whole size range for a future
 * product type — never needs a database migration.
 */
export const Sizes: CollectionConfig = {
  slug: 'sizes',
  labels: { singular: 'Taille', plural: 'Tailles' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'productType', 'sortOrder', 'updatedAt'],
    group: 'Catalog',
    description: 'Tailles disponibles pour les produits à variantes (S/M, M/L…).',
  },
  defaultSort: 'sortOrder',
  fields: [
    { name: 'label', type: 'text', required: true, label: 'Libellé' },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'sortOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Ordre',
      admin: { description: 'Ordre d’affichage (petit → grand).' },
    },
    {
      name: 'productType',
      type: 'relationship',
      relationTo: 'product-types',
      label: 'Type de produit',
      admin: { description: 'Limite cette taille à un type (ex. Pulls).' },
    },
  ],
}
