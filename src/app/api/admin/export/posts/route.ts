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

  if (error) return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })

function escapeCsv(value: unknown): string {
  if (value == null) return ""
  const str = String(value)
  if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@") || str.startsWith("|")) {
    return `"'${str}"`
  }
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

  const header = "alias,profesor,rating_general,votos,oculta,trimestre,fecha\n"
  const rows = (data ?? [])
    .map((p) => {
      const profName = p.professors?.full_name ?? ""
      return [
        escapeCsv(p.alias),
        escapeCsv(profName),
        escapeCsv(p.rating_general),
        escapeCsv(p.vote_score),
        escapeCsv(p.is_hidden),
        escapeCsv(p.semester ?? ""),
        escapeCsv(p.created_at),
      ].join(",")
    })
    .join("\n")

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="resenas-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
