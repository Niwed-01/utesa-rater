"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ReportButtonProps {
  postId?: string
  commentId?: string
  size?: "sm" | "md"
}

export function ReportButton({ postId, commentId, size = "md" }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (reason.length < 3) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId ?? null,
          comment_id: commentId ?? null,
          reason,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al reportar")
      }

      setDone(true)
      setTimeout(() => { setOpen(false); setDone(false); setReason("") }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          size === "sm"
            ? "text-xs text-muted-foreground hover:text-foreground transition-colors"
            : "text-xs text-muted-foreground hover:text-foreground transition-colors"
        }
      >
        Reportar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            {done ? (
              <div className="text-center">
                <p className="text-sm text-green-500">Reporte enviado. Gracias.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-sm font-semibold">Reportar contenido</h3>
                {error && (
                  <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                    {error}
                  </div>
                )}
                <textarea
                  placeholder="¿Por qué reportas esto? (mín. 3 caracteres)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" size="sm" disabled={loading || reason.length < 3}>
                    {loading ? "Enviando..." : "Reportar"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
