import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("posts_public")
    .select("rating_general")
    .eq("professor_id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ count: 0, avg_general: 0 })
  }

  const sum = data.reduce((acc, row) => acc + Number(row.rating_general), 0)

  return NextResponse.json({
    count: data.length,
    avg_general: sum / data.length,
  })
}
