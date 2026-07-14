import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { commentSchema } from "@/lib/validations"
import { generarAlias } from "@/lib/alias"
import { requireUser } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("post_id")
  if (!postId) {
    return NextResponse.json({ error: "Falta post_id" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("comments_public")
    .select("id, parent_id, alias, body, vote_score, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const auth = await requireUser()
  if (auth.response) return auth.response
  const user = auth.user
  const supabase = await createClient()

  const body = await request.json()
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos. Revisa los campos.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: parsed.data.post_id,
      parent_id: parsed.data.parent_id ?? null,
      author_id: user.id,
      body: parsed.data.body,
      alias: generarAlias(),
    })
    .select("id, parent_id, alias, body, vote_score, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
