"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { VoteButtons } from "@/components/vote-buttons"
import { ReportButton } from "@/components/report-button"
import { useVote } from "@/hooks/use-vote"

interface Comment {
  id: string
  parent_id: string | null
  alias: string
  body: string
  vote_score: number
  created_at: string
}

interface CommentThreadProps {
  postId: string
  initialComments?: Comment[]
}

export function CommentThread({ postId, initialComments = [] }: CommentThreadProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [fetching, setFetching] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { vote } = useVote()

  useEffect(() => {
    if (comments.length > 0) return
    let cancelled = false
    setFetching(true)
    fetch(`/api/comments?post_id=${postId}`)
      .then((res) => res.ok ? res.json() : [])
      .then((data) => { if (!cancelled) setComments(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setFetching(false) })
    return () => { cancelled = true }
  }, [postId, comments.length])

  const submitReply = useCallback(async (parentId: string | null) => {
    if (!replyBody.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          parent_id: parentId,
          body: replyBody.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al publicar")
      }
      const data = await res.json()
      setComments((prev) => [...prev, data])
      setReplyBody("")
      setReplyingTo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setSubmitting(false)
    }
  }, [replyBody, postId])

  const topLevel = comments.filter((c) => !c.parent_id)
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parent_id === parentId)

  if (fetching) {
    return <p className="text-xs text-muted-foreground">Cargando comentarios...</p>
  }

  return (
    <div className="space-y-3">
      <CommentNode
        comments={topLevel}
        allComments={comments}
        getReplies={getReplies}
        replyingTo={replyingTo}
        replyBody={replyBody}
        submitting={submitting}
        error={error}
        depth={0}
        onReply={setReplyingTo}
        onChangeReply={setReplyBody}
        onSubmit={submitReply}
        onVote={vote}
      />

      <div className="pt-2 border-t border-border">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Dejar un comentario</p>
        {replyingTo ? (
          <p className="text-xs text-muted-foreground">
            Escribiendo respuesta...{' '}
            <button type="button" onClick={() => { setReplyingTo(null); setReplyBody(""); setError(null) }} className="underline hover:text-foreground">
              Cancelar
            </button>
          </p>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); submitReply(null) }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Escribe un comentario..."
              maxLength={1000}
              className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button type="submit" size="sm" disabled={submitting || !replyBody.trim()}>
              {submitting ? "..." : "Enviar"}
            </Button>
          </form>
        )}
        {error && !replyingTo && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}

function CommentNode({
  comments,
  allComments,
  getReplies,
  replyingTo,
  replyBody,
  submitting,
  error,
  depth,
  onReply,
  onChangeReply,
  onSubmit,
  onVote,
}: {
  comments: Comment[]
  allComments: Comment[]
  getReplies: (parentId: string) => Comment[]
  replyingTo: string | null
  replyBody: string
  submitting: boolean
  error: string | null
  depth: number
  onReply: (id: string | null) => void
  onChangeReply: (v: string) => void
  onSubmit: (parentId: string | null) => void
  onVote: (input: { comment_id: string; value: number }) => Promise<void>
}) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("es-DO", { year: "numeric", month: "short", day: "numeric" })
  }

  return (
    <>
      {comments.map((comment) => {
        const isReplying = replyingTo === comment.id
        const childReplies = getReplies(comment.id)

        return (
            <div key={comment.id} className={`${depth > 0 ? "ml-6 border-l-2 border-border pl-4" : ""}`}>
            <div className="rounded-md bg-secondary/50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-500">
                      {comment.alias}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm">{comment.body}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <VoteButtons
                    score={comment.vote_score}
                    userVote={null}
                    onVote={async (value) => { await onVote({ comment_id: comment.id, value }) }}
                    size="sm"
                  />
                  <ReportButton commentId={comment.id} size="sm" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isReplying) {
                    onReply(null); onChangeReply("")
                  } else {
                    onReply(comment.id)
                  }
                }}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {isReplying ? "Cancelar" : "Responder"}
              </button>
            </div>

            {isReplying && (
              <div className="mt-2 ml-6">
                <form
                  onSubmit={(e) => { e.preventDefault(); onSubmit(comment.id) }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={replyBody}
                    onChange={(e) => onChangeReply(e.target.value)}
                    placeholder="Escribe una respuesta..."
                    maxLength={1000}
                    autoFocus
                    className="flex h-9 flex-1 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <Button type="submit" size="sm" disabled={submitting || !replyBody.trim()}>
                    {submitting ? "..." : "Enviar"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { onReply(null); onChangeReply("") }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancelar
                  </button>
                </form>
                {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
              </div>
            )}

            {/* Nested replies visible by default */}
            {childReplies.length > 0 && (
              <CommentNode
                comments={childReplies}
                allComments={allComments}
                getReplies={getReplies}
                replyingTo={replyingTo}
                replyBody={replyBody}
                submitting={submitting}
                error={error}
                depth={depth + 1}
                onReply={onReply}
                onChangeReply={onChangeReply}
                onSubmit={onSubmit}
                onVote={onVote}
              />
            )}
          </div>
        )
      })}
    </>
  )
}
