"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle, XCircle, EyeOff, Eye, Loader2, RefreshCw, Trash2, Pencil } from "lucide-react"

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
  const [error, setError] = useState<string | null>(null)

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

  async function deleteContent(type: "posts" | "comments", id: string) {
    const label = type === "posts" ? "reseña" : "comentario"
    if (!window.confirm(`¿Estás seguro de eliminar este ${label}? Esta acción no se puede deshacer.`)) return

    setActionLoading(`delete-${type}-${id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/${type}/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Error al eliminar")
      } else {
        await fetchReports()
      }
    } finally {
      setActionLoading(null)
    }
  }

  const [editContent, setEditContent] = useState<{ id: string; type: "posts" | "comments"; alias: string; body: string } | null>(null)
  const [editBody, setEditBody] = useState("")
  const editRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (editRef.current && !editRef.current.contains(e.target as Node)) setEditContent(null)
    }
    if (editContent) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [editContent])

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editContent || !editBody.trim()) return
    setActionLoading(`edit-${editContent.id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/${editContent.type}/${editContent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody.trim() }),
      })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else { setEditContent(null); await fetchReports() }
    } finally { setActionLoading(null) }
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

      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

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
                          <>
                            <button
                              onClick={() => { setEditContent({ id: content.id, type, alias: content.alias, body: content.body }); setEditBody(content.body) }}
                              className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-500/10 transition-all"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
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
                            <button
                              onClick={() => deleteContent(type, content.id)}
                              disabled={actionLoading === `delete-${type}-${content.id}`}
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                              title="Eliminar"
                            >
                              {actionLoading === `delete-${type}-${content.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </>
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

      {/* Edit modal */}
      {editContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditContent(null)}>
          <div ref={editRef} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Editar {editContent.type === "posts" ? "reseña" : "comentario"}</h2>
            <p className="text-xs text-muted-foreground mb-4">Alias: {editContent.alias}</p>
            <form onSubmit={saveEdit} className="space-y-4">
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                rows={5}
                maxLength={editContent.type === "posts" ? 3000 : 1000}
                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditContent(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">Cancelar</button>
                <button type="submit" disabled={actionLoading === `edit-${editContent.id}` || !editBody.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-all disabled:opacity-50">
                  {actionLoading === `edit-${editContent.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
