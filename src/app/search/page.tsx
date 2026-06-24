import { createClient } from "@/lib/supabase/server"
import { ProfessorCard } from "@/components/professor-card"
import Link from "next/link"
import { Search, BookOpen, Users } from "lucide-react"
import { SearchInput } from "./search-input"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: { q?: string }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const q = searchParams.q?.trim()

  let professors: { id: string; full_name: string }[] = []
  let classes: { id: string; name: string; code: string | null }[] = []

  if (q) {
    // Search professors by name
    const { data: profs } = await supabase
      .from("professors")
      .select("id, full_name")
      .ilike("full_name", `%${q}%`)
      .order("full_name")
      .limit(50)

    // Search classes by name
    const { data: classResults } = await supabase
      .from("classes")
      .select("id, name, code")
      .ilike("name", `%${q}%`)
      .order("name")
      .limit(20)

    classes = classResults ?? []

    // Find professors who teach matching classes
    let classProfIds: string[] = []
    if (classResults && classResults.length > 0) {
      const { data: profClasses } = await supabase
        .from("professor_classes")
        .select("professor_id")
        .in("class_id", classResults.map((c) => c.id))
      classProfIds = profClasses?.map((p) => p.professor_id) ?? []
    }

    // Merge and deduplicate professor results
    const nameIds = profs?.map((p) => p.id) ?? []
    const mergedIds = Array.from(new Set([...nameIds, ...classProfIds]))

    if (mergedIds.length > 0) {
      const { data: mergedProfs } = await supabase
        .from("professors")
        .select("id, full_name")
        .in("id", mergedIds)
        .order("full_name")
        .limit(50)
      professors = mergedProfs ?? []
    }
  }

  // Attach careers for professor cards
  const professorsWithCareers = await Promise.all(
    professors.map(async (prof) => {
      const { data: careers } = await supabase
        .from("professor_careers")
        .select("careers(name)")
        .eq("professor_id", prof.id)
      return {
        ...prof,
        careerNames: careers?.map((c) => c.careers?.name).filter(Boolean) as string[] ?? [],
      }
    })
  )

  const hasResults = professors.length > 0 || classes.length > 0

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-neutral-900 to-neutral-950 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <Search className="h-3.5 w-3.5" /> Resultados de búsqueda
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-emerald-400 bg-clip-text text-transparent">
            {q ? `"${q}"` : "Buscar"}
          </h1>
          <p className="text-neutral-400 text-sm max-w-xl">
            {hasResults
              ? `Se encontraron ${professors.length} profesor${professors.length !== 1 ? "es" : ""} y ${classes.length} materia${classes.length !== 1 ? "s" : ""}`
              : q
                ? "No se encontraron resultados. Intenta con otro término."
                : "Escribe algo para buscar profesores o materias."}
          </p>
        </div>
      </section>

      {/* Search input */}
      <SearchInput initialQuery={q} />

      {/* Stats */}
      {hasResults && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <Users className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-500">{professors.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Profesores</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 text-center">
            <BookOpen className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-emerald-500">{classes.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Materias</p>
          </div>
        </div>
      )}

      {/* Professors section */}
      {professors.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" /> Profesores
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {professorsWithCareers.map((p) => (
              <ProfessorCard
                key={p.id}
                id={p.id}
                fullName={p.full_name}
                careerNames={p.careerNames}
              />
            ))}
          </div>
        </section>
      )}

      {/* Materias section */}
      {classes.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" /> Materias
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {classes.map((cls) => (
              <Link
                key={cls.id}
                href={`/materias/${cls.id}`}
                className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/5"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-lg font-bold text-emerald-500">
                    {cls.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold group-hover:text-emerald-500 transition-colors">
                      {cls.name}
                    </h3>
                    {cls.code && (
                      <p className="truncate text-xs text-muted-foreground">{cls.code}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground group-hover:text-emerald-500 transition-colors">
                    Ver →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasResults && q && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No encontramos profesores ni materias para &ldquo;{q}&rdquo;.
          </p>
          <Link
            href="/profesores"
            className="inline-block rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-all"
          >
            Ver todos los profesores
          </Link>
        </div>
      )}

      {/* Initial state (no q) */}
      {!q && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Escribe el nombre de un profesor o materia para empezar a buscar.
          </p>
        </div>
      )}
    </div>
  )
}
