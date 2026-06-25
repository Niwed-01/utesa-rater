import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("reports")
    .select("reason, status, created_at, post_id, comment_id")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const header = "motivo,estado,tipo,fecha\n"
  const rows = (data ?? [])
    .map((r) => {
      const tipo = r.post_id ? "reseña" : "comentario"
      return `"${r.reason.replace(/"/g, '""')}",${r.status},${tipo},${r.created_at}`
    })
    .join("\n")

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reportes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
