import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/server"
import { rateLimitByIp, rateLimitByUser, getRateLimitKey } from "@/lib/security/rate-limit"

const ALLOWED_ORIGINS: string[] = [
  process.env.NEXT_PUBLIC_SITE_URL ?? "",
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://127.0.0.1:3000"]
    : []),
].filter(Boolean)

const RATE_LIMITED_ROUTES = [
  "/api/posts",
  "/api/comments",
  "/api/votes",
  "/api/reports",
  "/api/professors",
  "/api/classes",
  "/auth",
]

const EXPORT_ROUTES = ["/api/admin/export"]

const ADMIN_ROUTES = [
  "/admin",
  "/api/admin",
]

export async function middleware(request: NextRequest) {
  const { supabase, response: baseResponse } = createMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // CSRF / Origin validation for all non-GET requests
  if (request.method !== "GET") {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    const source = origin ?? (referer ? new URL(referer).origin : null)

    if (!source) {
      return NextResponse.json(
        { error: "Origen no permitido" },
        { status: 403 },
      )
    }

    const isAllowed = ALLOWED_ORIGINS.some(
      (allowed) => allowed === source,
    )
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Origen no permitido" },
        { status: 403 },
      )
    }
  }

  // Rate limiting for ALL requests (GET + mutations)
  const isApiRoute = RATE_LIMITED_ROUTES.some((p) => path.startsWith(p))
  const isAdminRoute = ADMIN_ROUTES.some((p) => path.startsWith(p))
  const isExportRoute = EXPORT_ROUTES.some((p) => path.startsWith(p))

  if (isApiRoute || isAdminRoute || isExportRoute) {
    const ip = getRateLimitKey(request)
    const isMutation = request.method !== "GET"

    if (isMutation) {
      if (!rateLimitByIp(ip, 15, 60_000)) {
        return NextResponse.json(
          { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
          { status: 429 },
        )
      }

      if (user) {
        const limit = isExportRoute ? 10 : isAdminRoute ? 60 : 30
        if (!rateLimitByUser(user.id, limit, 60_000)) {
          return NextResponse.json(
            { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
            { status: 429 },
          )
        }
      }
    } else {
      if (!rateLimitByIp(ip, 60, 60_000)) {
        return NextResponse.json(
          { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
          { status: 429 },
        )
      }
    }
  }

  const authRoutes = ["/login", "/registro"]
  if (user && authRoutes.includes(path)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return baseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
