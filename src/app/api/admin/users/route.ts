import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, created_at, is_banned, is_admin")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }

  return NextResponse.json(data)
}
