import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, Calendar, ExternalLink } from 'lucide-react'
import { publicApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateRange, formatDate } from '@/lib/utils'
import type { HomeData } from '@/types'

export function Home() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getHome()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Galerie Cheloudiakoff - Art Contemporain</title>
        <meta name="description" content="Galerie Cheloudiakoff - Galerie d'art contemporain dediee a la decouverte et a la promotion d'artistes emergents et etablis." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-muted/30 pt-12 pb-24 md:pb-32 md:pt-12">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="mb-8">
              <img
                src="/logo.png"
                alt="Galerie Cheloudiakoff"
                className="h-24 md:h-32 lg:h-40 w-auto"
              />
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Un espace dedie a l'art contemporain, ou se rencontrent artistes
              emergents et collectionneurs passionnes.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link to="/artistes">
                  Decouvrir les artistes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/evenements">Evenements</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Current Event */}
      {data?.current_event && (
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Exposition en cours
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                  {data.current_event.title}
                </h2>
                <p className="text-primary-foreground/80 mb-4">
                  {formatDateRange(data.current_event.start_at, data.current_event.end_at)}
                </p>
                {data.current_event.location && (
                  <p className="text-primary-foreground/80 mb-6">
                    {data.current_event.location}
                  </p>
                )}
                <Button variant="secondary" asChild>
                  <Link to={`/evenements/${data.current_event.slug}`}>
                    En savoir plus
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {data.current_event.hero && (
                <div className="aspect-[4/3] rounded-lg overflow-hidden">
                  <img
                    src={data.current_event.hero.url}
                    alt={data.current_event.hero.alt || data.current_event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Artists */}
      {data?.featured_artists && data.featured_artists.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold">Artistes</h2>
              <Button variant="ghost" asChild>
                <Link to="/artistes">
                  Voir tous
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.featured_artists.map((artist) => (
                <Link key={artist.id} to={`/artistes/${artist.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-muted">
                      {artist.portrait ? (
                        <img
                          src={artist.portrait.url}
                          alt={artist.portrait.alt || artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-4xl font-serif">{artist.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{artist.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      {data?.upcoming_events && data.upcoming_events.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold">
                Prochains evenements
              </h2>
              <Button variant="ghost" asChild>
                <Link to="/evenements">
                  Voir tous
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {data.upcoming_events.map((event) => (
                <Link key={event.id} to={`/evenements/${event.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    {event.hero && (
                      <div className="aspect-video">
                        <img
                          src={event.hero.url}
                          alt={event.hero.alt || event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDate(event.start_at)}
                      </p>
                      <h3 className="font-semibold mb-2">{event.title}</h3>
                      {event.location && (
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts */}
      {data?.latest_posts && data.latest_posts.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold">Actualites</h2>
              <Button variant="ghost" asChild>
                <Link to="/actualites">
                  Voir toutes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {data.latest_posts.map((post) => (
                <Link key={post.id} to={`/actualites/${post.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    {post.hero && (
                      <div className="aspect-video">
                        <img
                          src={post.hero.url}
                          alt={post.hero.alt || post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        {formatDate(post.published_at || post.created_at)}
                      </p>
                      <h3 className="font-semibold">{post.title}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Labomaton CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-4">
            Labomaton
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Bientot disponible : notre service d'impression photo haut de gamme.
            Inscrivez-vous a la liste d'attente pour etre informe du lancement.
          </p>
          <Button variant="secondary" asChild size="lg">
            <Link to="/labomaton">
              En savoir plus
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  )
}
