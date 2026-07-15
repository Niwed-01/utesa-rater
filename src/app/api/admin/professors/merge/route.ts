import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"
import { logAudit } from "@/lib/security/audit"
import type { Json } from "@/types/database.types"
import { z } from "zod"

const schema = z.object({
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
})

export async function POST(request: Request) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "IDs inválidos" }, { status: 400 })
  }

  if (parsed.data.source_id === parsed.data.target_id) {
    return NextResponse.json({ error: "Los profesores deben ser distintos" }, { status: 400 })
  }

  const supabase = await createClient()
  const { source_id, target_id } = parsed.data

  const [sourceRes, targetRes] = await Promise.all([
    supabase.from("professors").select("id").eq("id", source_id).maybeSingle(),
    supabase.from("professors").select("id").eq("id", target_id).maybeSingle(),
  ])

  if (!sourceRes.data) {
    return NextResponse.json({ error: "Profesor origen no encontrado" }, { status: 404 })
  }
  if (!targetRes.data) {
    return NextResponse.json({ error: "Profesor destino no encontrado" }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: mergeErr } = await (supabase as any).rpc("merge_professors", {
    source_id,
    target_id,
  })

  if (mergeErr) {
    return NextResponse.json({ error: "Error al fusionar profesores" }, { status: 500 })
  }

  await logAudit(auth.user.id, "admin:merge_professors", source_id, {
    source_id,
    target_id,
  } as unknown as Json)

  return NextResponse.json({ success: true })
}
