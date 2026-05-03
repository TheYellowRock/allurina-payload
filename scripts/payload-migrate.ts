import "dotenv/config"
import minimist from "minimist"

import { migrate } from "../node_modules/payload/dist/bin/migrate.js"

import config from "../src/payload.config"

async function main() {
  const cfg = await config
  const parsedArgs = minimist(process.argv.slice(2))
  if (!parsedArgs._.length) {
    parsedArgs._.push("migrate")
  }
  await migrate({ config: cfg, parsedArgs })
}

void main().catch((e) => {
  console.error(e)
  process.exit(1)
})
