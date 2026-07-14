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

  const { error: postsErr } = await supabase
    .from("posts")
    .update({ professor_id: target_id })
    .eq("professor_id", source_id)
  if (postsErr) return NextResponse.json({ error: postsErr.message }, { status: 500 })

  const { data: sourceClasses } = await supabase
    .from("professor_classes")
    .select("class_id")
    .eq("professor_id", source_id)
  if (sourceClasses && sourceClasses.length > 0) {
    const classIds = sourceClasses.map(c => c.class_id)
    await supabase
      .from("professor_classes")
      .delete()
      .eq("professor_id", target_id)
      .in("class_id", classIds)
  }

  const { data: sourceCareers } = await supabase
    .from("professor_careers")
    .select("career_id")
    .eq("professor_id", source_id)
  if (sourceCareers && sourceCareers.length > 0) {
    const careerIds = sourceCareers.map(c => c.career_id)
    await supabase
      .from("professor_careers")
      .delete()
      .eq("professor_id", target_id)
      .in("career_id", careerIds)
  }

  const { error: pcErr } = await supabase
    .from("professor_classes")
    .update({ professor_id: target_id })
    .eq("professor_id", source_id)
  if (pcErr) return NextResponse.json({ error: pcErr.message }, { status: 500 })

  const { error: pcareersErr } = await supabase
    .from("professor_careers")
    .update({ professor_id: target_id })
    .eq("professor_id", source_id)
  if (pcareersErr) return NextResponse.json({ error: pcareersErr.message }, { status: 500 })

  const { error: delErr } = await supabase.from("professors").delete().eq("id", source_id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  await logAudit(auth.user.id, "admin:merge_professors", source_id, {
    source_id,
    target_id,
  } as unknown as Json)

  return NextResponse.json({ success: true })
}
