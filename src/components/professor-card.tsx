import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface ProfessorCardProps {
  id: string
  fullName: string
  careerNames?: string[]
  avgRating?: number | null
  reviewCount?: number
}

export function ProfessorCard({
  id,
  fullName,
  careerNames,
  avgRating,
  reviewCount = 0,
}: ProfessorCardProps) {
  return (
    <Link href={`/profesores/${id}`}>
      <Card className="group transition-all hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/5">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-lg font-bold text-emerald-500">
            {fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold group-hover:text-emerald-500 transition-colors">
              {fullName}
            </h3>
            {careerNames && careerNames.length > 0 && (
              <p className="truncate text-xs text-muted-foreground">
                {careerNames.join(", ")}
              </p>
            )}
          </div>
          <div className="text-right">
            {avgRating !== null && avgRating !== undefined ? (
              <div className="text-lg font-bold text-emerald-500">{avgRating.toFixed(1)}</div>
            ) : null}
            {reviewCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
