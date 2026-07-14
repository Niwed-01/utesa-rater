import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"
import { logAudit } from "@/lib/security/audit"
import { z } from "zod"

const patchSchema = z.object({
  is_banned: z.boolean().optional(),
  is_admin: z.boolean().optional(),
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

  if (parsed.data.is_banned === undefined && parsed.data.is_admin === undefined) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 })
  }

  const supabase = await createClient()
  const updateData: Record<string, boolean> = {}
  if (parsed.data.is_banned !== undefined) updateData.is_banned = parsed.data.is_banned
  if (parsed.data.is_admin !== undefined) updateData.is_admin = parsed.data.is_admin

  const { error } = await supabase
    .from("profiles")
    .update(updateData as never)
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (parsed.data.is_banned !== undefined) {
    await logAudit(auth.user.id, parsed.data.is_banned ? "admin:ban_user" : "admin:unban_user", id)
  }
  if (parsed.data.is_admin !== undefined) {
    await logAudit(auth.user.id, parsed.data.is_admin ? "admin:set_admin" : "admin:remove_admin", id)
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
  const { data: target, error: findError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", id)
    .maybeSingle()

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 })
  }

  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  if (target.is_admin) {
    return NextResponse.json({ error: "No puedes eliminar a otro administrador" }, { status: 403 })
  }

  const shortId = id.slice(0, 8)
  const { error } = await supabase
    .from("profiles")
    .update({
      is_banned: true,
      email: `usuario-eliminado-${shortId}@anon.local`,
      is_admin: false,
    })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit(auth.user.id, "admin:delete_user", id)

  return NextResponse.json({ success: true })
}
