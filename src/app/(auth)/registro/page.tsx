"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { registroSchema } from "@/lib/validations"
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

export default function RegistroPage() {
  const supabase = createClient()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const data = {
      email: form.get("email") as string,
      password: form.get("password") as string,
      confirmPassword: form.get("confirmPassword") as string,
    }

    const result = registroSchema.safeParse(data)
    if (!result.success) {
      setError(result.error.errors[0].message)
      setLoading(false)
      return
    }

    const { error: authError } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: "https://utesa-rater.vercel.app/auth/callback",
      },
    })

    if (authError) {
      if (authError.message.includes("already")) {
        setError("Este correo ya está registrado")
      } else {
        setError(authError.message)
      }
      setLoading(false)
      return
    }

    setSuccess("Registro exitoso. Revisa tu correo para confirmar la cuenta.")
    setLoading(false)
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Crear cuenta</CardTitle>
          <CardDescription>
            Registro abierto para cualquier correo
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-500">
                {success}
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
                placeholder="Mínimo 6 caracteres"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repite la contraseña"
                required
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading || !!success}>
              {loading ? "Registrando..." : "Crear cuenta"}
            </Button>
            <p className="text-xs text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <a href="/login" className="text-primary hover:underline">
                Inicia sesión
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
