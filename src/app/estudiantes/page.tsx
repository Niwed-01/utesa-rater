import { BookOpen, Calendar, HelpCircle, MapPin, ShieldAlert, Sparkles } from "lucide-react"

export default function EstudiantesPage() {
  const faqs = [
    {
      q: "¿Es realmente anónima la plataforma?",
      a: "Sí, absolutamente. Cada vez que publicas una reseña o un comentario, el sistema genera automáticamente un alias único y aleatorio (por ejemplo, 'Utesiano Valiente'). Tu ID de usuario real nunca se almacena en las vistas públicas y nadie, ni siquiera los administradores, puede asociar un alias a tu cuenta real.",
    },
    {
      q: "¿Por qué no puedo ver mis opiniones asociadas a mi perfil en público?",
      a: "Para proteger tu privacidad al 100%, la vista pública de las reseñas no contiene datos de autor. Solo tú puedes ver y editar tus propias publicaciones desde la sección privada 'Mis publicaciones', la cual se filtra directamente en tu navegador mediante políticas de seguridad RLS de Supabase.",
    },
    {
      q: "¿Cómo accedo a UTESA Virtual?",
      a: "El campus oficial se encuentra en nube.utesa.edu. Para iniciar sesión, debes seleccionar el recinto al que perteneces (por ejemplo, Santiago Sede, Santo Domingo, Moca, Mao, Puerto Plata, etc.) e ingresar tu matrícula y contraseña provista por la universidad.",
    },
    {
      q: "¿Cómo se organiza la selección de asignaturas en UTESA?",
      a: "UTESA opera bajo un sistema de trimestres académicos (Enero-Abril, Mayo-Agosto, Septiembre-Diciembre). Antes del inicio de cada ciclo, debes verificar tu orden de selección en el portal estudiantil y planificar tus materias consultando el índice y reseñas de profesores aquí para tomar las mejores decisiones.",
    },
  ]

  const tips = [
    {
      title: "Planifica con Anticipación",
      desc: "Anota las claves y horarios de las asignaturas que deseas cursar antes de tu fecha de selección. El cupo de los profesores más populares suele agotarse en las primeras horas.",
    },
    {
      title: "Sé Justo y Objetivo",
      desc: "Al calificar, valora el desempeño profesional del docente (claridad, puntualidad, dominio de la materia). Evita insultos personales; los comentarios ofensivos serán eliminados por moderación.",
    },
    {
      title: "Usa el Portal de Soporte",
      desc: "Si tienes problemas para acceder a tu cuenta de nube o reinicio de clave, utiliza el enlace de soporte provisto en la pantalla principal de nube.utesa.edu.",
    },
  ]

  return (
    <div className="space-y-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 via-neutral-900 to-neutral-950 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" /> Recursos Académicos
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-emerald-400 bg-clip-text text-transparent">
            Guía para el Estudiante de UTESA
          </h1>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
            Hemos recopilado información útil, consejos prácticos y respuestas a las preguntas más frecuentes para facilitarte la vida universitaria en la Universidad Tecnológica de Santiago.
          </p>
        </div>
      </section>

      {/* Grid: Aulas y Calendario */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card: Aulas y Edificios */}
        <div id="aulas" className="rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MapPin className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Ubicación de Aulas y Edificios</h2>
          <div className="text-neutral-400 text-sm space-y-2 leading-relaxed">
            <p>
              En la <strong>Sede de Santiago</strong>, los edificios están identificados por letras (Edificio A, B, C, D, E, F, G, H, etc.). Las aulas se numeran de forma lógica: el primer dígito o letra representa el nivel del edificio (por ejemplo, el aula B-204 se encuentra en el Edificio B, segundo nivel).
            </p>
            <p>
              En los recintos de <strong>Santo Domingo</strong> (Máximo Gómez y Herrera) y otras provincias, la organización es similar. Te recomendamos visitar tu recinto asignado un día antes del inicio de clases para localizar tus salones.
            </p>
          </div>
        </div>

        {/* Card: Calendario */}
        <div id="calendario" className="rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calendar className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold">Calendario y Ciclos Académicos</h2>
          <div className="text-neutral-400 text-sm space-y-2 leading-relaxed">
            <p>
              UTESA funciona bajo la modalidad de cuatrimestres (3 ciclos por año):
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Ciclo 1:</strong> Enero — Abril</li>
              <li><strong>Ciclo 2:</strong> Mayo — Agosto</li>
              <li><strong>Ciclo 3:</strong> Septiembre — Diciembre</li>
            </ul>
            <p>
              Las reinscripciones se realizan por internet en fechas específicas según tu promedio de calificaciones acumulado. El calendario detallado con periodos de retiros de materias y exámenes parciales se publica en el sitio oficial de la universidad cada periodo.
            </p>
          </div>
        </div>
      </div>

      {/* Consejos para Estudiantes */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-emerald-500" />
          <h2 className="text-2xl font-bold">Consejos para Estudiantes</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {tips.map((tip, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-neutral-900/50 p-5 space-y-2">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Tip 0{idx + 1}</span>
              <h3 className="font-semibold text-neutral-100">{tip.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">{tip.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preguntas Frecuentes FAQ */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-emerald-500" />
          <h2 className="text-2xl font-bold">Preguntas Frecuentes</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-card p-6 space-y-2 hover:border-emerald-500/20 transition-all duration-300">
              <h3 className="font-bold text-neutral-200 text-sm md:text-base flex items-start gap-2">
                <span className="text-emerald-500 font-extrabold">Q.</span>
                {faq.q}
              </h3>
              <p className="text-neutral-400 text-xs md:text-sm leading-relaxed pl-5">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Moderation note */}
      <section className="flex flex-col md:flex-row gap-4 items-center justify-between rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-8 w-8 text-yellow-500 shrink-0" />
          <div>
            <h3 className="font-bold text-neutral-200 text-sm">Normas de la Comunidad</h3>
            <p className="text-xs text-neutral-400 leading-relaxed mt-1">
              Las reseñas de UTESA Rater son moderadas activamente. Si encuentras comentarios de odio, insultos o acoso, repórtalos. El contenido no constructivo será ocultado al instante.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
