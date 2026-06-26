"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Ban, Loader2, RefreshCw, Trash2, Shield, ShieldOff, History } from "lucide-react"

interface Profile {
  id: string
  email: string
  created_at: string
  is_banned: boolean
  is_admin: boolean
}

interface HistoryData {
  posts: Array<{ id: string; alias: string; title: string | null; body: string; is_hidden: boolean; vote_score: number; created_at: string }>
  comments: Array<{ id: string; alias: string; body: string; is_hidden: boolean; vote_score: number; created_at: string; post_id: string }>
  votes: Array<{ id: string; post_id: string | null; comment_id: string | null; value: number; created_at: string }>
}

function maskEmail(email: string | null): string {
  if (!email) return "---"
  const [local, domain] = email.split("@")
  if (!domain) return email
  const maskedLocal = local.length <= 2 ? local[0] + "*" : local[0] + "***" + local[local.length - 1]
  const [domainName, ...tld] = domain.split(".")
  const maskedDomain = domainName.length <= 2 ? domainName[0] + "*" : domainName[0] + "***"
  return `${maskedLocal}@${maskedDomain}.${tld.join(".")}`
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [historyUser, setHistoryUser] = useState<Profile | null>(null)
  const [historyData, setHistoryData] = useState<HistoryData | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const historyRef = useRef<HTMLDivElement>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) setUsers(await res.json())
      else setError("Error al cargar usuarios")
    } catch { setError("Error de conexión") } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) setHistoryUser(null)
    }
    if (historyUser) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [historyUser])

  async function openHistory(u: Profile) {
    setHistoryUser(u)
    setHistoryLoading(true)
    setHistoryData(null)
    try {
      const res = await fetch(`/api/admin/users/${u.id}/history`)
      if (res.ok) setHistoryData(await res.json())
      else setError("Error al cargar historial")
    } catch { setError("Error de conexión") } finally {
      setHistoryLoading(false)
    }
  }

  async function toggleBan(id: string, current: boolean) {
    setActionLoading(`ban-${id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_banned: !current }) })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else await fetchUsers()
    } finally { setActionLoading(prev => prev === `ban-${id}` ? null : prev) }
  }

  async function toggleAdmin(id: string, current: boolean) {
    setActionLoading(`admin-${id}`)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_admin: !current }) })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else await fetchUsers()
    } finally { setActionLoading(prev => prev === `admin-${id}` ? null : prev) }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("¿Eliminar este usuario? Se baneará y anonimizará su email. Su contenido se conservará.")) return
    setActionLoading(`delete-${id}`); setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else await fetchUsers()
    } finally { setActionLoading(prev => prev === `delete-${id}` ? null : prev) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button onClick={fetchUsers} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">
          <RefreshCw className="h-4 w-4" /> Recargar
        </button>
      </div>

      {error && <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay usuarios.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Registrado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Admin</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Baneado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">{maskEmail(u.email)}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(u.created_at).toLocaleDateString("es-DO")}</td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400"><Shield className="h-3 w-3" /> Admin</span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_banned ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400"><Ban className="h-3 w-3" /> Baneado</span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openHistory(u)} className="rounded-lg p-1.5 text-violet-400 hover:bg-violet-500/10 transition-all" title="Ver historial"><History className="h-4 w-4" /></button>
                      <button onClick={() => toggleBan(u.id, u.is_banned)} disabled={actionLoading === `ban-${u.id}`}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${u.is_banned ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-400 hover:bg-red-500/20"}`}>
                        {actionLoading === `ban-${u.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : u.is_banned ? "Desbanear" : "Banear"}
                      </button>
                      <button onClick={() => toggleAdmin(u.id, u.is_admin)} disabled={actionLoading === `admin-${u.id}`}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${u.is_admin ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20" : "bg-neutral-500/10 text-neutral-400 hover:bg-neutral-500/20"}`}
                        title={u.is_admin ? "Quitar admin" : "Hacer admin"}>
                        {actionLoading === `admin-${u.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : u.is_admin ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                      </button>
                      {!u.is_admin && (
                        <button onClick={() => deleteUser(u.id)} disabled={actionLoading === `delete-${u.id}`} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50" title="Eliminar">
                          {actionLoading === `delete-${u.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History modal */}
      {historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setHistoryUser(null)}>
          <div ref={historyRef} className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Historial de {maskEmail(historyUser.email)}</h2>
              <button onClick={() => setHistoryUser(null)} className="text-muted-foreground hover:text-white transition-all text-sm">Cerrar</button>
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : historyData ? (
              <div className="space-y-6">
                {/* Posts */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Reseñas ({historyData.posts.length})</h3>
                  {historyData.posts.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin reseñas.</p>
                  ) : (
                    <div className="space-y-2">
                      {historyData.posts.map(p => (
                        <div key={p.id} className="rounded-xl border border-border p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{p.alias}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {p.is_hidden && <span className="text-amber-400">Oculto</span>}
                              <span>👍 {p.vote_score}</span>
                              <span>{new Date(p.created_at).toLocaleDateString("es-DO")}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{p.body.slice(0, 150)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Comentarios ({historyData.comments.length})</h3>
                  {historyData.comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin comentarios.</p>
                  ) : (
                    <div className="space-y-2">
                      {historyData.comments.map(c => (
                        <div key={c.id} className="rounded-xl border border-border p-3 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{c.alias}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {c.is_hidden && <span className="text-amber-400">Oculto</span>}
                              <span>👍 {c.vote_score}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{c.body.slice(0, 150)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Votes */}
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Votos emitidos ({historyData.votes.length})</h3>
                  {historyData.votes.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin votos.</p>
                  ) : (
                    <div className="space-y-1">
                      {historyData.votes.map(v => (
                        <div key={v.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className={v.value === 1 ? "text-emerald-400" : "text-red-400"}>{v.value === 1 ? "▲ +1" : "▼ -1"}</span>
                          <span>{v.post_id ? "reseña" : "comentario"}</span>
                          <span>{new Date(v.created_at).toLocaleDateString("es-DO")}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Error al cargar historial.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
