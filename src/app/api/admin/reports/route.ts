import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("reports")
    .select(`
      *,
      posts!left(id, alias, body, is_hidden),
      comments!left(id, alias, body, is_hidden)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }

  return NextResponse.json(data)
}
