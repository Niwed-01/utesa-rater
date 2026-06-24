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
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const email = process.argv[2]

if (!email) {
  console.error("❌ Uso: npx tsx scripts/fix-my-profile.ts <email>")
  process.exit(1)
}

async function main() {
  // Find all profiles for this email (service_role bypasses RLS)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, is_admin")
    .eq("email", email)

  if (!profiles || profiles.length === 0) {
    console.error(`❌ No hay perfiles con email "${email}"`)
    console.error("Primero visita /perfil en el navegador para que se cree tu perfil automáticamente.")
    process.exit(1)
  }

  console.log(`Perfiles encontrados: ${profiles.length}`)
  for (const p of profiles) {
    console.log(`  - id: ${p.id}, is_admin: ${p.is_admin}`)
  }

  // Get the auth user's real UUID via the admin API
  const { data: users } = await supabase.auth.admin.listUsers()
  const authUser = users?.users.find((u) => u.email === email)
  if (!authUser) {
    console.error(`❌ No se encontró auth user con email "${email}"`)
    process.exit(1)
  }
  const realId = authUser.id

  console.log(`Auth user UUID: ${realId}`)

  const correctProfile = profiles.find((p) => p.id === realId)
  const oldProfiles = profiles.filter((p) => p.id !== realId)

  // If there's an old profile with is_admin = true, transfer it
  const hasAdminInOld = oldProfiles.some((p) => p.is_admin)

  if (hasAdminInOld) {
    if (correctProfile) {
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("id", realId)
      if (upErr) {
        console.error(`❌ Error actualizando is_admin: ${upErr.message}`)
        process.exit(1)
      }
      console.log(`✅ is_admin = true aplicado al perfil correcto (${realId})`)
    }

    // Delete old duplicates
    for (const old of oldProfiles) {
      const { error: delErr } = await supabase
        .from("profiles")
        .delete()
        .eq("id", old.id)
      if (delErr) {
        console.error(`❌ Error eliminando duplicado ${old.id}: ${delErr.message}`)
      } else {
        console.log(`🗑️  Duplicado eliminado (${old.id})`)
      }
    }
  } else if (correctProfile) {
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", realId)
    if (upErr) {
      console.error(`❌ Error actualizando is_admin: ${upErr.message}`)
      process.exit(1)
    }
    console.log(`✅ is_admin = true aplicado a tu perfil`)
  } else {
    console.log(`ℹ️  No hay cambios necesarios.`)
  }

  console.log(`\n✅ Listo. Recarga /perfil con Ctrl+Shift+R.`)
}

main().catch(console.error)
