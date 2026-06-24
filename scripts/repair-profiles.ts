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
  // Get all auth users from the admin.users API
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error("❌ Error al listar auth users:", authError.message)
    process.exit(1)
  }

  const { data: existingProfiles } = await supabase
    .from("profiles")
    .select("id")

  const existingIds = new Set(existingProfiles?.map((p) => p.id) ?? [])

  let created = 0
  for (const u of authUsers.users) {
    if (!existingIds.has(u.id)) {
      const { error } = await supabase
        .from("profiles")
        .insert({ id: u.id, email: u.email ?? "" })

      if (error) {
        console.error(`  Error creando perfil para ${u.email}: ${error.message}`)
      } else {
        console.log(`  Creado perfil: ${u.email}`)
        created++
      }
    }
  }

  if (created === 0) {
    console.log("✅ Todos los usuarios ya tienen perfil.")
  } else {
    console.log(`✅ ${created} perfil(es) creado(s).`)
  }
}

main().catch(console.error)
