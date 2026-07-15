import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"
import { logAudit } from "@/lib/security/audit"
import type { Json } from "@/types/database.types"
import { z } from "zod"

const patchSchema = z.object({
  full_name: z.string().min(2).max(200).optional(),
  photo_url: z.string().url().optional().nullable(),
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
    .from("professors")
    .update({
      ...(parsed.data.full_name !== undefined && { full_name: parsed.data.full_name }),
      ...(parsed.data.photo_url !== undefined && { photo_url: parsed.data.photo_url }),
    })
    .eq("id", id)

  if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })

  await logAudit(auth.user.id, "admin:update_professor", id, parsed.data as unknown as Json)

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
  const { error } = await supabase.from("professors").delete().eq("id", id)
  if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })

  await logAudit(auth.user.id, "admin:delete_professor", id)

  return NextResponse.json({ success: true })
}
