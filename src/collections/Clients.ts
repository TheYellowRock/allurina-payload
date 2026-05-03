import type { CollectionConfig } from 'payload'

/**
 * Clients boutique — la clé métier est l’e-mail (unique en base, pas de doublon).
 * Payload conserve un `id` interne ; l’e-mail sert d’identifiant fonctionnel.
 */
export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'fullName', 'phone', 'updatedAt'],
    group: 'Commerce',
    description:
      'Clients enregistrés automatiquement à la commande. Un même e-mail = un seul enregistrement.',
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Identifiant client (unique). Normalisé en minuscules à l’enregistrement.',
      },
    },
    {
      name: 'fullName',
      type: 'text',
      label: 'Nom complet',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Téléphone',
    },
  ],
}
