import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database.types"

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variable de entorno ${name} no está definida`)
  return value
}

export function createClient() {
  return createBrowserClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  )
}
