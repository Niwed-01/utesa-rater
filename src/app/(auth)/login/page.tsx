"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { loginSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/")
      } else {
        setLoading(false)
      }
    })
  }, [router, supabase])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const data = {
      email: form.get("email") as string,
      password: form.get("password") as string,
    }

    const result = loginSchema.safeParse(data)
    if (!result.success) {
      setError(result.error.errors[0].message)
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signInWithPassword(result.data)

    if (authError) {
      setError(authError.message === "Invalid login credentials"
        ? "Correo o contraseña incorrectos"
        : authError.message)
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  if (loading) return null

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa con tu correo y contraseña
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@correo.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <a href="/registro" className="text-primary hover:underline">
                ¿No tienes cuenta? Regístrate
              </a>
              <span className="hidden sm:inline">·</span>
              <button
                type="button"
                onClick={async () => {
                  const email = (document.getElementById("email") as HTMLInputElement)?.value
                  if (!email?.includes("@")) { setError("Ingresa tu correo primero"); return }
                  setLoading(true)
                  setError(null)
                  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/login`,
                  })
                  setLoading(false)
                  if (resetError) setError(resetError.message)
                  else setError("Revisa tu correo para restablecer la contraseña")
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
