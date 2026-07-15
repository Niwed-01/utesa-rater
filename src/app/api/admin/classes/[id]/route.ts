import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"
import { logAudit } from "@/lib/security/audit"
import type { Json } from "@/types/database.types"
import { z } from "zod"

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().optional().nullable(),
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
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("classes")
    .update({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.code !== undefined && { code: parsed.data.code }),
    })
    .eq("id", id)

  if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })

  await logAudit(auth.user.id, "admin:update_class", id, parsed.data as unknown as Json)

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
  const { error } = await supabase.from("classes").delete().eq("id", id)
  if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })

  await logAudit(auth.user.id, "admin:delete_class", id)

  return NextResponse.json({ success: true })
}
