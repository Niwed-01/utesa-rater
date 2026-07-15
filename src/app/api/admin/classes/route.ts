import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"
import { validateOrigin } from "@/lib/security/csrf"
import { logAudit } from "@/lib/security/audit"
import { z } from "zod"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("classes")
    .select("id, name, code")
    .order("name", { ascending: true })

  if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  return NextResponse.json(data)
}

const createSchema = z.object({
  name: z.string().min(1, "Requerido").max(200),
  code: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("classes")
    .insert({ name: parsed.data.name, code: parsed.data.code ?? null })
    .select("id, name")
    .single()

  if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })

  await logAudit(auth.user.id, "admin:create_class", data.id, { name: parsed.data.name })

  return NextResponse.json(data, { status: 201 })
}
