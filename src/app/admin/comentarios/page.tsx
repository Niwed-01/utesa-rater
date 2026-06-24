"use client"

import { useCallback, useEffect, useState } from "react"
import { EyeOff, Eye, Loader2, RefreshCw, Trash2 } from "lucide-react"

interface Comment {
  id: string
  alias: string
  body: string
  is_hidden: boolean
  vote_score: number
  created_at: string
  post_id: string
}

export default function AdminComentariosPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/comments")
      if (res.ok) setComments(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  async function toggleHide(id: string, current: boolean) {
    setActionLoading(`hide-${id}`)
    try {
      await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_hidden: !current }),
      })
      await fetchComments()
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteComment(id: string) {
    if (!window.confirm("¿Estás seguro de eliminar este comentario? Esta acción no se puede deshacer.")) return

    setActionLoading(`delete-${id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Error al eliminar")
      } else {
        await fetchComments()
      }
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
        <h1 className="text-2xl font-bold">Comentarios</h1>
        <button
          onClick={fetchComments}
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

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay comentarios.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Alias</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Comentario</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Votos</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.alias}</td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="truncate">{c.body}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.vote_score}</td>
                  <td className="px-4 py-3">
                    {c.is_hidden ? (
                      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                        Oculto
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        Visible
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString("es-DO")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleHide(c.id, c.is_hidden)}
                        disabled={actionLoading === `hide-${c.id}`}
                        className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-50"
                        title={c.is_hidden ? "Mostrar" : "Ocultar"}
                      >
                        {actionLoading === `hide-${c.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : c.is_hidden ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteComment(c.id)}
                        disabled={actionLoading === `delete-${c.id}`}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        title="Eliminar comentario"
                      >
                        {actionLoading === `delete-${c.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
