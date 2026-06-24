"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { RatingStars } from "@/components/rating-stars"
import { VoteButtons } from "@/components/vote-buttons"
import { CommentThread } from "@/components/comment-thread"
import { ReportButton } from "@/components/report-button"
import { useVote } from "@/hooks/use-vote"

interface PostCardProps {
  post: {
    id: string
    class_id: string
    alias: string
    title?: string | null
    body: string
    tags?: string[]
    rating_claridad: number
    rating_puntualidad: number
    rating_exigencia: number
    rating_disponibilidad: number
    rating_justicia: number
    rating_general: number
    vote_score: number
    created_at: string
  }
  className?: string
  userVote?: number | null
  showProfessor?: boolean
  professorName?: string
  editable?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function PostCard({
  post,
  className: classTag,
  userVote = null,
  showProfessor = false,
  professorName,
  editable = false,
  onEdit,
  onDelete,
}: PostCardProps) {
  const [showComments, setShowComments] = useState(true)
  const { vote } = useVote()

  async function handleVote(value: number) {
    await vote({ post_id: post.id, value })
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-DO", { year: "numeric", month: "short", day: "numeric" })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
              {post.alias}
            </span>
            {showProfessor && professorName && (
              <span className="text-xs text-muted-foreground">{professorName}</span>
            )}
            {classTag && (
              <a
                href={`/materias/${post.class_id}`}
                className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                {classTag}
              </a>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(post.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <VoteButtons
            score={post.vote_score}
            userVote={userVote}
            onVote={handleVote}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-3">
        {post.title && <h3 className="text-sm font-semibold leading-snug">{post.title}</h3>}
        <p className="text-sm leading-relaxed">{post.body}</p>
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-emerald-500/5 px-2 py-0.5 text-[10px] font-medium text-emerald-500/80"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <RatingCat label="Claridad" value={post.rating_claridad} />
          <RatingCat label="Puntualidad" value={post.rating_puntualidad} />
          <RatingCat label="Exigencia" value={post.rating_exigencia} />
          <RatingCat label="Disponibilidad" value={post.rating_disponibilidad} />
          <RatingCat label="Justicia" value={post.rating_justicia} />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {showComments ? "Ocultar comentarios" : "Comentar"}
          </button>
          <ReportButton postId={post.id} size="sm" />
        </div>
        {editable && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-xs text-destructive hover:text-destructive/80 transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        )}
      </CardFooter>
      {showComments && (
        <div className="border-t border-border px-4 sm:px-6 pb-4 pt-3">
          <CommentThread postId={post.id} />
        </div>
      )}
    </Card>
  )
}

function RatingCat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <RatingStars value={value} size="sm" />
    </div>
  )
}
