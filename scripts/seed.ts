import "dotenv/config"
import { getPayload } from "payload"

import config from "../src/payload.config"
import { seedAllurinaCatalog } from "../src/lib/seedCatalog"

async function main() {
  const cfg = await config
  const payload = await getPayload({ config: cfg })
  await seedAllurinaCatalog(payload)
  await payload.destroy()
  process.exit(0)
}

void main().catch((e) => {
  console.error(e)
  process.exit(1)
})
