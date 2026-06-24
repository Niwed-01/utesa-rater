"use client"

import { useCallback, useEffect, useState } from "react"
import { Ban, Loader2, RefreshCw, Trash2, Shield, ShieldOff } from "lucide-react"

interface Profile {
  id: string
  email: string
  created_at: string
  is_banned: boolean
  is_admin: boolean
}

function maskEmail(email: string): string {
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

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) setUsers(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function toggleBan(id: string, current: boolean) {
    setActionLoading(`ban-${id}`)
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_banned: !current }),
      })
      await fetchUsers()
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleAdmin(id: string, current: boolean) {
    setActionLoading(`admin-${id}`)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: !current }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Error al cambiar rol")
      } else {
        await fetchUsers()
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function deleteUser(id: string) {
    if (!window.confirm("¿Estás seguro de eliminar este usuario? Se borrarán todas sus reseñas, comentarios y votos. Esta acción no se puede deshacer.")) return

    setActionLoading(`delete-${id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Error al eliminar")
      } else {
        await fetchUsers()
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
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button
          onClick={fetchUsers}
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
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString("es-DO")}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_banned ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                        <Ban className="h-3 w-3" />
                        Baneado
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleBan(u.id, u.is_banned)}
                        disabled={actionLoading === `ban-${u.id}`}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                          u.is_banned
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                        }`}
                      >
                        {actionLoading === `ban-${u.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : u.is_banned ? (
                          "Desbanear"
                        ) : (
                          "Banear"
                        )}
                      </button>

                      <button
                        onClick={() => toggleAdmin(u.id, u.is_admin)}
                        disabled={actionLoading === `admin-${u.id}`}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                          u.is_admin
                            ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            : "bg-neutral-500/10 text-neutral-400 hover:bg-neutral-500/20"
                        }`}
                        title={u.is_admin ? "Quitar admin" : "Hacer admin"}
                      >
                        {actionLoading === `admin-${u.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : u.is_admin ? (
                          <ShieldOff className="h-3.5 w-3.5" />
                        ) : (
                          <Shield className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {!u.is_admin && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          disabled={actionLoading === `delete-${u.id}`}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                          title="Eliminar usuario"
                        >
                          {actionLoading === `delete-${u.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
    </div>
  )
}
