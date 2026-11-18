import { PhoneMissed } from "lucide-react"
import type { Metadata } from "next"

import { requireStaffUser } from "@/lib/studio/getStaffUser"
import { STUDIO_PATHS } from "@/lib/studio/paths"

import { StudioPage } from "../_components/studio-page"
import { AbandonedLeadsTab } from "./abandoned-leads-tab"

export const metadata: Metadata = { title: "Paniers abandonnés" }

export default async function Page() {
  await requireStaffUser(STUDIO_PATHS.abandonedLeads)
  return (
    <StudioPage title="Paniers abandonnés" icon={PhoneMissed}>
      <AbandonedLeadsTab />
    </StudioPage>
  )
}
