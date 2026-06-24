import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"
import * as path from "path"

function loadEnv(filePath: string) {
  if (!fs.existsSync(filePath)) return
  const content = fs.readFileSync(filePath, "utf-8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv(path.resolve(__dirname, "..", ".env.seed"))
loadEnv(path.resolve(__dirname, "..", ".env.local"))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY")
  console.error("Crea un archivo .env.seed en la raíz con:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL=...")
  console.error("  SUPABASE_SERVICE_ROLE_KEY=...")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  const tables = [
    "votes",
    "reports",
    "comments",
    "posts",
    "professor_classes",
    "professor_careers",
    "classes",
    "professors",
    "careers",
  ] as const

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000")
    if (error) {
      console.error(`❌ Error al limpiar ${table}: ${error.message}`)
    } else {
      console.log(`✅ ${table} limpiado`)
    }
  }

  console.log("✅ Base de datos limpia. Conservados: profiles, auth.users.")
}

main().catch(console.error)
