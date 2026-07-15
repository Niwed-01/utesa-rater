import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database.types"

function requireEnv(value: string | undefined, name: string): string {
  if (!value) throw new Error(`Variable de entorno ${name} no está definida`)
  return value
}

export function createClient() {
  return createBrowserClient<Database>(
    requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  )
}
