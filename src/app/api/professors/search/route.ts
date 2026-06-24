import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim()

  const supabase = await createClient()
  let query = supabase
    .from("professors")
    .select("id, full_name, photo_url, created_at")

  if (q) {
    query = query.ilike("full_name", `%${q}%`)
  }

  const { data: professors, error } = await query.order("full_name").limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Attach careers for each professor
  const professorsWithCareers = await Promise.all(
    (professors ?? []).map(async (prof) => {
      const { data: careers } = await supabase
        .from("professor_careers")
        .select("career_id, careers(name)")
        .eq("professor_id", prof.id)

      return {
        ...prof,
        careers: careers?.map((c) => ({ id: c.career_id, name: c.careers?.name })) ?? [],
      }
    })
  )

  return NextResponse.json(professorsWithCareers)
}
