import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CalificarForm } from "./calificar-form"

export const dynamic = "force-dynamic"

export default async function PublicarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_banned")
    .eq("id", user.id)
    .single()

  if (profile?.is_banned) redirect("/login?banned=true")

  return (
    <div className="mx-auto max-w-2xl">
      <CalificarForm />
    </div>
  )
}
