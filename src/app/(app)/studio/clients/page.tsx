import { Users } from "lucide-react"
import type { Metadata } from "next"

import { requireStaffUser } from "@/lib/studio/getStaffUser"
import { STUDIO_PATHS, withSearchParams, type SearchParams } from "@/lib/studio/paths"

import { StudioPage } from "../_components/studio-page"
import { ClientsTab } from "./clients-tab"

export const metadata: Metadata = { title: "Clients" }

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  // Auth after reading searchParams, so a login redirect lands back on this exact view.
  await requireStaffUser(withSearchParams(STUDIO_PATHS.clients, sp))
  return (
    <StudioPage title="Clients" icon={Users}>
      <ClientsTab searchParams={sp} />
    </StudioPage>
  )
}
