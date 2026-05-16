import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

import { syncScarfMediaAlt } from './hooks/syncScarfMediaAlt'
import { autoSlugFromTitle } from './hooks/autoSlugFromTitle'

export const Scarves: CollectionConfig = {
  slug: 'scarves',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'price', 'stockQuantity', 'updatedAt'],
    group: 'Catalog',
  },
  hooks: {
    beforeValidate: [autoSlugFromTitle],
    afterChange: [syncScarfMediaAlt],
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
      admin: {
        readOnly: true,
        description:
          'Généré automatiquement à partir du titre (minuscules, tirets, accents supprimés). Modifier le titre met à jour l’URL.',
      },
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
        description:
          'Stock physique (décrémenté automatiquement à chaque commande). La vitrine combine ce chiffre avec les badges « Disponibilité » (rupture, stock limité, etc.).',
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
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description:
          'Glissez-déposez plusieurs images à la fois. Enregistrez la fiche : le champ Alt de chaque fichier est rempli avec Allurina scarf — « titre du châle ».',
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
