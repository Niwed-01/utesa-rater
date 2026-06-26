import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  is_hidden: z.boolean().optional(),
  body: z.string().min(10).max(3000).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const { id } = params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("posts")
    .update({
      ...(parsed.data.is_hidden !== undefined && { is_hidden: parsed.data.is_hidden }),
      ...(parsed.data.body !== undefined && { body: parsed.data.body }),
    })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const { id } = params

  const supabase = await createClient()
  const { error } = await supabase.from("posts").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
