import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/server"

const ALLOWED_NEXT_PATHS = [
  "/",
  "/login",
  "/registro",
  "/publicar",
  "/mis-publicaciones",
  "/perfil",
  "/profesores",
  "/admin",
  "/search",
  "/estudiantes",
]

function isValidNextPath(path: string): boolean {
  try {
    const url = new URL(path, "http://localhost")
    if (url.hostname !== "localhost") return false
    return ALLOWED_NEXT_PATHS.some((allowed) => url.pathname === allowed || url.pathname.startsWith(allowed + "/"))
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next") ?? "/"
  const next = isValidNextPath(rawNext) ? rawNext : "/"

  if (code) {
    const { supabase, response } = createMiddlewareClient(request, () =>
      NextResponse.redirect(`${origin}${next}`),
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
