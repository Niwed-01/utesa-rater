"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, GraduationCap, RefreshCw } from "lucide-react"

interface CareerInfo {
  id: string
  name: string
}

export interface ProfessorResult {
  id: string
  full_name: string
  careers: CareerInfo[]
}

interface ProfesorSelectorProps {
  onSelect: (p: ProfessorResult) => void
  onError: (msg: string) => void
}

export function ProfesorSelector({ onSelect, onError }: ProfesorSelectorProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ProfessorResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [careers, setCareers] = useState<CareerInfo[]>([])
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      const res = await fetch(`/api/professors/search?q=${encodeURIComponent(query)}`)
      if (res.ok) { setResults(await res.json()); setShowResults(true) }
    }, 300)
    return () => clearTimeout(timeoutRef.current)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function selectProfessor(p: ProfessorResult) {
    setShowResults(false)
    setQuery("")
    onSelect(p)
  }

  function toggleCareer(id: string) {
    setSelectedCareerIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  return (
    <div ref={searchRef} className="relative mb-8">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar profesor por nombre..."
          value={query}
          onChange={(e) => { setQuery(e.target.value) }}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="h-14 rounded-2xl border-border bg-card pl-12 text-base shadow-sm"
          autoFocus
        />
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => selectProfessor(p)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-secondary"
            >
              <div>
                <span className="font-medium">{p.full_name}</span>
                {p.careers.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {p.careers.map((c) => c.name).join(", ")}
                  </span>
                )}
              </div>
              <Search className="h-4 w-4 text-muted-foreground/50" />
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">
            No encontramos &ldquo;{query}&rdquo;
          </p>
          <div className="mt-4 space-y-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre del profesor"
              className="h-11 rounded-xl text-center"
            />
            <div className="text-left">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Carreras que imparte:
              </p>
              <div
                className="max-h-48 overflow-y-auto rounded-xl border border-input bg-card p-2"
                onClick={() => {
                  if (careers.length === 0) {
                    fetch("/api/careers").then((r) => r.ok && r.json()).then(setCareers)
                  }
                }}
              >
                {careers.length === 0 ? (
                  <p className="p-2 text-xs text-muted-foreground text-center">
                    Cargando carreras...
                  </p>
                ) : (
                  careers.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCareerIds.includes(c.id)}
                        onChange={() => toggleCareer(c.id)}
                        className="h-4 w-4 rounded border-border accent-emerald-500"
                      />
                      {c.name}
                    </label>
                  ))
                )}
              </div>
            </div>
            <Button
              type="button"
              disabled={creating || !query.trim() || selectedCareerIds.length === 0}
              onClick={async () => {
                setCreating(true)
                try {
                  const res = await fetch("/api/professors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ full_name: query.trim(), career_ids: selectedCareerIds }),
                  })
                  if (!res.ok) {
                    const err = await res.json()
                    onError(err.error || "Error al crear profesor")
                    return
                  }
                  const prof = await res.json()
                  selectProfessor(prof)
                } catch {
                  onError("Error al crear profesor")
                } finally {
                  setCreating(false)
                }
              }}
              className="h-11 w-full rounded-xl text-sm font-semibold"
            >
              {creating ? "Creando..." : "Crear profesor y seleccionar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ProfesorConfirmadoProps {
  profesor: ProfessorResult
  onChange: () => void
  onUpdate?: (p: ProfessorResult) => void
}

export function ProfesorConfirmado({ profesor, onChange, onUpdate }: ProfesorConfirmadoProps) {
  const [editing, setEditing] = useState(false)
  const [careers, setCareers] = useState<CareerInfo[]>([])
  const [selectedCareerIds, setSelectedCareerIds] = useState<string[]>(
    () => profesor.careers.map((c) => c.id),
  )
  const [loadingCareers, setLoadingCareers] = useState(false)
  const [saving, setSaving] = useState(false)

  function startEditing() {
    setLoadingCareers(true)
    setSelectedCareerIds(profesor.careers.map((c) => c.id))
    fetch("/api/careers")
      .then((r) => r.ok && r.json())
      .then((data) => { setCareers(data); setEditing(true) })
      .finally(() => setLoadingCareers(false))
  }

  function toggleCareer(id: string) {
    setSelectedCareerIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  async function saveCareers() {
    if (selectedCareerIds.length === 0) return
    setSaving(true)
    try {
      const res = await fetch(`/api/professors/${profesor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ career_ids: selectedCareerIds }),
      })
      if (!res.ok) return
      const updated = await res.json()
      setEditing(false)
      onUpdate?.(updated)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold">{profesor.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {profesor.careers.length > 0
                ? profesor.careers.map((c) => c.name).join(", ")
                : "Sin carrera"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              disabled={loadingCareers}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
            >
              <GraduationCap className="h-3 w-3" />
              Editar carreras
            </button>
          )}
          <button
            type="button"
            onClick={onChange}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
          >
            <RefreshCw className="h-3 w-3" />
            Cambiar
          </button>
        </div>
      </div>
      {editing && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Carreras que imparte:
          </p>
          {loadingCareers ? (
            <p className="text-xs text-muted-foreground">Cargando carreras...</p>
          ) : (
            <>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-input bg-background p-2">
                {careers.map((c) => (
                  <label
                    key={c.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCareerIds.includes(c.id)}
                      onChange={() => toggleCareer(c.id)}
                      className="h-4 w-4 rounded border-border accent-emerald-500"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={saving || selectedCareerIds.length === 0}
                  onClick={saveCareers}
                  className="rounded-xl text-xs font-semibold"
                >
                  {saving ? "Guardando..." : "Guardar carreras"}
                </Button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
