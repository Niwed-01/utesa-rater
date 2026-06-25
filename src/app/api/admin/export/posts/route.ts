import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .select("alias, rating_general, vote_score, is_hidden, semester, created_at, professors(full_name)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const header = "alias,profesor,rating_general,votos,oculta,trimestre,fecha\n"
  const rows = (data ?? [])
    .map((p) => {
      const profName = p.professors?.full_name ?? ""
      return `${p.alias},"${profName}",${p.rating_general},${p.vote_score},${p.is_hidden},${p.semester ?? ""},${p.created_at}`
    })
    .join("\n")

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="resenas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
