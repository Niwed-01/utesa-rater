import { NextResponse, type NextRequest } from "next/server"
import { createMiddlewareClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request, (req) =>
    NextResponse.redirect(new URL("/", req.url)),
  )

  await supabase.auth.signOut()

  return response
}
