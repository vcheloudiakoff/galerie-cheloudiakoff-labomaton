import { Link } from 'react-router-dom'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="font-serif text-xl font-bold">
              Galerie Cheloudiakoff
            </Link>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Galerie d'art contemporain dediee a la decouverte et a la promotion
              d'artistes emergents et etablis.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-3">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/galerie" className="text-muted-foreground hover:text-primary">
                  La Galerie
                </Link>
              </li>
              <li>
                <Link to="/artistes" className="text-muted-foreground hover:text-primary">
                  Artistes
                </Link>
              </li>
              <li>
                <Link to="/evenements" className="text-muted-foreground hover:text-primary">
                  Evenements
                </Link>
              </li>
              <li>
                <Link to="/actualites" className="text-muted-foreground hover:text-primary">
                  Actualites
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-3">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/labomaton" className="text-muted-foreground hover:text-primary">
                  Labomaton
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>Galerie Cheloudiakoff x Labomaton</p>
          <p>&copy; {currentYear} Galerie Cheloudiakoff. Tous droits reserves.</p>
        </div>
      </div>
    </footer>
  )
}
