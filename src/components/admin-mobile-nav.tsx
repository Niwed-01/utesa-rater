"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LayoutDashboard, Flag, Users, FileText, MessageSquare, GraduationCap, BookOpen, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Reportes", href: "/admin/reportes", icon: Flag },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Reseñas", href: "/admin/resenas", icon: FileText },
  { name: "Comentarios", href: "/admin/comentarios", icon: MessageSquare },
  { name: "Profesores", href: "/admin/profesores", icon: GraduationCap },
  { name: "Materias", href: "/admin/materias", icon: BookOpen },
]

export function AdminMobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-muted-foreground hover:text-white transition-all"
        aria-label="Menú de navegación"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        Menú
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="fixed left-0 top-16 z-50 w-64 rounded-r-2xl border border-border bg-card p-4 shadow-2xl">
            <nav className="flex flex-col gap-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "text-muted-foreground hover:bg-neutral-800/40 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 text-emerald-500" />
                    {link.name}
                  </Link>
                )
              })}
              <div className="mt-4 pt-4 border-t border-border/40">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-neutral-800/40 hover:text-white transition-all duration-200"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Volver al sitio
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
