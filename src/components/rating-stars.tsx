"use client"

import { cn } from "@/lib/utils"

const labels = ["Pésimo", "Malo", "Regular", "Bueno", "Excelente"]

interface RatingStarsProps {
  value: number
  onChange?: (v: number) => void
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function RatingStars({ value, onChange, size = "md", showLabel = false }: RatingStarsProps) {
  const sizeClass = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg"

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={onChange ? "button" : "button"}
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-all",
            onChange && "cursor-pointer hover:scale-110",
            !onChange && "cursor-default",
            sizeClass,
            star <= value ? "text-emerald-500" : "text-muted-foreground/30",
          )}
          aria-label={`${star} de 5 estrellas`}
        >
          {star <= value ? "★" : "☆"}
        </button>
      ))}
      {showLabel && value > 0 && (
        <span className="ml-2 text-xs text-muted-foreground">
          {labels[value - 1]}
        </span>
      )}
    </div>
  )
}
