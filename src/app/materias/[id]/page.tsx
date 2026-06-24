import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/post-card"
import { ProfessorCard } from "@/components/professor-card"
import { PaginationControls } from "@/app/profesores/[id]/pagination-controls"
import { notFound } from "next/navigation"
import { BookOpen, GraduationCap, MessageSquare, Users } from "lucide-react"

export const dynamic = "force-dynamic"

const POSTS_PER_PAGE = 10

interface PageProps {
  params: { id: string }
  searchParams: { page?: string }
}

export default async function MateriaPage({ params, searchParams }: PageProps) {
  const supabase = await createClient()
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1)
  const offset = (currentPage - 1) * POSTS_PER_PAGE

  const { data: classData } = await supabase
    .from("classes")
    .select("id, name, code")
    .eq("id", params.id)
    .single()

  if (!classData) notFound()

  // Professors who teach this class
  const { data: profClasses } = await supabase
    .from("professor_classes")
    .select("professor_id, professors(id, full_name)")
    .eq("class_id", params.id)

  const professors = profClasses
    ?.map((pc) => pc.professors)
    .filter((p): p is { id: string; full_name: string } => p !== null) ?? []

  // Posts (reviews) filtered by class
  const { data: posts, count: totalPosts } = await supabase
    .from("posts_public")
    .select("*", { count: "exact" })
    .eq("class_id", params.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + POSTS_PER_PAGE - 1)

  const allPosts = posts ?? []
  const totalPages = totalPosts ? Math.ceil(totalPosts / POSTS_PER_PAGE) : 1

  // Build professor name map
  const profIds = Array.from(new Set(allPosts.map((p) => p.professor_id)))
  const profNameMap: Record<string, string> = {}
  if (profIds.length > 0) {
    const { data: profs } = await supabase
      .from("professors")
      .select("id, full_name")
      .in("id", profIds)
    profs?.forEach((p) => { profNameMap[p.id] = p.full_name })
  }

  // Stats
  const { count: totalProfessors } = await supabase
    .from("professor_classes")
    .select("*", { count: "exact", head: true })
    .eq("class_id", params.id)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-neutral-900 to-neutral-950 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-3xl font-bold text-emerald-400 shadow-lg">
            {classData.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <BookOpen className="h-3.5 w-3.5" />
              {classData.code ?? "Materia"}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-emerald-400 bg-clip-text text-transparent">
              {classData.name}
            </h1>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <Users className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-500">{totalProfessors ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Profesores</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <MessageSquare className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-500">{totalPosts ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">Reseñas</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <GraduationCap className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-500">{professors.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Imparten</p>
        </div>
      </div>

      {/* Professors section */}
      {professors.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" /> Profesores que imparten {classData.name}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {professors.map((prof) => (
              <ProfessorCard
                key={prof.id}
                id={prof.id}
                fullName={prof.full_name}
              />
            ))}
          </div>
        </section>
      )}

      {/* Reviews section */}
      <section>
        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-500" />
          Reseñas de {classData.name}
        </h2>
        {allPosts.length > 0 ? (
          <div className="space-y-4">
            {allPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                className={classData.name}
                showProfessor
                professorName={profNameMap[post.professor_id] ?? undefined}
              />
            ))}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/materias/${params.id}`}
              />
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aún no hay reseñas para {classData.name}.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
