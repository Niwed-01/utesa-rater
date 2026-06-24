import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 100)
  const offset = parseInt(searchParams.get("offset") ?? "0", 10)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .select("id, alias, title, body, is_hidden, vote_score, created_at, author_id")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
