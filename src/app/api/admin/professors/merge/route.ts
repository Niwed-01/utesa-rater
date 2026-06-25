import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({
  source_id: z.string().uuid(),
  target_id: z.string().uuid(),
})

export async function POST(request: Request) {
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

  const admin = createAdminClient()

  const [sourceRes, targetRes] = await Promise.all([
    admin.from("professors").select("id").eq("id", parsed.data.source_id).single(),
    admin.from("professors").select("id").eq("id", parsed.data.target_id).single(),
  ])

  if (sourceRes.error || !sourceRes.data) {
    return NextResponse.json({ error: "Profesor origen no encontrado" }, { status: 404 })
  }
  if (targetRes.error || !targetRes.data) {
    return NextResponse.json({ error: "Profesor destino no encontrado" }, { status: 404 })
  }

  const { source_id, target_id } = parsed.data

  const { error: postsErr } = await admin
    .from("posts")
    .update({ professor_id: target_id } as never)
    .eq("professor_id", source_id)
  if (postsErr) return NextResponse.json({ error: postsErr.message }, { status: 500 })

  const { error: pcErr } = await admin
    .from("professor_classes")
    .update({ professor_id: target_id } as never)
    .eq("professor_id", source_id)
  if (pcErr) return NextResponse.json({ error: pcErr.message }, { status: 500 })

  const { error: pcareersErr } = await admin
    .from("professor_careers")
    .update({ professor_id: target_id } as never)
    .eq("professor_id", source_id)
  if (pcareersErr) return NextResponse.json({ error: pcareersErr.message }, { status: 500 })

  const { error: delErr } = await admin.from("professors").delete().eq("id", source_id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
