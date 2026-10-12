import { LayoutGrid } from "lucide-react"
import type { Metadata } from "next"

import { requireStaffUser } from "@/lib/studio/getStaffUser"
import { STUDIO_PATHS, withSearchParams, type SearchParams } from "@/lib/studio/paths"

import { StudioPage } from "../_components/studio-page"
import { MetricsTab } from "./metrics-tab"

export const metadata: Metadata = { title: "Métriques" }

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  // Auth after reading searchParams, so a login redirect lands back on this exact view.
  await requireStaffUser(withSearchParams(STUDIO_PATHS.metrics, sp))
  return (
    <StudioPage title="Métriques" icon={LayoutGrid}>
      <MetricsTab searchParams={sp} />
    </StudioPage>
  )
}
