import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Flag,
  Users,
  ChevronLeft,
} from "lucide-react"

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Reportes", href: "/admin/reportes", icon: Flag },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) {
    redirect("/")
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col gap-1">
        <nav className="sticky top-20 flex flex-col gap-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-neutral-800/40 hover:text-white transition-all duration-200"
              >
                <Icon className="h-4 w-4 text-emerald-500" />
                {link.name}
              </Link>
            )
          })}
          <div className="mt-4 pt-4 border-t border-border/40">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-neutral-800/40 hover:text-white transition-all duration-200"
            >
              <ChevronLeft className="h-4 w-4" />
              Volver al sitio
            </Link>
          </div>
        </nav>
      </aside>

      {/* Mobile nav */}
      <nav className="flex md:hidden gap-1 overflow-x-auto pb-2">
        {sidebarLinks.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-muted-foreground bg-neutral-900 border border-border hover:bg-neutral-800 transition-all"
            >
              <Icon className="h-3.5 w-3.5 text-emerald-500" />
              {link.name}
            </Link>
          )
        })}
      </nav>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
