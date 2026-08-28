import { getPromotionsPanelData } from "@/lib/promotions/active"
import type { PromoActivationState } from "@/lib/promotions/active"
import { cn } from "@/lib/utils"

import { ActivationForm } from "./promotions-activation-form"

const STATE_LABELS: Record<PromoActivationState, string> = {
  active: "Actif",
  scheduled: "Programmé",
  inactive: "Inactif",
}

const STATE_CLASS: Record<PromoActivationState, string> = {
  active: "bg-emerald-100 text-emerald-950 ring-emerald-900/15",
  scheduled: "bg-sky-100 text-sky-950 ring-sky-900/15",
  inactive: "bg-stone-100 text-stone-600 ring-stone-900/10",
}

function formatDate(iso: string | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(d)
}

export async function PromotionsTab() {
  const { entries, backingStore, writable, missingEnvVars, resolvedId } = await getPromotionsPanelData()

  return (
    <section className="space-y-8">
      <div className="border-b border-stone-200 pb-3">
        <h2 className="text-lg font-semibold text-stone-900">Promotions</h2>
        <p className="mt-1 text-xs text-stone-500">
          Promotion actuellement servie au site : <span className="font-medium text-stone-700">{resolvedId}</span>
        </p>
      </div>

      {!writable ? (
        <div className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Activation en lecture seule</p>
          <p className="mt-1">
            {backingStore === "env" ? (
              "La promotion active est définie par la variable d’environnement ACTIVE_PROMO_ID. Changez sa valeur dans les paramètres du projet puis redéployez pour l’appliquer — ce panneau ne peut pas l’écrire lui-même."
            ) : (
              <>
                L’écriture vers Edge Config nécessite les variables d’environnement suivantes, absentes ici :{" "}
                {missingEnvVars.map((name, i) => (
                  <span key={name}>
                    {i > 0 ? ", " : ""}
                    <code className="rounded-sm bg-amber-100 px-1 py-0.5 font-mono text-xs">{name}</code>
                  </span>
                ))}
                . Ce panneau reste en lecture seule tant qu’elles ne sont pas configurées.
              </>
            )}
          </p>
        </div>
      ) : null}

      <ActivationForm
        entries={entries.map((e) => ({
          id: e.definition.id,
          label: e.definition.label,
          state: e.state,
          startsAt: e.startsAt,
          endsAt: e.endsAt,
        }))}
        writable={writable}
      />

      <div>
        <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">
          Promotions enregistrées
        </h3>
        <ul className="mt-3 flex flex-col gap-4">
          {entries.map(({ definition, state, startsAt, endsAt }) => (
            <li key={definition.id} className="rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-stone-900">{definition.label}</span>
                <span className="font-mono text-xs text-stone-500">{definition.id}</span>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ring-1",
                    STATE_CLASS[state],
                  )}
                >
                  {STATE_LABELS[state]}
                </span>
              </div>

              {formatDate(startsAt) || formatDate(endsAt) ? (
                <p className="mt-1.5 text-xs text-stone-500">
                  {formatDate(startsAt) ? `Début : ${formatDate(startsAt)}` : null}
                  {formatDate(startsAt) && formatDate(endsAt) ? " · " : null}
                  {formatDate(endsAt) ? `Fin : ${formatDate(endsAt)}` : null}
                </p>
              ) : null}

              <dl className="mt-4 space-y-3 text-sm text-stone-700">
                <div>
                  <dt className="text-xs text-stone-500">Barre d’annonce</dt>
                  <dd className="mt-0.5">{definition.topBar}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">Bannière</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-2">
                    {definition.banner.chips.map((chip) => (
                      <span
                        key={`${chip.value}-${chip.label}`}
                        className="rounded-sm border border-stone-300 bg-stone-50 px-2 py-1 text-xs text-stone-700"
                      >
                        {chip.value}
                        {chip.unit ? ` ${chip.unit}` : ""} → {chip.label}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">Paliers panier</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-2">
                    {definition.cart.milestones.map((m) => (
                      <span
                        key={m.qty}
                        className="rounded-sm border border-stone-300 bg-stone-50 px-2 py-1 text-xs text-stone-700"
                      >
                        {m.qty} article{m.qty > 1 ? "s" : ""} → {m.label}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
