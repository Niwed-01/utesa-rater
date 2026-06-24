import { createClient } from "@/lib/supabase/server"
import { ProfessorCard } from "@/components/professor-card"
import { GraduationCap } from "lucide-react"
import { SearchInput } from "./search-input"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: { q?: string; career?: string }
}

export default async function ProfesoresPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const { data: careers } = await supabase
    .from("careers")
    .select("id, name")
    .order("name")

  let query = supabase
    .from("professors")
    .select("id, full_name")

  if (searchParams.q) {
    const { data: nameMatches } = await supabase
      .from("professors").select("id").ilike("full_name", `%${searchParams.q}%`)

    const nameIds = nameMatches?.map((p) => p.id) ?? []
    query = query.in("id", nameIds.length > 0 ? nameIds : [""])
  }

  if (searchParams.career) {
    const { data: profIds } = await supabase
      .from("professor_careers")
      .select("professor_id")
      .eq("career_id", searchParams.career)

    const ids = profIds?.map((p) => p.professor_id) ?? []
    query = query.in("id", ids.length > 0 ? ids : [""])
  }

  const { data: professors } = await query.order("full_name").limit(100)

  // Attach careers to each professor
  const professorsWithCareers = professors
    ? await Promise.all(
        professors.map(async (prof) => {
          const { data: profCareers } = await supabase
            .from("professor_careers")
            .select("careers(name)")
            .eq("professor_id", prof.id)
          return {
            ...prof,
            careerNames: profCareers?.map((c) => c.careers?.name).filter(Boolean) as string[] ?? [],
          }
        })
      )
    : []

  // Stats
  const { count: totalProfesores } = await supabase
    .from("professors")
    .select("*", { count: "exact", head: true })

  const { count: totalResenas } = await supabase
    .from("posts_public")
    .select("*", { count: "exact", head: true })

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-neutral-900 to-neutral-950 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <GraduationCap className="h-3.5 w-3.5" /> Docentes UTESA
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-emerald-400 bg-clip-text text-transparent">
            Profesores
          </h1>
          <p className="text-neutral-400 text-sm max-w-xl">
            Explora, compara y elige a los mejores profesores basándote en las experiencias de otros estudiantes.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{totalProfesores ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Profesores</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{totalResenas ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Reseñas</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">{careers?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Carreras</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-500">
            {professors?.length ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Mostrados</p>
        </div>
      </div>

      {/* Search + Filter */}
      <SearchInput careers={careers ?? []} />

      {/* Results */}
      {professorsWithCareers.length > 0 ? (
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
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchParams.q
              ? `No se encontraron profesores para "${searchParams.q}"`
              : "Aún no hay profesores registrados"}
          </p>
          <a
            href="/publicar"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-all"
          >
            Agregar el primero
          </a>
        </div>
      )}
    </div>
  )
}
