import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  return NextResponse.redirect(new URL("/", origin))
}
