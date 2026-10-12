import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

import { populateScarfFeaturedImage } from './hooks/populateScarfFeaturedImage'
import { syncScarfMediaAlt } from './hooks/syncScarfMediaAlt'
import { autoSlugFromTitle } from './hooks/autoSlugFromTitle'
import { deleteProductVariants } from './hooks/deleteProductVariants'
import { variableProductStock } from './hooks/variableProductStock'

/**
 * All sellable products — scarves, pulls and future types. The slug (and so the table
 * name) stays `scarves` for now: renaming it means rewriting live tables, relations and
 * the stock function on the shared dev/prod database. Rename after the DB split.
 *
 * Two kinds of product:
 * - simple (`hasVariants` false) — one unique piece, e.g. a scarf; stock on the product.
 * - with variants (`hasVariants` true) — e.g. a pull in sizes × colours; stock lives on
 *   each `product-variants` row and `stockQuantity` here is their sum (kept in sync).
 */
export const Scarves: CollectionConfig = {
  slug: 'scarves',
  labels: { singular: 'Produit', plural: 'Produits' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['featuredImage', 'title', 'productType', 'price', 'stockQuantity', 'updatedAt'],
    group: 'Catalog',
  },
  hooks: {
    beforeValidate: [autoSlugFromTitle],
    beforeChange: [variableProductStock],
    // A variant can't outlive its product (product_id is NOT NULL in the database).
    beforeDelete: [deleteProductVariants],
    afterRead: [populateScarfFeaturedImage],
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
      name: 'productType',
      type: 'relationship',
      relationTo: 'product-types',
      required: true,
      index: true,
      label: 'Type de produit',
      admin: { position: 'sidebar' },
    },
    {
      name: 'hasVariants',
      type: 'checkbox',
      defaultValue: false,
      label: 'Produit avec tailles / couleurs',
      admin: {
        position: 'sidebar',
        description:
          'Cocher pour un pull (ou tout article en plusieurs tailles/couleurs). Laisser décoché pour un châle : pièce unique, stock sur la fiche.',
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
        // Not hidden for products with variants on purpose: a conditional field becomes a
        // nullable column in Payload's schema, and checkout relies on this being NOT NULL.
        description:
          'Stock physique (décrémenté automatiquement à chaque commande). La vitrine combine ce chiffre avec les badges « Disponibilité » (rupture, stock limité, etc.). Produit avec tailles/couleurs : ne pas saisir — c’est le total des variantes, recalculé automatiquement.',
      },
    },
    {
      name: 'variants',
      type: 'join',
      collection: 'product-variants',
      on: 'product',
      label: 'Variantes',
      admin: {
        condition: (data) => Boolean(data?.hasVariants),
        defaultColumns: ['label', 'stockQuantity', 'priceOverride'],
        description: 'Une ligne par taille × couleur, avec son stock. Enregistrez le produit avant d’ajouter des variantes.',
      },
    },
    {
      name: 'featuredImage',
      label: 'Aperçu',
      type: 'upload',
      relationTo: 'media',
      maxDepth: 2,
      displayPreview: true,
      admin: {
        description: 'Photo principale pour la vitrine.',
        components: {
          Cell: '@/components/payload/ScarfFeaturedImageCell#ScarfFeaturedImageCell',
        },
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
      name: 'colorImages',
      type: 'array',
      label: 'Photos par couleur',
      admin: {
        condition: (data) => Boolean(data?.hasVariants),
        description:
          'Une entrée par couleur : la galerie de la fiche change quand la cliente choisit la couleur. « Aperçu » reste la photo des listes.',
      },
      fields: [
        { name: 'color', type: 'relationship', relationTo: 'colors', required: true, label: 'Couleur' },
        {
          name: 'images',
          type: 'upload',
          relationTo: 'media',
          hasMany: true,
          required: true,
          label: 'Photos',
        },
      ],
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
