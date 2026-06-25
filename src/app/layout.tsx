import type { Metadata } from "next"
import { Providers } from "@/components/providers"
import { Navbar } from "@/components/navbar"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Heart } from "lucide-react"
import "./globals.css"

export const metadata: Metadata = {
  title: "UTESA Rater — Reseñas de profesores y materias de UTESA",
  description:
    "Opiniones y calificaciones de profesores de la Universidad Tecnológica de Santiago (UTESA). Calificaciones anónimas creadas por y para estudiantes.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
}

export const dynamic = "force-dynamic"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()
    isAdmin = profile?.is_admin ?? false
  }

  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Providers>
          <Navbar user={user} isAdmin={isAdmin} />
          {/* Main content wrapper */}
          <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

function getRelativeTimeString(date: Date | string): string {
  const time = new Date(date).getTime()
  const now = new Date().getTime()
  const diff = now - time

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `hace ${days} ${days === 1 ? "día" : "días"}`
  if (hours > 0) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`
  if (minutes > 0) return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`
  return "hace unos segundos"
}

const AVATAR_COLORS = [
  "bg-sky-600",
  "bg-violet-600",
  "bg-red-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-pink-600",
  "bg-teal-600",
]

function getAvatarBg(name: string): string {
  if (!name) return "bg-gray-600"
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

async function Footer() {
  const supabase = await createClient()
  const { data: recentReviews } = await supabase
    .from("posts_public")
    .select("id, professor_id, alias, created_at, professors(full_name)")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur-md pt-12 pb-8">
      <div className="mx-auto max-w-5xl px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Opiniones Recientes */}
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground mb-4">
            Opiniones recientes
          </h3>
          <div className="flex flex-col gap-3">
            {recentReviews && recentReviews.length > 0 ? (
              recentReviews.map((review: { id: string; professor_id: string; alias: string; created_at: string; professors: { full_name: string } | null }) => {
                const profName = review.professors?.full_name || "Profesor"
                const avatarBg = getAvatarBg(profName)
                return (
                  <Link
                    key={review.id}
                    href={`/profesores/${review.professor_id}`}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-800/40 transition-colors duration-200 group"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-bold text-sm shadow-md ${avatarBg}`}>
                      {profName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold group-hover:text-primary transition-colors text-neutral-200">
                        {profName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {getRelativeTimeString(review.created_at)}
                      </p>
                    </div>
                  </Link>
                )
              })
            ) : (
              <p className="text-xs text-muted-foreground">No hay opiniones recientes.</p>
            )}
          </div>
        </div>

        {/* Column 2: Enlaces Internos */}
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground mb-4">
            Enlaces Internos
          </h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <Link href="/" className="p-2 rounded-xl hover:bg-neutral-800/40 hover:text-white transition-all">
              Inicio
            </Link>
            <Link href="/publicar" className="p-2 rounded-xl hover:bg-neutral-800/40 hover:text-white transition-all">
              Calificar algún Profesor
            </Link>
            <Link href="/estudiantes" className="p-2 rounded-xl hover:bg-neutral-800/40 hover:text-white transition-all">
              Recursos de Estudiantes
            </Link>
            <Link href="/login" className="p-2 rounded-xl hover:bg-neutral-800/40 hover:text-white transition-all">
              Iniciar Sesión
            </Link>
            <Link href="/registro" className="p-2 rounded-xl hover:bg-neutral-800/40 hover:text-white transition-all">
              Regístrate
            </Link>
          </div>
        </div>

        {/* Column 3: Enlaces Académicos */}
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground mb-4">
            Enlaces Académicos
          </h3>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <a
              href="https://nube.utesa.edu"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl hover:bg-neutral-800/40 hover:text-white transition-all"
            >
              UTESA Virtual (Nube)
            </a>
            <a
              href="https://utesaplus.utesa.edu"
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl hover:bg-neutral-800/40 hover:text-white transition-all"
            >
              UTESA Plus
            </a>
            <Link href="/estudiantes#calendario" className="p-2 rounded-xl hover:bg-neutral-800/40 hover:text-white transition-all">
              Calendario Académico
            </Link>
            <Link href="/estudiantes#aulas" className="p-2 rounded-xl hover:bg-neutral-800/40 hover:text-white transition-all">
              Buscar Aulas y Edificios
            </Link>
          </div>
        </div>
      </div>

      {/* Under footer */}
      <div className="mx-auto max-w-5xl px-4 mt-8 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>
          <p>© UTESA Rater {new Date().getFullYear()}</p>
          <p className="mt-1">
            Plataforma creada de forma independiente por y para la comunidad estudiantil de UTESA. No oficial.
          </p>
        </div>
        <div className="flex items-center gap-1">
          Hecho con <Heart className="h-3 w-3 text-red-500 fill-red-500 animate-pulse" /> por estudiantes de UTESA
        </div>
      </div>
    </footer>
  )
}
