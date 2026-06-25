"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react"

interface Class {
  id: string
  name: string
  code: string | null
}

export default function AdminMateriasPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Class | null>(null)
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)

  const fetchClasses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/classes")
      if (res.ok) setClasses(await res.json())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClasses() }, [fetchClasses])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowForm(false); setEditing(null)
      }
    }
    if (showForm) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showForm])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim()) return
    setActionLoading("save"); setError(null)
    try {
      const payload: Record<string, string | null> = { name: formName.trim() }
      if (formCode.trim()) payload.code = formCode.trim()
      const res = await fetch(editing ? `/api/admin/classes/${editing.id}` : "/api/admin/classes", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || "Error al guardar")
      } else {
        setShowForm(false); setEditing(null); setFormName(""); setFormCode("")
        await fetchClasses()
      }
    } finally { setActionLoading(null) }
  }

  function startEdit(c: Class) {
    setEditing(c); setFormName(c.name); setFormCode(c.code ?? ""); setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!window.confirm("¿Eliminar esta materia? Esta acción no se puede deshacer.")) return
    setActionLoading(`del-${id}`); setError(null)
    try {
      const res = await fetch(`/api/admin/classes/${id}`, { method: "DELETE" })
      if (!res.ok) { const err = await res.json(); setError(err.error || "Error") }
      else { await fetchClasses() }
    } finally { setActionLoading(null) }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Materias</h1>
        <div className="flex gap-2">
          <button onClick={fetchClasses} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all">
            <RefreshCw className="h-4 w-4" /> Recargar
          </button>
          <button onClick={() => { setShowForm(true); setEditing(null); setFormName(""); setFormCode("") }} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-all">
            <Plus className="h-4 w-4" /> Añadir
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowForm(false); setEditing(null) }}>
          <div ref={modalRef} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editing ? "Editar materia" : "Añadir materia"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nombre de la materia" className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" autoFocus />
              <input value={formCode} onChange={e => setFormCode(e.target.value)} placeholder="Código (opcional)" className="flex h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
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

      {classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay materias.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Código</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.code ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(c)} className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-500/10 transition-all" title="Editar"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} disabled={actionLoading === `del-${c.id}`} className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50" title="Eliminar">
                        {actionLoading === `del-${c.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
