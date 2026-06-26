import Link from "next/link"

interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  basePath: string
}

export function PaginationControls({ currentPage, totalPages, basePath }: PaginationControlsProps) {
  if (totalPages <= 1) return null

  const pages: (number | "...")[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...")
    }
  }

  return (
    <nav className="flex items-center justify-center gap-2 pt-2 flex-wrap" aria-label="Paginación">
      {currentPage > 1 && (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Página anterior"
        >
          ◀
        </Link>
      )}
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`ellipsis-${pages.length}-${i}`} className="text-xs text-muted-foreground">...</span>
        ) : (
          <Link
            key={page}
            href={`${basePath}?page=${page}`}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
              page === currentPage
                ? "bg-emerald-600 text-white"
                : "border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {page}
          </Link>
        )
      )}
      {currentPage < totalPages && (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          aria-label="Página siguiente"
        >
          ▶
        </Link>
      )}
    </nav>
  )
}
