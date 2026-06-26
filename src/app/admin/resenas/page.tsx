"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { EyeOff, Eye, Loader2, RefreshCw, Trash2, Pencil, CheckSquare, Square } from "lucide-react"

interface Post {
  id: string
  alias: string
  title: string | null
  body: string
  is_hidden: boolean
  vote_score: number
  created_at: string
}

export default function AdminResenasPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [editBody, setEditBody] = useState("")
  const editRef = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/posts")
      if (res.ok) setPosts(await res.json())
      else setError("Error al cargar reseñas")
    } catch { setError("Error de conexión") } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (editRef.current && !editRef.current.contains(e.target as Node)) setEditPost(null)
    }
    if (editPost) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [editPost])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === posts.length) setSelected(new Set())
    else setSelected(new Set(posts.map(p => p.id)))
  }

  async function batchAction(action: "hide" | "show" | "delete") {
    if (selected.size === 0) return
    if (action === "delete" && !window.confirm(`¿Eliminar ${selected.size} reseñas? Esta acción no se puede deshacer.`)) return

    setActionLoading("batch")
    setError(null)
    try {
      const res = await fetch("/api/admin/posts/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else { setSelected(new Set()); await fetchPosts() }
    } finally { setActionLoading(prev => prev === "batch" ? null : prev) }
  }

  async function toggleHide(id: string, current: boolean) {
    setActionLoading(`hide-${id}`)
    try {
      await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_hidden: !current }),
      })
      await fetchPosts()
    } finally { setActionLoading(prev => prev === `hide-${id}` ? null : prev) }
  }

  async function deletePost(id: string) {
    if (!window.confirm("¿Eliminar esta reseña? También se borrarán sus comentarios.")) return
    setActionLoading(`delete-${id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else await fetchPosts()
    } finally { setActionLoading(prev => prev === `delete-${id}` ? null : prev) }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editPost || !editBody.trim()) return
    setActionLoading(`edit-${editPost.id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/posts/${editPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody.trim() }),
      })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else { setEditPost(null); await fetchPosts() }
    } finally { setActionLoading(prev => prev === `edit-${editPost.id}` ? null : prev) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reseñas</h1>
        <button onClick={fetchPosts} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">
          <RefreshCw className="h-4 w-4" /> Recargar
        </button>
      </div>

      {error && <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      {/* Batch actions bar */}
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

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay reseñas.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 w-10">
                  <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-white transition-all">
                    {selected.size === posts.length ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Alias</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contenido</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Votos</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className={`border-b border-border last:border-0 hover:bg-muted/30 ${selected.has(p.id) ? "bg-emerald-500/5" : ""}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(p.id)} className="text-muted-foreground hover:text-white transition-all">
                      {selected.has(p.id) ? <CheckSquare className="h-4 w-4 text-emerald-400" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.alias}</td>
                  <td className="px-4 py-3 max-w-[250px]">
                    <p className="truncate">{p.title ?? "(sin título)"}</p>
                    <p className="truncate text-xs text-muted-foreground">{p.body.slice(0, 100)}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.vote_score}</td>
                  <td className="px-4 py-3">
                    {p.is_hidden ? (
                      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">Oculto</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">Visible</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString("es-DO")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditPost(p); setEditBody(p.body) }} className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-500/10 transition-all" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => toggleHide(p.id, p.is_hidden)} disabled={actionLoading === `hide-${p.id}`} className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-50" title={p.is_hidden ? "Mostrar" : "Ocultar"}>
                        {actionLoading === `hide-${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : p.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button onClick={() => deletePost(p.id)} disabled={actionLoading === `delete-${p.id}`} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50" title="Eliminar">
                        {actionLoading === `delete-${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
      {editPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditPost(null)}>
          <div ref={editRef} className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Editar reseña</h2>
            <p className="text-xs text-muted-foreground mb-4">Alias: {editPost.alias}</p>
            <form onSubmit={saveEdit} className="space-y-4">
              <textarea
                value={editBody}
                onChange={e => setEditBody(e.target.value)}
                rows={6}
                maxLength={3000}
                className="flex w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setEditPost(null)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">Cancelar</button>
                <button type="submit" disabled={actionLoading === `edit-${editPost.id}` || !editBody.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-all disabled:opacity-50">
                  {actionLoading === `edit-${editPost.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
