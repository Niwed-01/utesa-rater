"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"

interface SearchInputProps {
  careers: { id: string; name: string }[]
}

export function SearchInput({ careers }: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSearch(form: FormData) {
    const q = form.get("q") as string
    const career = form.get("career") as string
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (career) params.set("career", career)
    router.push(`/profesores?${params.toString()}`)
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSearch(new FormData(e.currentTarget)) }} className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          name="q"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Buscar profesor, materia o carrera..."
          className="w-full h-10 rounded-xl border border-input bg-card pl-10 pr-4 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 placeholder:text-muted-foreground"
        />
      </div>
      <select
        name="career"
        defaultValue={searchParams.get("career") ?? ""}
        onChange={(e) => {
          const form = e.target.form
          if (form) {
            if (typeof form.requestSubmit === "function") form.requestSubmit()
            else form.submit()
          }
        }}
        className="h-10 rounded-xl border border-input bg-card px-4 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
      >
        <option value="">Todas las carreras</option>
        {careers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </form>
  )
}
