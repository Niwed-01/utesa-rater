import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"
import { logAudit } from "@/lib/security/audit"
import { z } from "zod"

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Selecciona al menos un elemento"),
  action: z.enum(["hide", "show", "delete"]),
})

export async function POST(request: Request) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const supabase = await createClient()
  const { ids, action } = parsed.data

  if (action === "delete") {
    const { error } = await supabase.from("comments").delete().in("id", ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from("comments")
      .update({ is_hidden: action === "hide" })
      .in("id", ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const auditAction = action === "delete" ? "admin:delete_comment" : action === "hide" ? "admin:hide_comment" : "admin:show_comment"
  for (const id of ids) {
    await logAudit(auth.user.id, auditAction, id)
  }

  return NextResponse.json({ success: true, count: ids.length })
}
