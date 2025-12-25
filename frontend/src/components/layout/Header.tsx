import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navLinks = [
  { to: '/galerie', label: 'Galerie' },
  { to: '/artistes', label: 'Artistes' },
  { to: '/evenements', label: 'Evenements' },
  { to: '/actualites', label: 'Actualites' },
  { to: '/contact', label: 'Contact' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-serif text-xl font-bold tracking-tight">
            Galerie Cheloudiakoff
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/labomaton"
            className={({ isActive }) =>
              cn(
                'text-sm font-medium px-3 py-1.5 rounded-full border transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
              )
            }
          >
            Labomaton
          </NavLink>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="container py-4 flex flex-col space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'text-sm font-medium py-2 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/labomaton"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-2 text-primary"
            >
              Labomaton
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  )
}
