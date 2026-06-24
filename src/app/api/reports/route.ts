import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { reportSchema } from "@/lib/validations"
import { requireUser } from "@/lib/auth"

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const user = auth.user
  const supabase = await createClient()

  const body = await request.json()
  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos. Revisa los campos.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      post_id: parsed.data.post_id ?? null,
      comment_id: parsed.data.comment_id ?? null,
      reason: parsed.data.reason,
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
