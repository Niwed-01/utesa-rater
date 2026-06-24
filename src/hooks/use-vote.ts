"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

interface VoteInput {
  post_id?: string
  comment_id?: string
  value: number
}

export function useVote() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (input: VoteInput) => {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Error al votar")
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      queryClient.invalidateQueries({ queryKey: ["my-votes"] })
    },
  })

  return {
    vote: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
