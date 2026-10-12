import type { CollectionConfig } from 'payload'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/** Shared colour palette for variants and per-colour galleries. */
export const Colors: CollectionConfig = {
  slug: 'colors',
  labels: { singular: 'Couleur', plural: 'Couleurs' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'hex', 'updatedAt'],
    group: 'Catalog',
    description: 'Couleurs utilisées par les variantes (pastille sur la fiche produit).',
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nom' },
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    {
      name: 'hex',
      type: 'text',
      required: true,
      label: 'Code couleur',
      admin: { description: 'Format #RRGGBB, ex. #1F1F1F — utilisé pour la pastille.' },
      validate: (value: unknown) =>
        typeof value === 'string' && HEX_RE.test(value) ? true : 'Format attendu : #RRGGBB',
    },
  ],
}
