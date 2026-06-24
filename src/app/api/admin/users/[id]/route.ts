import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

const patchSchema = z.object({
  is_banned: z.boolean().optional(),
  is_admin: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const { id } = await params
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

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const { id } = await params

  const supabase = await createClient()
  const { data: target } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", id)
    .single()

  if (target?.is_admin) {
    return NextResponse.json({ error: "No puedes eliminar a otro administrador" }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const { error } = await adminClient.auth.admin.deleteUser(id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
