"use client"

import { useCallback, useEffect, useState } from "react"
import { CheckCircle, XCircle, EyeOff, Eye, Loader2, RefreshCw } from "lucide-react"

interface PostInfo {
  id: string
  alias: string
  body: string
  is_hidden: boolean
}

interface CommentInfo {
  id: string
  alias: string
  body: string
  is_hidden: boolean
}

interface Report {
  id: string
  post_id: string | null
  comment_id: string | null
  reason: string
  status: string
  created_at: string
  posts: PostInfo | null
  comments: CommentInfo | null
}

const statusBadge: Record<string, string> = {
  pendiente: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  revisado: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  descartado: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
}

function getStatusText(status: string): string {
  switch (status) {
    case "revisado": return "Revisado"
    case "descartado": return "Descartado"
    default: return "Pendiente"
  }
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/reports")
      if (res.ok) setReports(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  async function updateStatus(id: string, status: string) {
    setActionLoading(`status-${id}`)
    try {
      await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      await fetchReports()
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleHide(type: "posts" | "comments", id: string, current: boolean) {
    setActionLoading(`hide-${type}-${id}`)
    try {
      await fetch(`/api/admin/${type}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_hidden: !current }),
      })
      await fetchReports()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reportes</h1>
        <button
          onClick={fetchReports}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Recargar
        </button>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay reportes.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contenido</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Motivo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const content = r.posts ?? r.comments
                const type = r.posts ? "posts" : "comments"
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate font-medium">
                        {content?.alias ?? "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {content?.body.slice(0, 80) ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate">{r.reason}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          statusBadge[r.status] ?? statusBadge.pendiente
                        }`}
                      >
                        {getStatusText(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("es-DO")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {r.status === "pendiente" && (
                          <button
                            onClick={() => updateStatus(r.id, "revisado")}
                            disabled={actionLoading === `status-${r.id}`}
                            className="rounded-lg p-1.5 text-emerald-500 hover:bg-emerald-500/10 transition-all disabled:opacity-50"
                            title="Marcar revisado"
                          >
                            {actionLoading === `status-${r.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {r.status === "pendiente" && (
                          <button
                            onClick={() => updateStatus(r.id, "descartado")}
                            disabled={actionLoading === `status-${r.id}`}
                            className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-500/10 transition-all disabled:opacity-50"
                            title="Descartar"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {content && (
                          <button
                            onClick={() => toggleHide(type, content.id, content.is_hidden)}
                            disabled={actionLoading === `hide-${type}-${content.id}`}
                            className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-50"
                            title={content.is_hidden ? "Mostrar" : "Ocultar"}
                          >
                            {actionLoading === `hide-${type}-${content.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : content.is_hidden ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
