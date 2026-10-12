import { Tag } from "lucide-react"
import type { Metadata } from "next"

import { requireStaffUser } from "@/lib/studio/getStaffUser"
import { STUDIO_PATHS, withSearchParams, type SearchParams } from "@/lib/studio/paths"

import { StudioPage } from "../_components/studio-page"
import { PromotionsTab } from "./promotions-tab"

export const metadata: Metadata = { title: "Promotions" }

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams
  // Auth after reading searchParams, so a login redirect lands back on this exact view.
  await requireStaffUser(withSearchParams(STUDIO_PATHS.promotions, sp))
  return (
    <StudioPage title="Promotions" icon={Tag}>
      <PromotionsTab />
    </StudioPage>
  )
}
