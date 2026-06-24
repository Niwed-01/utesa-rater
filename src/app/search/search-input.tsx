"use client"

import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

interface SearchInputProps {
  initialQuery?: string
}

export function SearchInput({ initialQuery = "" }: SearchInputProps) {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const q = form.get("q")?.toString().trim()
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-lg items-center gap-2 rounded-2xl border border-neutral-800 bg-black/40 p-1.5 backdrop-blur-md focus-within:border-emerald-500/50 transition-all duration-300 shadow-xl"
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <Search className="h-5 w-5 text-neutral-500 shrink-0" />
        <input
          name="q"
          type="text"
          defaultValue={initialQuery}
          placeholder="Buscar profesor o materia..."
          className="w-full bg-transparent py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none"
          required
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-emerald-500 hover:shadow-emerald-500/20 active:scale-95 transition-all duration-200"
      >
        Buscar
      </button>
    </form>
  )
}
