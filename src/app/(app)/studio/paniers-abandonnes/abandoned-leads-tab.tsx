import { getPayload } from "payload"

import config from "@payload-config"
import { listOpenLeads } from "@/lib/leads/checkout-leads"
import { formatDh, formatMoroccanPhone, formatRelativeTime } from "@/lib/studio/format"

function itemsSummary(items: { title: string; variantLabel?: string | null; quantity: number }[]): string {
  if (items.length === 0) return "panier vide"
  return items
    .map((i) => `${i.quantity}× ${i.title}${i.variantLabel ? ` (${i.variantLabel})` : ""}`)
    .join(", ")
}

function whatsappHref(phoneE164: string, customerName: string): string {
  const firstName = customerName.trim().split(/\s+/)[0] ?? ""
  const text = `Salam ${firstName}, vous avez commencé une commande sur Allurina Scarf — voulez-vous qu’on vous aide à la finaliser ? Paiement à la livraison 🙂`
  return `https://wa.me/${phoneE164.replace("+", "")}?text=${encodeURIComponent(text)}`
}

/** Checkout step 1 done, never placed an order — staff follow-up list, replaces the old respond.io abandoned-cart Workflow. */
export async function AbandonedLeadsTab() {
  const payload = await getPayload({ config: await config })
  const leads = await listOpenLeads(payload)

  return (
    <div className="space-y-4">
      <div className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm sm:max-w-xs">
        <p className="text-sm text-stone-500">Paniers abandonnés</p>
        <p className="mt-2 text-2xl font-semibold text-red-700">{leads.length}</p>
      </div>

      {leads.length === 0 ? (
        <p className="border border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
          Aucun panier abandonné pour le moment.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 border border-stone-200 bg-white">
          {leads.map((lead) => (
            <li key={lead.leadKey} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-stone-900">{lead.customerName}</span>
                  <span className="text-xs text-stone-500">{formatMoroccanPhone(lead.phoneE164)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-stone-500">{itemsSummary(lead.items)}</p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {formatDh(lead.cartTotal)} · abandonné {formatRelativeTime(lead.createdAt)}
                </p>
              </div>
              <a
                href={whatsappHref(lead.phoneE164, lead.customerName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center border border-stone-300 bg-white px-3 text-xs font-medium text-stone-700"
              >
                Contacter sur WhatsApp
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
