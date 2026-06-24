import { RatingStars } from "@/components/rating-stars"

interface CategoryRating {
  label: string
  value: number
}

interface ProfessorRatingSummaryProps {
  general?: number | null
  categories: CategoryRating[]
}

export function ProfessorRatingSummary({
  general,
  categories,
}: ProfessorRatingSummaryProps) {
  return (
    <div className="space-y-3">
      {general !== null && general !== undefined && (
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-sm font-semibold">General</span>
          <div className="flex items-center gap-2">
            <RatingStars value={Math.round(general)} size="sm" />
            <span className="text-lg font-bold text-emerald-500">{general.toFixed(1)}</span>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{cat.label}</span>
            <div className="flex items-center gap-2">
              <RatingStars value={Math.round(cat.value)} size="sm" />
              <span className="w-6 text-right text-xs font-medium tabular-nums">
                {cat.value.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
