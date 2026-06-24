import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
          <svg className="h-8 w-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Página no encontrada</h2>
        <p className="text-sm text-muted-foreground">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition-all"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
