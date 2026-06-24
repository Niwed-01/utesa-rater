"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, GraduationCap, PenTool, Users, Bookmark, LogOut, LogIn, UserPlus, User as UserIcon, Shield } from "lucide-react"
import type { User } from "@supabase/supabase-js"

interface NavbarProps {
  user: User | null
  isAdmin?: boolean
}

export function Navbar({ user, isAdmin = false }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { name: "Inicio", href: "/", icon: GraduationCap },
    { name: "Calificar Profesor", href: "/publicar", icon: PenTool },
    { name: "Estudiantes", href: "/estudiantes", icon: Users },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Desktop & Mobile Fixed Navbar container */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all duration-300">
              <span className="font-extrabold text-white text-base">U</span>
            </div>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-emerald-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              UTESA <span className="text-emerald-500 font-extrabold">Rater</span>
            </span>
          </Link>

          {/* Navigation items for Desktop */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-neutral-800/40 hover:text-white ${
                    active
                      ? "bg-neutral-800 text-white border border-border"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 text-emerald-500" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Auth section for Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-amber-500/10 hover:text-amber-400 ${
                      isActive("/admin")
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Shield className="h-4 w-4 text-amber-500" />
                    Admin
                  </Link>
                )}
                <Link
                  href="/mis-publicaciones"
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-neutral-800/40 hover:text-white ${
                    isActive("/mis-publicaciones")
                      ? "bg-neutral-800 text-white border border-border"
                      : "text-muted-foreground"
                  }`}
                >
                  <Bookmark className="h-4 w-4 text-emerald-500" />
                  Mis publicaciones
                </Link>
                <Link
                  href="/perfil"
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-neutral-800/40 hover:text-white ${
                    isActive("/perfil")
                      ? "bg-neutral-800 text-white border border-border"
                      : "text-muted-foreground"
                  }`}
                >
                  <UserIcon className="h-4 w-4 text-emerald-500" />
                  Perfil
                </Link>
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-red-500/50 hover:bg-red-500/10 px-4 py-2 text-sm font-medium text-neutral-400 hover:text-red-400 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:text-white hover:bg-neutral-800/40 transition-all duration-200"
                >
                  <LogIn className="h-4 w-4" />
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-emerald-600/10 hover:shadow-emerald-500/20 active:scale-95 transition-all duration-200"
                >
                  <UserPlus className="h-4 w-4" />
                  Regístrate
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger Menu button for Mobile */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-950 border border-border text-muted-foreground hover:text-white md:hidden active:scale-95 transition-all duration-200"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu with overlay */}
        {isOpen && (
          <div className="absolute top-[53px] left-0 w-full border-b border-border bg-neutral-950/95 backdrop-blur-lg flex flex-col p-4 md:hidden gap-3 shadow-xl animate-in slide-in-from-top-4 duration-200">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all ${
                    active
                      ? "bg-neutral-900 text-white border border-border"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 text-emerald-500" />
                  {item.name}
                </Link>
              )
            })}

            {user ? (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all ${
                      isActive("/admin")
                        ? "bg-neutral-900 text-white border border-border"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Shield className="h-5 w-5 text-amber-500" />
                    Admin
                  </Link>
                )}
                <Link
                  href="/mis-publicaciones"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all ${
                    isActive("/mis-publicaciones")
                      ? "bg-neutral-900 text-white border border-border"
                      : "text-muted-foreground"
                  }`}
                >
                  <Bookmark className="h-5 w-5 text-emerald-500" />
                  Mis publicaciones
                </Link>
                <Link
                  href="/perfil"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all ${
                    isActive("/perfil")
                      ? "bg-neutral-900 text-white border border-border"
                      : "text-muted-foreground"
                  }`}
                >
                  <UserIcon className="h-5 w-5 text-emerald-500" />
                  Perfil
                </Link>
                <form action="/auth/signout" method="post" className="w-full">
                  <button
                    type="submit"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-base font-medium text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <LogOut className="h-5 w-5" />
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground hover:bg-neutral-900"
                >
                  <LogIn className="h-5 w-5 text-emerald-500" />
                  Iniciar sesión
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-base font-medium text-white shadow-md"
                >
                  <UserPlus className="h-5 w-5" />
                  Regístrate
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
