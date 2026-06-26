"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface MateriaSelectorProps {
  onSelect: (clase: { id: string; name: string }) => void
}

export function MateriaSelector({ onSelect }: MateriaSelectorProps) {
  const [materiaInput, setMateriaInput] = useState("")
  const [selectedClase, setSelectedClase] = useState<{ id: string; name: string } | null>(null)
  const [classResults, setClassResults] = useState<{ id: string; name: string; code?: string | null }[]>([])
  const [creating, setCreating] = useState(false)
  const classTimeoutRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    if (materiaInput.length < 2 || selectedClase) { setClassResults([]); return }
    clearTimeout(classTimeoutRef.current)
    classTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/classes/search?q=${encodeURIComponent(materiaInput)}`)
        if (res.ok) setClassResults(await res.json())
      } catch { /* ignore network errors */ }
    }, 300)
    return () => clearTimeout(classTimeoutRef.current)
  }, [materiaInput, selectedClase])

  async function handleSelect(clase: { id: string; name: string; code?: string | null }) {
    setSelectedClase(clase)
    setClassResults([])
    onSelect(clase)
  }

  function handleChange() {
    setSelectedClase(null)
    setMateriaInput("")
  }

  if (selectedClase) {
    return (
      <div className="mt-2 flex items-center justify-between rounded-xl border border-border px-4 py-2.5">
        <span className="text-sm">{selectedClase.name}</span>
        <button
          type="button"
          onClick={handleChange}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="relative mt-2">
      <Input
        placeholder="Ej: Cálculo I, Programación..."
        value={materiaInput}
        onChange={(e) => setMateriaInput(e.target.value)}
        className="h-11 rounded-xl"
      />
      {classResults.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          {classResults.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-secondary transition-colors"
            >
              <span>{c.name}</span>
              {c.code && <span className="text-xs text-muted-foreground">{c.code}</span>}
            </button>
          ))}
        </div>
      )}
      {materiaInput.trim().length >= 2 && classResults.length === 0 && !creating && (
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              setCreating(true)
              try {
                const res = await fetch("/api/classes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name: materiaInput.trim() }),
                })
                if (res.ok) {
                  const cls = await res.json()
                  handleSelect(cls)
                }
              } finally {
                setCreating(false)
              }
            }}
            className="w-full rounded-xl text-xs"
          >
            Crear &ldquo;{materiaInput.trim()}&rdquo;
          </Button>
        </div>
      )}
      {creating && (
        <p className="mt-2 text-xs text-muted-foreground">Creando materia...</p>
      )}
    </div>
  )
}
