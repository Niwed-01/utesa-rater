"use client"

import { useRouter } from "next/navigation"
import { PostCard } from "@/components/post-card"

interface PostWithRelations {
  id: string
  alias: string
  body: string
  rating_claridad: number
  rating_puntualidad: number
  rating_exigencia: number
  rating_disponibilidad: number
  rating_justicia: number
  rating_general: number
  vote_score: number
  created_at: string
  professors: { full_name: string } | null
  classes: { id: string; name: string } | null
}

interface MisPublicacionesListProps {
  posts: PostWithRelations[]
}

export function MisPublicacionesList({ posts }: MisPublicacionesListProps) {
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta reseña? Esta acción no se puede deshacer.")) return

    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
    if (res.ok) {
      router.refresh()
    } else {
      const err = await res.json()
      alert(err.error || "Error al eliminar")
    }
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={{
            id: post.id,
            class_id: post.classes?.id ?? "",
            alias: post.alias,
            body: post.body,
            rating_claridad: post.rating_claridad,
            rating_puntualidad: post.rating_puntualidad,
            rating_exigencia: post.rating_exigencia,
            rating_disponibilidad: post.rating_disponibilidad,
            rating_justicia: post.rating_justicia,
            rating_general: post.rating_general,
            vote_score: post.vote_score,
            created_at: post.created_at,
          }}
          className={post.classes?.name ?? undefined}
          showProfessor
          professorName={post.professors?.full_name}
          editable
          onDelete={() => handleDelete(post.id)}
        />
      ))}
    </div>
  )
}
