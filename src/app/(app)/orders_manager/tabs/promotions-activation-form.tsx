"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type Entry = {
  id: string
  label: string
  state: "active" | "scheduled" | "inactive"
  startsAt?: string
  endsAt?: string
}

/** `datetime-local` inputs want `YYYY-MM-DDTHH:mm`, not a full ISO string. */
function toDatetimeLocal(iso: string | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString().slice(0, 16)
}

export function ActivationForm({ entries, writable }: { entries: Entry[]; writable: boolean }) {
  const router = useRouter()
  const targeted = entries.find((e) => e.state === "active" || e.state === "scheduled")

  const [selectedId, setSelectedId] = useState(targeted?.id ?? entries[0]?.id ?? "")
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(targeted?.startsAt))
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(targeted?.endsAt))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!writable) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/orders-manager/promotions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          promoId: selectedId,
          startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Échec de l’activation.")
        return
      }
      router.refresh()
    } catch {
      setError("Réseau indisponible.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-sm border border-stone-300/90 bg-white p-5 shadow-sm">
      <h3 className="text-[11px] font-semibold tracking-[0.18em] text-stone-500 uppercase">Activation</h3>

      <fieldset disabled={!writable} className="space-y-2">
        <legend className="sr-only">Promotion active</legend>
        {entries.map((entry) => (
          <label key={entry.id} className="flex items-center gap-2 text-sm text-stone-800">
            <input
              type="radio"
              name="active-promo"
              value={entry.id}
              checked={selectedId === entry.id}
              onChange={() => setSelectedId(entry.id)}
              className="size-4"
              disabled={!writable}
            />
            {entry.label}
            <span className="font-mono text-xs text-stone-400">{entry.id}</span>
          </label>
        ))}
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-stone-600">Début (optionnel)</span>
          <input
            type="datetime-local"
            value={startsAt}
            disabled={!writable}
            onChange={(e) => setStartsAt(e.target.value)}
            className="mt-1 h-9 w-full border border-stone-400 bg-white px-2 text-sm disabled:bg-stone-100 disabled:text-stone-400"
          />
        </label>
        <label className="block">
          <span className="text-xs text-stone-600">Fin (optionnel)</span>
          <input
            type="datetime-local"
            value={endsAt}
            disabled={!writable}
            onChange={(e) => setEndsAt(e.target.value)}
            className="mt-1 h-9 w-full border border-stone-400 bg-white px-2 text-sm disabled:bg-stone-100 disabled:text-stone-400"
          />
        </label>
      </div>

      {error ? (
        <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={!writable || saving}
        className="rounded-none border-stone-800 bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50"
      >
        {saving ? "Enregistrement…" : "Activer"}
      </Button>
    </form>
  )
}
