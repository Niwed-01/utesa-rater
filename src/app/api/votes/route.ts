import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { voteSchema } from "@/lib/validations"
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
  const parsed = voteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos. Revisa los campos.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { post_id, comment_id, value } = parsed.data

  // If value is 0, delete existing vote
  if (value === 0) {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("user_id", user.id)
      .eq(post_id ? "post_id" : "comment_id", post_id ?? comment_id!)

    if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // Upsert vote
  const existing = await supabase
    .from("votes")
    .select("id, value")
    .eq("user_id", user.id)
    .eq(post_id ? "post_id" : "comment_id", post_id ?? comment_id!)
    .maybeSingle()

  if (existing.data) {
    if (existing.data.value === value) {
      // Same value → toggle off (remove)
      await supabase.from("votes").delete().eq("id", existing.data.id)
      return NextResponse.json({ success: true, action: "removed" })
    }
    // Different value → update
    const { error } = await supabase
      .from("votes")
      .update({ value })
      .eq("id", existing.data.id)
    if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
    return NextResponse.json({ success: true, action: "updated" })
  }

  const { error } = await supabase.from("votes").insert({
    user_id: user.id,
    post_id: post_id ?? null,
    comment_id: comment_id ?? null,
    value,
  })
  if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  return NextResponse.json({ success: true, action: "created" })
}
