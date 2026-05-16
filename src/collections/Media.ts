import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Catalog',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        const raw = data.alt
        const alt = typeof raw === 'string' ? raw.trim() : ''
        if (!alt) {
          return { ...data, alt: 'Allurina scarf' }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Texte d’accessibilité. Déposez d’abord les images sur un châle : le titre du produit remplit automatiquement « Allurina scarf — « … » » à l’enregistrement.',
      },
    },
  ],
  upload: {
    displayPreview: true,
    imageSizes: [
      {
        name: 'adminThumb',
        width: 80,
        height: 80,
        position: 'centre',
        admin: {
          disableListColumn: true,
          disableListFilter: true,
          disableGroupBy: true,
        },
      },
    ],
  },
}
