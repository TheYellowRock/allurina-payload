/**
 * Launcher for the respond.io maintenance scripts.
 *
 *   npm run respondio:smoke                      # smoke test, first number in RESPONDIO_TEST_PHONES
 *   npm run respondio:smoke -- 0612345678        # smoke test against a specific allowlisted number
 *   npm run respondio:retry -- dry-run           # list failed syncs that would be retried
 *   npm run respondio:retry -- production        # retry them for real
 *
 * Why a launcher: this project is CommonJS (no "type": "module"), and the Payload config
 * imports files that use the tsconfig `@/…` alias.
 * - plain `jiti` doesn't know the alias            → "Cannot find module '@/lib/…'"
 * - `payload run` (tsx) knows it, but loads the project as CommonJS and then can't resolve
 *   ESM-only packages Payload depends on           → ERR_PACKAGE_PATH_NOT_EXPORTED (file-type)
 * jiti configured here with the same aliases as tsconfig.json handles both.
 */
const path = require("node:path")
const { createJiti } = require("jiti")

const SCRIPTS = {
  smoke: "./respondio-smoke.ts",
  retry: "./respondio-retry.ts",
}

// Exit only after output has flushed — in a Windows terminal a bare process.exit() right
// after console.error() can swallow the message.
function exitAfterFlush(code) {
  process.stdout.write("", () => process.stderr.write("", () => process.exit(code)))
}

const name = process.argv[2]
if (!SCRIPTS[name]) {
  console.error(`Usage: node scripts/respondio.cjs <${Object.keys(SCRIPTS).join("|")}> [args…]`)
  exitAfterFlush(1)
  return
}
// Drop the script name so the target sees only its own arguments at process.argv[2+].
process.argv.splice(2, 1)

const src = path.resolve(__dirname, "../src")
const jiti = createJiti(__filename, {
  alias: {
    "@payload-config": path.join(src, "payload.config.ts"),
    "@/": `${src}/`,
  },
})

jiti.import(SCRIPTS[name]).catch((err) => {
  console.error(err)
  exitAfterFlush(1)
})
