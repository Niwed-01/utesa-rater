import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type AuthResult =
  | { user: import("@supabase/supabase-js").User; response: null }
  | { user: null; response: NextResponse }

export async function requireUser(): Promise<AuthResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "No autorizado" }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single()

  if (profile?.is_banned) {
    return { user: null, response: NextResponse.json({ error: "Cuenta suspendida" }, { status: 403 }) }
  }

  return { user, response: null }
}

export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireUser()
  if (result.response) return result

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", result.user.id)
    .single()

  if (!profile?.is_admin) {
    return { user: null, response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }) }
  }

  return result
}
