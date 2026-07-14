import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { requireUser } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"

const createSchema = z.object({
  full_name: z.string().min(2, "Nombre muy corto").max(200),
  career_ids: z.array(z.string().uuid()).min(1, "Selecciona al menos una carrera"),
})

export async function POST(request: Request) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const auth = await requireUser()
  if (auth.response) return auth.response
  const supabase = await createClient()

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos. Revisa los campos.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Check duplicate by name
  const { data: existing } = await supabase
    .from("professors")
    .select("id, full_name")
    .ilike("full_name", parsed.data.full_name)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(existing, { status: 200 })
  }

  const { data: professor, error: profError } = await supabase
    .from("professors")
    .insert({ full_name: parsed.data.full_name })
    .select("id, full_name")
    .single()

  if (profError) {
    return NextResponse.json({ error: profError.message }, { status: 500 })
  }

  // Link careers
  const { error: linkError } = await supabase.from("professor_careers").insert(
    parsed.data.career_ids.map((career_id) => ({
      professor_id: professor.id,
      career_id,
    }))
  )

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 })
  }

  // Fetch careers for response
  const { data: careers } = await supabase
    .from("professor_careers")
    .select("career_id, careers(name)")
    .eq("professor_id", professor.id)

  return NextResponse.json({
    id: professor.id,
    full_name: professor.full_name,
    careers: careers?.map((c) => ({ id: c.career_id, name: c.careers?.name })) ?? [],
  }, { status: 201 })
}
