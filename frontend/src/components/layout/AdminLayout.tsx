import { Link, NavLink, Outlet, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Image,
  Calendar,
  FileText,
  Mail,
  ListOrdered,
  LogOut,
  Menu,
  X,
  Palette,
  FileImage,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const sidebarLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/artistes', icon: Users, label: 'Artistes' },
  { to: '/admin/oeuvres', icon: Palette, label: 'Oeuvres' },
  { to: '/admin/evenements', icon: Calendar, label: 'Evenements' },
  { to: '/admin/actualites', icon: FileText, label: 'Actualites' },
  { to: '/admin/medias', icon: FileImage, label: 'Medias' },
  { to: '/admin/pages', icon: Image, label: 'Pages' },
  { to: '/admin/messages', icon: Mail, label: 'Messages' },
  { to: '/admin/waitlist', icon: ListOrdered, label: 'Waitlist' },
]

export function AdminLayout() {
  const { user, loading, logout, isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        <div className="p-4">
          <Link to="/" className="font-serif text-lg font-bold">
            Galerie Cheloudiakoff
          </Link>
          <p className="text-xs text-muted-foreground mt-1">Administration</p>
        </div>
        <Separator />
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Separator />
        <div className="p-4">
          <div className="text-sm text-muted-foreground mb-2">{user?.email}</div>
          <Button variant="outline" size="sm" onClick={logout} className="w-full">
            <LogOut className="h-4 w-4 mr-2" />
            Deconnexion
          </Button>
        </div>
      </aside>

      {/* Mobile Header + Sidebar */}
      <div className="md:hidden fixed inset-x-0 top-0 z-50 border-b bg-background">
        <div className="flex items-center justify-between p-4">
          <Link to="/admin" className="font-serif text-lg font-bold">
            Admin
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {sidebarOpen && (
          <nav className="p-4 border-t bg-background space-y-1">
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  )
                }
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            ))}
            <Separator className="my-2" />
            <Button variant="outline" size="sm" onClick={logout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Deconnexion
            </Button>
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 md:overflow-auto">
        <div className="pt-16 md:pt-0 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
