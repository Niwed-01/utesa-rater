import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"

const RATE_LIMITED_ROUTES = [
  "/api/posts",
  "/api/comments",
  "/api/votes",
  "/api/reports",
  "/api/professors",
  "/api/classes",
]

export async function middleware(request: NextRequest) {
  if (request.method !== "GET") {
    const path = request.nextUrl.pathname
    const isMutatingApi = RATE_LIMITED_ROUTES.some((p) => path.startsWith(p))

    if (isMutatingApi) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown"

      if (!rateLimit(ip, 10, 60_000)) {
        return NextResponse.json(
          {
            error:
              "Demasiadas solicitudes. Intenta de nuevo en un minuto.",
          },
          { status: 429 },
        )
      }
    }
  }

  const { supabase, response } = createMiddlewareClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const authRoutes = ["/login", "/registro"]
  if (user && authRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
