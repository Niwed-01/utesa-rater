import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { postSchema } from "@/lib/validations"
import { requireUser } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const user = auth.user
  const supabase = await createClient()

  const body = await request.json()
  const parsed = postSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos. Revisa los campos.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { error } = await supabase
    .from("posts")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("author_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const user = auth.user
  const supabase = await createClient()

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", params.id)
    .eq("author_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
