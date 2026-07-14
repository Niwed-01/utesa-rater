import { NextResponse } from "next/server"

const ALLOWED_ORIGINS: string[] = [
  process.env.NEXT_PUBLIC_SITE_URL ?? "",
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
].filter(Boolean)

export function validateOrigin(request: Request): { error: NextResponse } | null {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")

  const source = origin ?? (referer ? new URL(referer).origin : null)

  if (!source) return null

  const isAllowed = ALLOWED_ORIGINS.some(
    (allowed) => allowed && source.startsWith(allowed),
  )

  if (!isAllowed) {
    return {
      error: NextResponse.json({ error: "Origen no permitido" }, { status: 403 }),
    }
  }

  return null
}
