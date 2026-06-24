"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

interface VoteButtonsProps {
  score: number
  userVote: number | null
  onVote: (value: number) => Promise<void> | void
}

export function VoteButtons({ score, userVote, onVote }: VoteButtonsProps) {
  const [optimisticScore, setOptimisticScore] = useState(score)
  const [optimisticVote, setOptimisticVote] = useState(userVote)
  const prevState = useRef({ score, vote: userVote })

  async function handleVote(value: number) {
    const prevVote = optimisticVote
    const prevScore = optimisticScore

    let newVote: number | null
    let newScore: number

    if (prevVote === value) {
      newVote = null
      newScore = prevScore - value
    } else if (prevVote === null) {
      newVote = value
      newScore = prevScore + value
    } else {
      newVote = value
      newScore = prevScore - prevVote + value
    }

    setOptimisticVote(newVote)
    setOptimisticScore(newScore)

    try {
      await onVote(value)
      prevState.current = { score: newScore, vote: newVote }
    } catch {
      setOptimisticVote(prevVote)
      setOptimisticScore(prevScore)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors",
            optimisticVote === 1
              ? "bg-emerald-500/20 text-emerald-500"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
        aria-label="Votar positivo"
      >
        ▲
      </button>
      <span
        className={cn(
          "min-w-[1.5rem] text-center text-xs font-semibold tabular-nums",
          optimisticScore > 0 && "text-green-500",
          optimisticScore < 0 && "text-red-500",
          optimisticScore === 0 && "text-muted-foreground",
        )}
      >
        {optimisticScore}
      </span>
      <button
        onClick={() => handleVote(-1)}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors",
          optimisticVote === -1
            ? "bg-destructive/20 text-destructive"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
        aria-label="Votar negativo"
      >
        ▼
      </button>
    </div>
  )
}
