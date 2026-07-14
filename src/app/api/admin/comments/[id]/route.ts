import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"
import { logAudit } from "@/lib/security/audit"
import { z } from "zod"

const schema = z.object({
  is_hidden: z.boolean().optional(),
  body: z.string().min(1).max(1000).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

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
    .from("comments")
    .update({
      ...(parsed.data.is_hidden !== undefined && { is_hidden: parsed.data.is_hidden }),
      ...(parsed.data.body !== undefined && { body: parsed.data.body }),
    })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (parsed.data.is_hidden !== undefined) {
    await logAudit(
      auth.user.id,
      parsed.data.is_hidden ? "admin:hide_comment" : "admin:show_comment",
      id,
    )
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const { id } = params

  const supabase = await createClient()
  const { error } = await supabase.from("comments").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit(auth.user.id, "admin:delete_comment", id)

  return NextResponse.json({ success: true })
}
