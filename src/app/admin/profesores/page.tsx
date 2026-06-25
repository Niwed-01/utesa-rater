"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw, Plus, Pencil, Trash2, Merge } from "lucide-react"

interface Professor {
  id: string
  full_name: string
  photo_url: string | null
  created_at: string
}

export default function AdminProfesoresPage() {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Professor | null>(null)
  const [formName, setFormName] = useState("")
  const [showMerge, setShowMerge] = useState(false)
  const [mergeSource, setMergeSource] = useState("")
  const [mergeTarget, setMergeTarget] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)

  const fetchProfessors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/professors")
      if (res.ok) setProfessors(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfessors()
  }, [fetchProfessors])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowForm(false); setEditing(null); setShowMerge(false)
      }
    }
    if (showForm || showMerge) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showForm, showMerge])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    setActionLoading("save")
    setError(null)

    try {
      const res = await fetch(editing ? `/api/admin/professors/${editing.id}` : "/api/admin/professors", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: formName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Error al guardar")
      } else {
        setShowForm(false); setEditing(null); setFormName("")
        await fetchProfessors()
      }
    } finally {
      setActionLoading(null)
    }
  }

  function startEdit(p: Professor) {
    setEditing(p); setFormName(p.full_name); setShowForm(true); setShowMerge(false)
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Estás seguro de eliminar este profesor? Se borrarán todas sus reseñas. Esta acción no se puede deshacer.")) return
    setActionLoading(`del-${id}`)
    setError(null)
    try {
      const res = await fetch(`/api/admin/professors/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Error al eliminar")
      } else {
        await fetchProfessors()
      }
    } finally {
      setActionLoading(null)
    }
  }

  async function handleMerge() {
    if (!mergeSource || !mergeTarget || mergeSource === mergeTarget) return
    if (!window.confirm(`¿Fusionar? Todas las reseñas de "${professors.find(p => p.id === mergeSource)?.full_name}" se moverán a "${professors.find(p => p.id === mergeTarget)?.full_name}". El primero se eliminará.`)) return

    setActionLoading("merge")
    setError(null)
    try {
      const res = await fetch("/api/admin/professors/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_id: mergeSource, target_id: mergeTarget }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Error al fusionar")
      } else {
        setShowMerge(false); setMergeSource(""); setMergeTarget("")
        await fetchProfessors()
      }
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profesores</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowMerge(true); setShowForm(false) }} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">
            <Merge className="h-4 w-4" /> Fusionar
          </button>
          <button onClick={fetchProfessors} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">
            <RefreshCw className="h-4 w-4" /> Recargar
          </button>
          <button onClick={() => { setShowForm(true); setEditing(null); setFormName(""); setShowMerge(false) }} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-all">
            <Plus className="h-4 w-4" /> Añadir
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      {/* Modal: Crear/Editar */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div ref={modalRef} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editing ? "Editar profesor" : "Añadir profesor"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                value={formName} onChange={e => setFormName(e.target.value)}
                placeholder="Nombre completo del profesor"
                className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">Cancelar</button>
                <button type="submit" disabled={actionLoading === "save" || !formName.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-all disabled:opacity-50">
                  {actionLoading === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Fusionar */}
      {showMerge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowMerge(false)}>
          <div ref={modalRef} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-1">Fusionar profesores</h2>
            <p className="text-sm text-muted-foreground mb-4">Las reseñas del profesor origen pasarán al destino. El origen se eliminará.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Origen (se eliminará)</label>
                <select value={mergeSource} onChange={e => setMergeSource(e.target.value)} className="mt-1 flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm">
                  <option value="">Seleccionar...</option>
                  {professors.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Destino (conservará reseñas)</label>
                <select value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} className="mt-1 flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm">
                  <option value="">Seleccionar...</option>
                  {professors.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => setShowMerge(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">Cancelar</button>
                <button onClick={handleMerge} disabled={actionLoading === "merge" || !mergeSource || !mergeTarget || mergeSource === mergeTarget} className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-all disabled:opacity-50">
                  {actionLoading === "merge" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fusionar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      {professors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay profesores.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Creado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {professors.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString("es-DO")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(p)} className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-500/10 transition-all" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={actionLoading === `del-${p.id}`} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50" title="Eliminar">
                        {actionLoading === `del-${p.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
