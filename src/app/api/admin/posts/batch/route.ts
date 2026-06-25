import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Selecciona al menos un elemento"),
  action: z.enum(["hide", "show", "delete"]),
})

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const admin = createAdminClient()
  const { ids, action } = parsed.data

  if (action === "delete") {
    const { error } = await admin.from("posts").delete().in("id", ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await admin
      .from("posts")
      .update({ is_hidden: action === "hide" })
      .in("id", ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: ids.length })
}
