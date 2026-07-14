import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { requireUser } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"

const updateSchema = z.object({
  career_ids: z.array(z.string().uuid()).min(1, "Selecciona al menos una carrera"),
})

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const auth = await requireUser()
  if (auth.response) return auth.response
  const supabase = await createClient()

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos. Revisa los campos.", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  // Verify professor exists
  const { data: professor } = await supabase
    .from("professors")
    .select("id, full_name")
    .eq("id", params.id)
    .single()

  if (!professor) {
    return NextResponse.json({ error: "Profesor no encontrado" }, { status: 404 })
  }

  // Replace all careers: delete old, insert new
  const { error: deleteError } = await supabase
    .from("professor_careers")
    .delete()
    .eq("professor_id", params.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if (parsed.data.career_ids.length > 0) {
    const { error: insertError } = await supabase.from("professor_careers").insert(
      parsed.data.career_ids.map((career_id) => ({
        professor_id: params.id,
        career_id,
      }))
    )

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Fetch updated careers
  const { data: careers } = await supabase
    .from("professor_careers")
    .select("career_id, careers(name)")
    .eq("professor_id", params.id)

  return NextResponse.json({
    id: professor.id,
    full_name: professor.full_name,
    careers: careers?.map((c) => ({ id: c.career_id, name: c.careers?.name })) ?? [],
  })
}
