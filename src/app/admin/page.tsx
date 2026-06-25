import { createClient } from "@/lib/supabase/server"
import { Flag, Users as UsersIcon, MessageSquare, FileText, Download } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: totalPosts },
    { count: totalComments },
    { count: pendingReports },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendiente"),
  ])

  const { data: recentReports } = await supabase
    .from("reports")
    .select("id, reason, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, email, created_at")
    .order("created_at", { ascending: false })
    .limit(5)

  const cards = [
    {
      label: "Usuarios",
      value: totalUsers ?? 0,
      icon: UsersIcon,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Reseñas",
      value: totalPosts ?? 0,
      icon: FileText,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Comentarios",
      value: totalComments ?? 0,
      icon: MessageSquare,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      label: "Reportes pendientes",
      value: pendingReports ?? 0,
      icon: Flag,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Panel de administración</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Export buttons */}
      <div className="flex flex-wrap gap-3">
        <a href="/api/admin/export/users" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-white hover:border-blue-500/30 transition-all">
          <Download className="h-4 w-4 text-blue-500" /> Exportar usuarios (CSV)
        </a>
        <a href="/api/admin/export/posts" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-white hover:border-emerald-500/30 transition-all">
          <Download className="h-4 w-4 text-emerald-500" /> Exportar reseñas (CSV)
        </a>
        <a href="/api/admin/export/reports" className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-white hover:border-amber-500/30 transition-all">
          <Download className="h-4 w-4 text-amber-500" /> Exportar reportes (CSV)
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent reports */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Flag className="h-4 w-4 text-amber-500" />
            Últimos reportes
          </h2>
          {recentReports && recentReports.length > 0 ? (
            <ul className="space-y-2">
              {recentReports.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate text-muted-foreground max-w-[200px]">
                    {r.reason}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {r.status}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No hay reportes.</p>
          )}
        </div>

        {/* Recent users */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-blue-500" />
            Últimos registros
          </h2>
          {recentUsers && recentUsers.length > 0 ? (
            <ul className="space-y-2">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground truncate max-w-[200px]">
                    {u.email}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {new Date(u.created_at).toLocaleDateString("es-DO")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay usuarios registrados.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
