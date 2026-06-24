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
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY")
  console.error("Crea un archivo .env.seed en la raíz con:")
  console.error("  NEXT_PUBLIC_SUPABASE_URL=...")
  console.error("  SUPABASE_SERVICE_ROLE_KEY=...")
  console.error("")
  console.error("⚠️  NUNCA agregues SUPABASE_SERVICE_ROLE_KEY a .env.local")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const careers = [
  // Ciencias de la Salud
  { name: "Ciencias de la Salud" },

  // Arquitectura e Ingenierías
  { name: "Arquitectura" },
  { name: "Ingeniería en Sistemas Computacionales" },
  { name: "Ingeniería Civil" },
  { name: "Ingeniería Industrial" },
  { name: "Ingeniería Eléctrica" },
  { name: "Ingeniería Electrónica" },
  { name: "Ingeniería Mecánica" },

  // Ciencias Económicas y Sociales
  { name: "Administración de Empresas" },
  { name: "Administración de Empresas Turísticas y Hoteleras" },
  { name: "Contaduría Pública" },
  { name: "Mercadeo" },
  { name: "Economía" },

  // Ciencias y Humanidades
  { name: "Derecho" },
  { name: "Psicología" },
  { name: "Comunicación Social" },
  { name: "Lenguas Extranjeras" },
  { name: "Educación" },
  { name: "Educación Física" },

  // Ciencias Básicas
  { name: "Matemáticas" },
]

async function main() {
  for (const career of careers) {
    const { data: existing } = await supabase
      .from("careers")
      .select("id")
      .eq("name", career.name)
      .maybeSingle()

    if (existing) {
      console.log(`Ya existe: ${career.name}`)
    } else {
      const { error } = await supabase
        .from("careers")
        .insert({ name: career.name })
      if (error) {
        console.error(`Error insertando ${career.name}:`, error.message)
      } else {
        console.log(`Insertado: ${career.name}`)
      }
    }
  }

  console.log("Seed de carreras completado!")
}

main().catch(console.error)
