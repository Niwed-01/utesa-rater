import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth"

export async function GET() {
  const auth = await requireUser()
  if (auth.response) return auth.response

  const supabase = await createClient()
  const user = auth.user

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return NextResponse.json({
    user_id: user.id,
    user_email: user.email,
    profile_found: !!profile,
    profile,
    profile_error: profileError
      ? { code: profileError.code, message: profileError.message, details: profileError.details }
      : null,
  })
}
