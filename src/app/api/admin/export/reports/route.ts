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

  const header = "motivo,estado,tipo,fecha\n"
  const rows = (data ?? [])
    .map((r) => {
      const tipo = r.post_id ? "reseña" : "comentario"
      return `${escapeCsv(r.reason)},${escapeCsv(r.status)},${escapeCsv(tipo)},${escapeCsv(r.created_at)}`
    })
    .join("\n")

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reportes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
