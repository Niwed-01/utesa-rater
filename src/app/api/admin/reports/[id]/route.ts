import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  status: z.enum(["pendiente", "revisado", "descartado"]),
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
    .from("reports")
    .update({ status: parsed.data.status })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
