import type { CollectionConfig } from 'payload'

import { syncParentStockFromVariants } from './hooks/syncParentStockFromVariants'
import { variantIdentity } from './hooks/variantIdentity'

/**
 * One sellable size × colour of a product that has variants (pulls, and future clothing).
 * Scarves never use this: a scarf is a single piece and keeps its stock on the product.
 *
 * Stock lives here, one number per variant. The parent product's `stockQuantity` is kept
 * equal to the SUM of its variants (see `syncParentStockFromVariants`), so every existing
 * storefront query that filters on `stockQuantity > 0` keeps working unchanged.
 */
export const ProductVariants: CollectionConfig = {
  slug: 'product-variants',
  labels: { singular: 'Variante', plural: 'Variantes' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'sku', 'stockQuantity', 'priceOverride', 'updatedAt'],
    group: 'Catalog',
    description: 'Tailles × couleurs d’un produit à variantes. Le stock de chaque variante est géré ici.',
  },
  // One row per (product, size, colour) — a duplicate would split stock between two rows.
  indexes: [{ fields: ['product', 'size', 'color'], unique: true }],
  hooks: {
    beforeValidate: [variantIdentity],
    afterChange: [syncParentStockFromVariants],
    afterDelete: [syncParentStockFromVariants],
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'scarves',
      required: true,
      index: true,
      label: 'Produit',
    },
    {
      type: 'row',
      fields: [
        { name: 'size', type: 'relationship', relationTo: 'sizes', required: true, label: 'Taille' },
        { name: 'color', type: 'relationship', relationTo: 'colors', required: true, label: 'Couleur' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'stockQuantity',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
          label: 'Stock',
          admin: { description: 'Décrémenté automatiquement à chaque commande.' },
        },
        {
          name: 'priceOverride',
          type: 'number',
          min: 0,
          label: 'Prix spécifique (Dh)',
          admin: { description: 'Laisser vide = prix du produit.' },
        },
      ],
    },
    {
      name: 'label',
      type: 'text',
      label: 'Libellé',
      admin: { readOnly: true, description: 'Généré : « Produit — Taille · Couleur ».' },
    },
    {
      name: 'sku',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, description: 'Généré : slug-produit-taille-couleur.' },
    },
  ],
}
