import type { CollectionConfig } from 'payload'

// Stock is decremented atomically inside the checkout transaction (see
// POST /api/store/checkout), before this row exists — not in a hook here. Confirmation
// and owner emails are also sent from that route, after its transaction commits — not
// from an `afterChange` hook — so a slow/stuck Resend call can never pin a transactional
// pg client (see the pg "client already executing a query" audit).
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderReference',
    defaultColumns: [
      'orderReference',
      'customerName',
      'phone',
      'grandTotal',
      'paymentMethod',
      'status',
      'createdAt',
    ],
    group: 'Commerce',
    description: 'Commandes boutique (paiement à la livraison).',
  },
  access: {
    create: () => false,
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'orderReference',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description:
          'Clé générée côté client à l’ouverture de la page de commande. Une resoumission avec la même clé renvoie la commande existante au lieu d’en créer une seconde.',
      },
    },
    {
      name: 'customerName',
      type: 'text',
      required: true,
      label: 'Nom complet',
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'Téléphone',
    },
    {
      name: 'addressLine1',
      type: 'text',
      required: true,
      label: 'Adresse',
    },
    {
      name: 'addressLine2',
      type: 'text',
      label: 'Complément d’adresse',
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      label: 'Ville',
    },
    {
      name: 'postalCode',
      type: 'text',
      label: 'Code postal',
    },
    {
      name: 'country',
      type: 'text',
      required: true,
      defaultValue: 'Maroc',
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes de commande',
    },
    {
      name: 'paymentMethod',
      type: 'select',
      required: true,
      defaultValue: 'cod',
      options: [{ label: 'Paiement à la livraison', value: 'cod' }],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'En attente', value: 'pending' },
        { label: 'Confirmée', value: 'confirmed' },
        { label: 'En préparation', value: 'packing' },
        { label: 'Expédiée', value: 'shipped' },
        { label: 'Livrée', value: 'delivered' },
        { label: 'Annulée', value: 'cancelled' },
      ],
    },
    {
      name: 'items',
      type: 'json',
      required: true,
      admin: { description: 'Lignes panier (JSON).' },
    },
    {
      name: 'subtotal',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description:
          'Somme des lignes panier (prix catalogue Payload × quantités), avant livraison (Dh).',
      },
    },
    {
      name: 'volumeDiscount',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description:
          'Réduction lot (paliers de quantité — voir lib/promo-tiers.ts) : écart entre la somme des lignes panier et le prix du palier appliqué.',
      },
    },
    {
      name: 'deliveryFee',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: { description: 'Frais de livraison facturés (Dh), 0 si offerte.' },
    },
    {
      name: 'grandTotal',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description:
          'Total dû : sous-total articles + livraison (Dh). Frais de port 0 si livraison offerte.',
      },
    },
  ],
}
