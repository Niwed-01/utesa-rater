import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("email, is_admin, is_banned, created_at")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

function escapeCsv(value: string | boolean | Date | null | undefined): string {
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

  const header = "email,admin,baneado,registrado\n"
  const rows = (data ?? [])
    .map((u) => `${escapeCsv(u.email)},${escapeCsv(u.is_admin)},${escapeCsv(u.is_banned)},${escapeCsv(u.created_at)}`)
    .join("\n")

  return new NextResponse(header + rows, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="usuarios-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
