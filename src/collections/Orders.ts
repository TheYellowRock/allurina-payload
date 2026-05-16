import type { CollectionConfig } from 'payload'

import { adjustInventoryForNewOrder } from '@/lib/inventory/adjustInventoryForNewOrder'
import { sendOrderConfirmation, sendOwnerNotification } from '@/lib/email'

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
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return
        await Promise.all([
          sendOrderConfirmation(doc),
          sendOwnerNotification(doc),
          adjustInventoryForNewOrder(req.payload, doc as Record<string, unknown>).catch((err) => {
            console.error('[inventory] adjustInventoryForNewOrder', err)
          }),
        ])
      },
    ],
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
        description: 'Total catalogue des articles avant remise volume (Dh).',
      },
    },
    {
      name: 'volumeDiscount',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: { description: 'Remise volume 3+ pièces (Dh).' },
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
          'Total dû : articles remisés + livraison (Dh). Défaut 0 pour anciennes lignes — vérifier en admin si besoin.',
      },
    },
  ],
}
