import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  const supabase = await createClient()
  let query = supabase.from("classes").select("id, name, code")

  if (q) {
    query = query.ilike("name", `%${q}%`)
  }

  const { data, error } = await query.order("name").limit(20)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
