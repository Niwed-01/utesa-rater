import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth"
import { z } from "zod"

const patchSchema = z.object({
  title: z.string().max(200).optional(),
  body: z.string().min(10, "Mínimo 10 caracteres").max(3000, "Máximo 3000 caracteres").optional(),
  volveria_a_tomar: z.boolean().optional(),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const user = auth.user
  const supabase = await createClient()

  const body = await request.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos. Revisa los campos.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("id", params.id)
    .eq("author_id", user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: "Reseña no encontrada o no tienes permiso" }, { status: 404 })
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

  const { data: existing } = await supabase
    .from("posts")
    .select("id")
    .eq("id", params.id)
    .eq("author_id", user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json({ error: "Reseña no encontrada o no tienes permiso" }, { status: 404 })
  }

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
