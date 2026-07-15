import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateOrigin } from "@/lib/security/csrf"

export async function POST(request: NextRequest) {
  const originCheck = validateOrigin(request)
  if (originCheck) return originCheck.error

  const supabase = await createClient()
  await supabase.auth.signOut()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const redirectUrl = siteUrl ? new URL("/", siteUrl) : new URL("/", request.url)
  return NextResponse.redirect(redirectUrl)
}
