import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MisPublicacionesList } from "./mis-publicaciones-list"

export const dynamic = "force-dynamic"

export default async function MisPublicacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single()

  if (profile?.is_banned) redirect("/login?banned=true")

  const { data: posts } = await supabase
    .from("posts")
    .select("*, professors(full_name), classes(id, name)")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mis publicaciones</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo tú puedes ver y editar tus reseñas
        </p>
      </div>

      {posts && posts.length > 0 ? (
        <MisPublicacionesList posts={posts} />
      ) : (
        <div className="rounded-lg border border-border p-8 text-center">
          <p className="text-muted-foreground">
            Aún no has publicado ninguna reseña.
          </p>
        </div>
      )}
    </div>
  )
}
