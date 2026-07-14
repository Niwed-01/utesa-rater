import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/server"
import { rateLimitByIp, rateLimitByUser } from "@/lib/security/rate-limit"

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
]

const ADMIN_ROUTES = [
  "/admin",
  "/api/admin",
]

export async function middleware(request: NextRequest) {
  const { supabase, response: baseResponse } = createMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // CSRF / Origin validation for all non-GET requests
  if (request.method !== "GET") {
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    const source = origin ?? (referer ? new URL(referer).origin : null)

    if (source) {
      const isAllowed = ALLOWED_ORIGINS.some(
        (allowed) => allowed && source.startsWith(allowed),
      )
      if (!isAllowed) {
        return NextResponse.json(
          { error: "Origen no permitido" },
          { status: 403 },
        )
      }
    }
  }

  if (request.method !== "GET") {
    const path = request.nextUrl.pathname
    const isMutatingApi = RATE_LIMITED_ROUTES.some((p) => path.startsWith(p))
    const isAdminRoute = ADMIN_ROUTES.some((p) => path.startsWith(p))

    if (isMutatingApi || isAdminRoute) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown"

      if (!rateLimitByIp(ip, 15, 60_000)) {
        return NextResponse.json(
          { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
          { status: 429 },
        )
      }

      if (user) {
        if (!rateLimitByUser(user.id, isAdminRoute ? 60 : 30, 60_000)) {
          return NextResponse.json(
            { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
            { status: 429 },
          )
        }
      }
    }
  }

  const authRoutes = ["/login", "/registro"]
  if (user && authRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return baseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
