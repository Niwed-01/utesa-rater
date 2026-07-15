import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"

const createSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(200),
  code: z.string().max(20).optional(),
  professor_id: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const supabase = await createClient()

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos invÃ¡lidos. Revisa los campos.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from("classes")
    .select("id, name, code")
    .ilike("name", parsed.data.name)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(existing, { status: 200 })
  }

  const { data: classData, error: classError } = await supabase
    .from("classes")
    .insert({ name: parsed.data.name, code: parsed.data.code ?? null })
    .select("id, name, code")
    .single()

  if (classError) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }

  // Link to professor if provided
  if (parsed.data.professor_id) {
    await supabase.from("professor_classes").insert({
      professor_id: parsed.data.professor_id,
      class_id: classData.id,
    }).maybeSingle()
  }

  return NextResponse.json(classData, { status: 201 })
}
