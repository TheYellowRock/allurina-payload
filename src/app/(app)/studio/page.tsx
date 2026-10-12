import { redirect } from "next/navigation"

import { STUDIO_PATHS } from "@/lib/studio/paths"

export default function StudioHome() {
  redirect(STUDIO_PATHS.orders)
}
