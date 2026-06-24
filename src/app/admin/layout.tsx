import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Flag,
  Users,
  FileText,
  MessageSquare,
  ChevronLeft,
} from "lucide-react"
import { AdminMobileNav } from "@/components/admin-mobile-nav"

const sidebarLinks = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Reportes", href: "/admin/reportes", icon: Flag },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users },
  { name: "Reseñas", href: "/admin/resenas", icon: FileText },
  { name: "Comentarios", href: "/admin/comentarios", icon: MessageSquare },
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
      {/* Sidebar — desktop */}
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

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Mobile nav bar */}
        <div className="mb-4 md:hidden">
          <AdminMobileNav />
        </div>

        {children}
      </div>
    </div>
  )
}
