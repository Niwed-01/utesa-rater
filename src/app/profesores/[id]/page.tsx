import { createClient } from "@/lib/supabase/server"
import { ProfessorRatingSummary } from "@/components/professor-rating-summary"
import { PostCard } from "@/components/post-card"
import { PaginationControls } from "./pagination-controls"
import { notFound } from "next/navigation"
import { GraduationCap, BookOpen, Star, MessageSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const POSTS_PER_PAGE = 10

interface PageProps {
  params: { id: string }
  searchParams: { page?: string }
}

export default async function ProfessorPage({ params, searchParams }: PageProps) {
  const supabase = await createClient()
  const currentPage = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1)
  const offset = (currentPage - 1) * POSTS_PER_PAGE

  const [professorResult, classesResult, careersResult] = await Promise.all([
    supabase
      .from("professors")
      .select("id, full_name, photo_url")
      .eq("id", params.id)
      .single(),
    supabase
      .from("professor_classes")
      .select("classes(id, name, code)")
      .eq("professor_id", params.id),
    supabase
      .from("professor_careers")
      .select("careers(name)")
      .eq("professor_id", params.id),
  ])

  const professor = professorResult.data
  if (!professor) notFound()

  const careerNames = careersResult.data?.map((c) => c.careers?.name).filter((n): n is string => n != null) ?? []

  const [{ data: posts }, { count: totalPosts }] = await Promise.all([
    supabase
      .from("posts_public")
      .select("*")
      .eq("professor_id", params.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + POSTS_PER_PAGE - 1),
    supabase
      .from("posts_public")
      .select("*", { count: "exact", head: true })
      .eq("professor_id", params.id),
  ])

  const classes = classesResult.data
  const totalPages = totalPosts ? Math.ceil(totalPosts / POSTS_PER_PAGE) : 1

  const allPosts = posts ?? []

  // Build class_id → name map for displaying subject tags
  const classIds = Array.from(new Set(allPosts.map((p) => p.class_id).filter(Boolean)))
  const classMap: Record<string, string> = {}
  if (classIds.length > 0) {
    const { data: classesData } = await supabase
      .from("classes")
      .select("id, name")
      .in("id", classIds)
    classesData?.forEach((c) => { classMap[c.id] = c.name })
  }

  const avgRatings = allPosts.length > 0
    ? {
        avg_claridad: allPosts.reduce((s, p) => s + p.rating_claridad, 0) / allPosts.length,
        avg_puntualidad: allPosts.reduce((s, p) => s + p.rating_puntualidad, 0) / allPosts.length,
        avg_exigencia: allPosts.reduce((s, p) => s + p.rating_exigencia, 0) / allPosts.length,
        avg_disponibilidad: allPosts.reduce((s, p) => s + p.rating_disponibilidad, 0) / allPosts.length,
        avg_justicia: allPosts.reduce((s, p) => s + p.rating_justicia, 0) / allPosts.length,
        avg_general: allPosts.reduce((s, p) => s + p.rating_general, 0) / allPosts.length,
        count: totalPosts ?? 0,
      }
    : null

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-neutral-900 to-neutral-950 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -z-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-3xl font-bold text-emerald-400 shadow-lg">
            {professor.full_name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <GraduationCap className="h-3.5 w-3.5" />
              {careerNames.length > 0 ? careerNames.join(", ") : "Sin carrera"}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-emerald-400 bg-clip-text text-transparent">
              {professor.full_name}
            </h1>
            {avgRatings ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-emerald-500 text-emerald-500" />
                  <span className="text-3xl font-bold text-emerald-400">{avgRatings.avg_general.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{avgRatings.count} {avgRatings.count === 1 ? "reseña" : "reseñas"}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Aún sin reseñas — sé el primero en opinar</p>
            )}
          </div>
          <Link
            href={`/publicar?professor=${params.id}`}
            className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
          >
            Dejar reseña
          </Link>
        </div>
      </section>

      {/* Rating Categories */}
      {avgRatings && (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <ProfessorRatingSummary
            general={avgRatings.avg_general}
            categories={[
              { label: "Claridad", value: avgRatings.avg_claridad },
              { label: "Puntualidad", value: avgRatings.avg_puntualidad },
              { label: "Exigencia", value: avgRatings.avg_exigencia },
              { label: "Disponibilidad", value: avgRatings.avg_disponibilidad },
              { label: "Justicia", value: avgRatings.avg_justicia },
            ]}
          />
        </section>
      )}

      {/* Classes */}
      {classes && classes.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-500" /> Clases que imparte
          </h2>
          <div className="flex flex-wrap gap-2">
            {classes.map((pc) => (
              <span
                key={pc.classes?.id}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground shadow-sm"
              >
                {pc.classes?.name}
                {pc.classes?.code && (
                  <span className="text-muted-foreground">({pc.classes.code})</span>
                )}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section>
        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-500" />
          Reseñas {avgRatings && `(${avgRatings.count})`}
        </h2>
        {allPosts.length > 0 ? (
          <div className="space-y-4">
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} className={classMap[post.class_id] ?? undefined} showProfessor professorName={professor.full_name} />
            ))}
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                basePath={`/profesores/${params.id}`}
              />
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Este profesor aún no tiene reseñas. ¡Sé el primero en compartir tu experiencia!
            </p>
            <Link
              href={`/publicar?professor=${params.id}`}
              className="inline-block rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-all"
            >
              Escribir reseña
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
