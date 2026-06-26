"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EyeOff, Eye, Loader2, RefreshCw, Trash2, Pencil, CheckSquare, Square } from "lucide-react"

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
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editComment, setEditComment] = useState<Comment | null>(null)
  const [editBody, setEditBody] = useState("")
  const editRef = useRef<HTMLDivElement>(null)

  const fetchComments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/comments")
      if (res.ok) setComments(await res.json())
      else setError("Error al cargar comentarios")
    } catch { setError("Error de conexión") } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchComments() }, [fetchComments])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (editRef.current && !editRef.current.contains(e.target as Node)) setEditComment(null)
    }
    if (editComment) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [editComment])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === comments.length) setSelected(new Set())
    else setSelected(new Set(comments.map(c => c.id)))
  }

  async function batchAction(action: "hide" | "show" | "delete") {
    if (selected.size === 0) return
    if (action === "delete" && !window.confirm(`¿Eliminar ${selected.size} comentarios?`)) return

    setActionLoading("batch")
    setError(null)
    try {
      const res = await fetch("/api/admin/comments/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else { setSelected(new Set()); await fetchComments() }
    } finally { setActionLoading(null) }
  }

  async function toggleHide(id: string, current: boolean) {
    setActionLoading(`hide-${id}`)
    try {
      await fetch(`/api/admin/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_hidden: !current }),
      })
      await fetchComments()
    } finally { setActionLoading(prev => prev === `hide-${id}` ? null : prev) }
  }

  async function deleteComment(id: string) {
    if (!window.confirm("¿Eliminar este comentario?")) return
    setActionLoading(`delete-${id}`); setError(null)
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else await fetchComments()
    } finally { setActionLoading(prev => prev === `delete-${id}` ? null : prev) }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editComment || !editBody.trim()) return
    setActionLoading(`edit-${editComment.id}`); setError(null)
    try {
      const res = await fetch(`/api/admin/comments/${editComment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody.trim() }),
      })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else { setEditComment(null); await fetchComments() }
    } finally { setActionLoading(prev => prev === `edit-${editComment.id}` ? null : prev) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comentarios</h1>
        <button onClick={fetchComments} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">
          <RefreshCw className="h-4 w-4" /> Recargar
        </button>
      </div>

      {error && <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
          <span className="text-sm text-muted-foreground">{selected.size} seleccionados</span>
          <div className="flex gap-1 ml-auto">
            <button onClick={() => batchAction("hide")} disabled={actionLoading === "batch"} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50">Ocultar</button>
            <button onClick={() => batchAction("show")} disabled={actionLoading === "batch"} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50">Mostrar</button>
            <button onClick={() => batchAction("delete")} disabled={actionLoading === "batch"} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
              {actionLoading === "batch" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Eliminar"}
            </button>
          </div>
        </div>
      )}

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay comentarios.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-white transition-all">
                    {selected.size === comments.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
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
                <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${selected.has(c.id) ? "bg-emerald-500/5" : ""}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(c.id)} className="text-muted-foreground hover:text-white transition-all">
                      {selected.has(c.id) ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium">{c.alias}</td>
                  <td className="px-4 py-3 max-w-[300px]">
                    <p className="truncate">{c.body}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.vote_score}</td>
                  <td className="px-4 py-3">
                    {c.is_hidden ? (
                      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">Oculto</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">Visible</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString("es-DO")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditComment(c); setEditBody(c.body) }} className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-500/10 transition-all" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => toggleHide(c.id, c.is_hidden)} disabled={actionLoading === `hide-${c.id}`} className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-50" title={c.is_hidden ? "Mostrar" : "Ocultar"}>
                        {actionLoading === `hide-${c.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : c.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button onClick={() => deleteComment(c.id)} disabled={actionLoading === `delete-${c.id}`} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50" title="Eliminar">
                        {actionLoading === `delete-${c.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditComment(null)}>
          <div ref={editRef} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Editar comentario</h2>
            <p className="text-xs text-muted-foreground mb-4">Alias: {editComment.alias}</p>
            <form onSubmit={saveEdit} className="space-y-4">
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                rows={4}
                maxLength={1000}
                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditComment(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">Cancelar</button>
                <button type="submit" disabled={actionLoading === `edit-${editComment.id}` || !editBody.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-all disabled:opacity-50">
                  {actionLoading === `edit-${editComment.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
