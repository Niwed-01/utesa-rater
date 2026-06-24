import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

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
