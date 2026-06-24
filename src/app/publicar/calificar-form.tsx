"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Star, Scale, MessageSquareText, ClipboardCheck, GraduationCap, Clock, Brain, Calendar } from "lucide-react"
import { RatingStars } from "@/components/rating-stars"
import { cn } from "@/lib/utils"
import { postSchema } from "@/lib/validations"
import { ProfesorSelector, ProfesorConfirmado, type ProfessorResult } from "./profesor-selector"
import { MateriaSelector } from "./materia-selector"

const CURRENT_TRIMESTRES = [
  { value: "2026-10", label: "Enero - Abril" },
  { value: "2026-20", label: "Mayo - Agosto" },
  { value: "2026-30", label: "Septiembre - Diciembre" },
]

export function CalificarForm() {
  const router = useRouter()

  const [selectedProf, setSelectedProf] = useState<ProfessorResult | null>(null)
  const [professorConfirmed, setProfessorConfirmed] = useState(false)

  const [claridad, setClaridad] = useState(0)
  const [justicia, setJusticia] = useState(0)
  const [puntualidad, setPuntualidad] = useState(0)
  const [exigencia, setExigencia] = useState(0)
  const [disponibilidad, setDisponibilidad] = useState(0)
  const [volveria, setVolveria] = useState<boolean | null>(null)
  const [body, setBody] = useState("")
  const [selectedClase, setSelectedClase] = useState<{ id: string; name: string } | null>(null)
  const [semester, setSemester] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  function selectProfessor(p: ProfessorResult) {
    setSelectedProf(p)
    setProfessorConfirmed(true)
  }

  function changeProfessor() {
    setProfessorConfirmed(false)
    setSelectedProf(null)
  }

  function updateProfessor(p: ProfessorResult) {
    setSelectedProf(p)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    if (!selectedProf || !selectedClase) { setError("Selecciona un profesor y una materia"); return }

    const payload = {
      professor_id: selectedProf.id,
      class_id: selectedClase.id,
      title: selectedClase.name,
      body,
      semester,
      volveria_a_tomar: volveria ?? true,
      rating_claridad: claridad,
      rating_justicia: justicia,
      rating_puntualidad: puntualidad,
      rating_exigencia: exigencia,
      rating_disponibilidad: disponibilidad,
    }

    const parsed = postSchema.safeParse(payload)
    if (!parsed.success) {
      setFieldErrors(parsed.error.flatten().fieldErrors)
      setError("Revisa los campos marcados en rojo")
      return
    }

    setLoading(true)

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    })

    if (!res.ok) {
      const err = await res.json()
      if (err.details) setFieldErrors(err.details)
      setError(err.error || "Error al publicar")
      setLoading(false)
      return
    }

    const data = await res.json()
    setSuccess(data.id)
  }

  function resetForm() {
    setSuccess(null)
    setSelectedProf(null)
    setProfessorConfirmed(false)
    setClaridad(0)
    setJusticia(0)
    setPuntualidad(0)
    setExigencia(0)
    setDisponibilidad(0)
    setVolveria(null)
    setBody("")
    setSelectedClase(null)
    setSemester("")
    setError(null)
    setFieldErrors({})
  }

  if (success) {
    return (
      <div className="text-center pt-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
          <ClipboardCheck className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="mt-6 text-2xl font-bold tracking-tight">¡Reseña publicada!</h2>
        <p className="mt-3 text-muted-foreground">
          Tu opinión se publicó de forma completamente anónima.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button variant="outline" onClick={resetForm}>
            Publicar otra reseña
          </Button>
          <Button onClick={() => router.push(`/profesores/${selectedProf?.id}`)}>
            Ver profesor
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="text-center pt-4 pb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Opinar acerca de un maestro
        </h1>
        <p className="mt-2 text-muted-foreground">
          ¡Tu opinión es MUY importante!
        </p>
      </div>

      {!professorConfirmed ? (
        <ProfesorSelector onSelect={selectProfessor} onError={setError} />
      ) : selectedProf ? (
        <ProfesorConfirmado profesor={selectedProf} onChange={changeProfessor} onUpdate={updateProfessor} />
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <RatingQuestion
          icon={<Star className="h-5 w-5" />}
          title="¿Sabe explicarse con claridad?"
          description="Es importante que el profesor explique los conceptos de forma clara y comprensible."
          value={claridad}
          onChange={setClaridad}
          fieldError={fieldErrors.rating_claridad?.[0]}
        />

        <RatingQuestion
          icon={<Scale className="h-5 w-5" />}
          title="¿Evalúa justamente?"
          description="Hay maestros que evalúan mejor el desempeño del estudiantado que otros. ¿Sientes que tus esfuerzos fueron valorados?"
          value={justicia}
          onChange={setJusticia}
          fieldError={fieldErrors.rating_justicia?.[0]}
        />

        <RatingQuestion
          icon={<Clock className="h-5 w-5" />}
          title="¿Es puntual?"
          description="¿El profesor comienza y termina sus clases a tiempo? La puntualidad dice mucho de su compromiso."
          value={puntualidad}
          onChange={setPuntualidad}
          fieldError={fieldErrors.rating_puntualidad?.[0]}
        />

        <RatingQuestion
          icon={<Brain className="h-5 w-5" />}
          title="¿Qué tan exigente es?"
          description="Algunos profesores retan a sus estudiantes a dar más. ¿Sentiste que el nivel de exigencia fue adecuado?"
          value={exigencia}
          onChange={setExigencia}
          fieldError={fieldErrors.rating_exigencia?.[0]}
        />

        <RatingQuestion
          icon={<Calendar className="h-5 w-5" />}
          title="¿Está disponible fuera de clases?"
          description="¿El profesor tiene horarios de oficina, responde dudas por correo o muestra disposición a ayudar fuera del aula?"
          value={disponibilidad}
          onChange={setDisponibilidad}
          fieldError={fieldErrors.rating_disponibilidad?.[0]}
        />

        <VolveriaSection value={volveria} onChange={setVolveria} />

        <div className="rounded-2xl border border-border bg-card p-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <GraduationCap className="h-4 w-4 text-emerald-500" />
            Materia cursada
          </label>
          <MateriaSelector onSelect={setSelectedClase} />
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <GraduationCap className="h-4 w-4 text-emerald-500" />
            Trimestre cursado
          </label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="mt-2 flex h-11 w-full rounded-xl border border-input bg-card px-4 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Selecciona un trimestre</option>
            {CURRENT_TRIMESTRES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold">
                ¿Qué quieres decir a los demás acerca de este maestro?
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cuenta tu experiencia. ¿Cómo fue tomar una clase con este profesor?
              </p>
              <div className="mt-4">
                <textarea
                  rows={5}
                  placeholder="Comparte tu experiencia... (mín. 10 caracteres)"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  maxLength={3000}
                  className="flex w-full rounded-xl border border-input bg-transparent px-4 py-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                />
                <p className="mt-1.5 text-right text-xs text-muted-foreground">{body.length}/3000</p>
                {fieldErrors.body && (
                  <p className="mt-1 text-xs text-destructive">{fieldErrors.body[0]}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-start gap-3">
            <svg className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-emerald-500">Anonimato garantizado</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Esta reseña se publicará con un alias único generado automáticamente.
                Nadie podrá saber que fuiste tú, ni siquiera nosotros.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="h-14 w-full rounded-2xl text-base font-semibold shadow-lg shadow-emerald-600/20"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Publicando...
            </span>
          ) : (
            "Publicar anónimamente"
          )}
        </Button>
      </form>
    </>
  )
}

function RatingQuestion({
  icon,
  title,
  description,
  value,
  onChange,
  fieldError,
}: {
  icon: React.ReactNode
  title: string
  description: string
  value: number
  onChange: (v: number) => void
  fieldError?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          <div className="mt-4">
            <RatingStars value={value} onChange={onChange} size="lg" showLabel />
          </div>
          {fieldError && (
            <p className="mt-2 text-xs text-destructive">{fieldError}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function VolveriaSection({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
          <MessageSquareText className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold">
            ¿Volverías a tomar clases con este maestro?
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            ¿Qué tan conforme quedaste en general con el profesor?
          </p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onChange(true)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 md:px-6 py-3 text-sm font-semibold transition-all",
                value === true
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-sm"
                  : "border-border text-muted-foreground hover:border-emerald-500/50 hover:text-emerald-500",
              )}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              Sí, volvería
            </button>
            <button
              type="button"
              onClick={() => onChange(false)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 md:px-6 py-3 text-sm font-semibold transition-all",
                value === false
                  ? "border-destructive bg-destructive/10 text-destructive shadow-sm"
                  : "border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive",
              )}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              No volvería
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
