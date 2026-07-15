import { createClient } from "@/lib/supabase/server"
import { ProfessorCard } from "@/components/professor-card"
import Link from "next/link"
import { Search, GraduationCap, Star, BookOpen, PenTool, CheckCircle, ExternalLink, MessageCircle, HelpCircle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch latest 6 professors with careers
  const { data: professors } = await supabase
    .from("professors")
    .select("id, full_name")
    .order("created_at", { ascending: false })
    .limit(6)

  const professorsWithCareers = professors
    ? await Promise.all(
        professors.map(async (prof) => {
          const { data: careers } = await supabase
            .from("professor_careers")
            .select("careers(name)")
            .eq("professor_id", prof.id)
          return {
            ...prof,
            careerNames: careers?.map((c) => c.careers?.name).filter((n): n is string => n != null) ?? [],
          }
        })
      )
    : []

  // Fetch recent posts
  const { data: recentPosts } = await supabase
    .from("posts_public")
    .select("id, professor_id, alias, body, rating_general, created_at, professors(full_name)")
    .order("created_at", { ascending: false })
    .limit(5)

  // Platform stats
  const { count: totalProfesores } = await supabase
    .from("professors")
    .select("*", { count: "exact", head: true })

  const { count: totalResenas } = await supabase
    .from("posts_public")
    .select("*", { count: "exact", head: true })

  const { count: totalComentarios } = await supabase
    .from("comments_public")
    .select("*", { count: "exact", head: true })

  return (
    <div className="space-y-12">
      {/* 400px Header Banner with custom HSL gradient & search */}
      <header className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-neutral-950 via-emerald-950/20 to-neutral-950 py-16 px-6 text-center shadow-2xl flex flex-col items-center justify-center min-h-[300px] md:min-h-[380px]">
        {/* Decorative background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-72 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative max-w-2xl space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-emerald-400 bg-clip-text text-transparent">
            UTESA Rater
          </h1>
          <p className="text-base md:text-lg text-emerald-400 font-semibold tracking-wide">
            Con la programación docente de la Universidad Tecnológica de Santiago ✨
          </p>
          <p className="text-xs md:text-sm text-neutral-400 max-w-lg mx-auto">
            Busca opiniones de profesores y asignaturas para armar tu selección de forma inteligente y 100% anónima.
          </p>

          {/* Search Form */}
          <form
            method="get"
            action="/search"
            className="mx-auto mt-6 flex w-full max-w-lg items-center gap-2 rounded-2xl border border-neutral-800 bg-black/40 p-1.5 backdrop-blur-md focus-within:border-emerald-500/50 transition-all duration-300 shadow-xl"
          >
            <div className="flex flex-1 items-center gap-2 px-3">
              <Search className="h-5 w-5 text-neutral-500 shrink-0" />
              <input
                name="q"
                type="text"
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
        </div>
      </header>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Profesores", value: totalProfesores ?? 0, icon: GraduationCap },
          { label: "Reseñas", value: totalResenas ?? 0, icon: Star },
          { label: "Comentarios", value: totalComentarios ?? 0, icon: MessageCircle },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-950/10 to-card p-5 text-center shadow-sm hover:border-emerald-500/30 transition-all"
          >
            <stat.icon className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-extrabold text-emerald-400">{stat.value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Main Info Columns */}
      <div className="grid gap-8 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-500" />
            Profesores, opiniones y asignaturas de UTESA
          </h2>
          <p className="text-xs font-semibold text-neutral-400 tracking-wider uppercase">
            Todo en un mismo lugar
          </p>
          <div className="text-neutral-400 text-sm space-y-3 leading-relaxed">
            <p>
              UTESA Rater es una plataforma independiente creada por estudiantes para estudiantes, con la visión de simplificar la búsqueda de docentes y materias para tu reinscripción.
            </p>
            <p>
              Te motivamos a calificar y opinar de forma totalmente anónima acerca de los profesores con quienes hayas tomado clases. Evalúa su claridad didáctica, su puntualidad y la justicia de sus calificaciones.
            </p>
            <p>
              Mostramos opiniones de todos los recintos de UTESA (Santiago Sede, Santo Domingo de Guzmán, Santo Domingo Oriental, Moca, Mao, Puerto Plata, Gaspar Hernández, Dajabón, etc.). ¡Encuentra a tus maestros ideales en un clic!
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
            Orgullosamente Utesianos
          </h2>
          <p className="text-xs font-semibold text-neutral-400 tracking-wider uppercase">
            ¡Todos para uno, y uno para todos!
          </p>
          <div className="text-neutral-400 text-sm space-y-3 leading-relaxed">
            <p>
              Esta herramienta está diseñada para que nos apoyemos mutuamente en nuestra trayectoria académica. Cuantas más opiniones justas compartas, más fácil será para los demás tomar decisiones convenientes.
            </p>
            <p>
              Recuerda siempre la importancia de ser objetivo. Evita insultar o difamar a los docentes; el fin de la plataforma es constructivo y evaluativo. Las opiniones no respetuosas serán moderadas por la comunidad.
            </p>
            <p>
              Además de las reseñas de profesores, en nuestra sección de Estudiantes te ayudamos con guías y FAQs sobre el campus virtual, ubicación de aulas, edificios y el calendario de reinscripción.
            </p>
          </div>
        </section>
      </div>

      {/* Evaluando a un docente Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Evaluando a un Docente</h2>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto">
            Los aspectos fundamentales de la opinión de nuestros usuarios hacia sus maestros
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-neutral-200">¿Sabe explicarse con claridad?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Es crucial que el docente transmita los conceptos de forma estructurada e incentive el entendimiento de la asignatura.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Star className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-neutral-200">¿Evalúa justamente?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Calificamos si los exámenes y trabajos corresponden a lo explicado en el aula, valorando tu esfuerzo real de estudio.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-neutral-200">¿Volverías a cursar con él/ella?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Tu grado general de satisfacción: indica si recomendarías cursar asignaturas con este docente a otros estudiantes.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3 hover:border-emerald-500/20 transition-all duration-300">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-neutral-200">¿Qué opinas del maestro?</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Deja un comentario contando tu experiencia de aprendizaje. Cuéntanos cómo es tomar una clase real en su sección.
            </p>
          </div>
        </div>
      </section>

      {/* UTESA Virtual Promotion Banner */}
      <section className="rounded-3xl border border-emerald-500/10 bg-gradient-to-br from-emerald-950/20 to-neutral-950 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">
            Acceso Rápido
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-100">Aula Virtual de UTESA (Nube)</h2>
          <p className="text-neutral-400 text-xs md:text-sm leading-relaxed">
            ¿Listo para ingresar al campus virtual? Moodle centralizado para todas las asignaturas presenciales, híbridas y virtuales de UTESA. Inicia sesión con tu matrícula y NIP/clave del recinto correspondiente.
          </p>
        </div>
        <a
          href="https://nube.utesa.edu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-500 hover:shadow-emerald-500/20 active:scale-95 transition-all duration-200 w-full md:w-auto justify-center"
        >
          Entrar a UTESA Virtual
          <ExternalLink className="h-4 w-4" />
        </a>
      </section>

      {/* Dynamic columns: Recent reviews & Newly added professors */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Latest Professors */}
        {professors && professors.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                <PenTool className="h-5 w-5 text-emerald-500" />
                Últimos profesores agregados
              </h2>
              <Link
                href="/profesores"
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid gap-3">
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

        {/* Recent Reviews list */}
        {recentPosts && recentPosts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-emerald-500" />
              Reseñas recientes
            </h2>
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/profesores/${post.professor_id}`}
                  className="block rounded-2xl border border-border p-4 transition-all duration-200 hover:border-emerald-500/40 bg-neutral-900/20 hover:bg-neutral-900/40"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      {post.alias}
                    </span>
                    <span className="text-xs font-medium text-neutral-300 truncate">
                      {post.professors?.full_name}
                    </span>
                    <span className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-400">
                      <Star className="h-3 w-3 fill-emerald-400" />
                      {post.rating_general.toFixed(1)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-neutral-400 leading-relaxed">
                    {post.body}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Fallback container if empty */}
      {(!professors || professors.length === 0) && (!recentPosts || recentPosts.length === 0) && (
        <section className="rounded-3xl border border-border p-12 text-center bg-card">
          <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold">¡Sé el primero!</h2>
          <p className="mt-2 text-sm text-neutral-400 max-w-sm mx-auto">
            Aún no hay profesores registrados ni valoraciones. Ayuda a tu comunidad publicando la primera calificación.
          </p>
          <Link
            href="/publicar"
            className="mt-5 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 shadow-md transition-all active:scale-95"
          >
            Agregar Profesor y Reseñar
          </Link>
        </section>
      )}
    </div>
  )
}
