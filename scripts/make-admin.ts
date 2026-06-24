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

const email = process.argv[2]

if (!email) {
  console.error("❌ Uso: npx tsx scripts/make-admin.ts <email>")
  process.exit(1)
}

async function main() {
  const { data: user, error: userError } = await supabase
    .from("profiles")
    .select("id, email, is_admin")
    .eq("email", email)
    .single()

  if (userError || !user) {
    console.error(`❌ No se encontró un usuario con email "${email}"`)
    process.exit(1)
  }

  if (user.is_admin) {
    console.log(`ℹ️  "${email}" ya es admin.`)
    process.exit(0)
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", user.id)

  if (updateError) {
    console.error("❌ Error al actualizar:", updateError.message)
    process.exit(1)
  }

  console.log(`✅ "${email}" ahora es admin.`)
}

main().catch(console.error)
