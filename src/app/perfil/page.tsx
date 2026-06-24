import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Calendar, Mail, Shield, MessageSquare, ThumbsUp, FileText, LogOut, Bookmark, User } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChangePasswordForm } from "./change-password-form"

export const dynamic = "force-dynamic"

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.is_banned) redirect("/login?banned=true")

  const { count: postCount } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", user.id)

  const { count: commentCount } = await supabase
    .from("comments")
    .select("*", { count: "exact", head: true })
    .eq("author_id", user.id)

  const { data: voteData } = await supabase
    .from("posts")
    .select("vote_score")
    .eq("author_id", user.id)

  const totalVotesReceived = voteData?.reduce((sum, p) => sum + (p.vote_score || 0), 0) ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tu información y estadísticas en UTESA Rater
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-500" />
              Información de la cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-border/40">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{profile?.email ?? user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-border/40">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Miembro desde</p>
                <p className="text-sm font-medium">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-border/40">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="text-sm font-medium text-emerald-500 flex items-center gap-2">
                  Activo
                  {profile?.is_admin && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
                      Admin
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Estadísticas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-border/40">
              <MessageSquare className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Reseñas publicadas</p>
                <p className="text-2xl font-bold">{postCount ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-border/40">
              <MessageSquare className="h-4 w-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Comentarios</p>
                <p className="text-2xl font-bold">{commentCount ?? 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900/50 border border-border/40">
              <ThumbsUp className="h-4 w-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Votos netos recibidos</p>
                <p className="text-2xl font-bold">{totalVotesReceived}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Acciones</CardTitle>
          <CardDescription>Gestiona tu cuenta y contenido</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/mis-publicaciones">
            <Button variant="outline" className="gap-2">
              <Bookmark className="h-4 w-4" />
              Mis publicaciones
            </Button>
          </Link>
          <form action="/auth/signout" method="post">
            <Button variant="destructive" type="submit" className="gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>

      {profile?.is_admin && (
        <Card className="border-amber-500/20 bg-amber-500/[0.02]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Administración
            </CardTitle>
            <CardDescription>Gestiona la plataforma</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/admin">
              <Button variant="outline" className="gap-2 border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
                <Shield className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin/reportes">
              <Button variant="outline" className="gap-2 hover:bg-amber-500/10">
                Panel de Reportes
              </Button>
            </Link>
            <Link href="/admin/usuarios">
              <Button variant="outline" className="gap-2 hover:bg-amber-500/10">
                Usuarios
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
