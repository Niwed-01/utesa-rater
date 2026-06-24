"use client"

import { useCallback, useEffect, useState } from "react"
import { EyeOff, Eye, Loader2, RefreshCw, Trash2 } from "lucide-react"

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

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/posts")
      if (res.ok) setPosts(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  async function toggleHide(id: string, current: boolean) {
    setActionLoading(`hide-${id}`)
    try {
      await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_hidden: !current }),
      })
      await fetchPosts()
    } finally {
      setActionLoading(null)
    }
  }

  async function deletePost(id: string) {
    if (!window.confirm("¿Estás seguro de eliminar esta reseña? También se borrarán todos sus comentarios. Esta acción no se puede deshacer.")) return

    setActionLoading(`delete-${id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Error al eliminar")
      } else {
        await fetchPosts()
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
        <h1 className="text-2xl font-bold">Reseñas</h1>
        <button
          onClick={fetchPosts}
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

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay reseñas.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
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
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.alias}</td>
                  <td className="px-4 py-3 max-w-[250px]">
                    <p className="truncate">{p.title ?? "(sin título)"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.body.slice(0, 100)}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.vote_score}</td>
                  <td className="px-4 py-3">
                    {p.is_hidden ? (
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
                    {new Date(p.created_at).toLocaleDateString("es-DO")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleHide(p.id, p.is_hidden)}
                        disabled={actionLoading === `hide-${p.id}`}
                        className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/10 transition-all disabled:opacity-50"
                        title={p.is_hidden ? "Mostrar" : "Ocultar"}
                      >
                        {actionLoading === `hide-${p.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : p.is_hidden ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => deletePost(p.id)}
                        disabled={actionLoading === `delete-${p.id}`}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        title="Eliminar reseña"
                      >
                        {actionLoading === `delete-${p.id}` ? (
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
