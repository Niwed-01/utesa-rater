import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { postSchema } from "@/lib/validations"
import { generarAlias } from "@/lib/alias"
import { requireUser } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"

export async function POST(request: Request) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const auth = await requireUser()
  if (auth.response) return auth.response
  const user = auth.user

  const supabase = await createClient()

  const body = await request.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos. Revisa los campos.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      professor_id: parsed.data.professor_id,
      class_id: parsed.data.class_id,
      title: parsed.data.title?.trim() || null,
      body: parsed.data.body,
      tags: parsed.data.tags,
      volveria_a_tomar: parsed.data.volveria_a_tomar,
      alias: generarAlias(),
      rating_claridad: parsed.data.rating_claridad,
      rating_justicia: parsed.data.rating_justicia,
      rating_puntualidad: parsed.data.rating_puntualidad,
      rating_exigencia: parsed.data.rating_exigencia,
      rating_disponibilidad: parsed.data.rating_disponibilidad,
      semester: parsed.data.semester,
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const professorId = searchParams.get("professor_id")
  const limit = parseInt(searchParams.get("limit") ?? "10", 10)

  const supabase = await createClient()
  let query = supabase
    .from("posts_public")
    .select("id, title, alias, rating_general, created_at")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 50))

  if (professorId) {
    query = query.eq("professor_id", professorId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
