import type { CollectionConfig } from 'payload'

/**
 * Top-level product departments (Châles, Pulls, …). Data, not code: adding a type here
 * needs no SQL. Every product in `scarves` (shown as "Produits") points to one type.
 *
 * The slug is the stable key code relies on (nav, promo eligibility) — don't rename it
 * once products use the type.
 */
export const ProductTypes: CollectionConfig = {
  slug: 'product-types',
  labels: { singular: 'Type de produit', plural: 'Types de produit' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'navOrder', 'updatedAt'],
    group: 'Catalog',
    description: 'Départements de la boutique (Châles, Pulls…). Chaque produit appartient à un type.',
  },
  defaultSort: 'navOrder',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Identifiant stable (ex. chales, pulls). Ne pas modifier une fois utilisé.' },
    },
    {
      name: 'navOrder',
      type: 'number',
      defaultValue: 0,
      label: 'Ordre dans le menu',
    },
    {
      name: 'sizeGuide',
      type: 'textarea',
      label: 'Guide des tailles',
      admin: { description: 'Optionnel — affiché sur la fiche des produits de ce type.' },
    },
    { name: 'description', type: 'textarea' },
  ],
}
