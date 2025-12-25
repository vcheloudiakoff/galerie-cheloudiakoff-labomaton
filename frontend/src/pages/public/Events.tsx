import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui/card'
import { publicApi } from '@/api/client'
import { formatDateRange } from '@/lib/utils'
import type { EventWithDetails } from '@/types'

export function Events() {
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getEvents()
      .then(setEvents)
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

  const now = new Date()
  const upcoming = events.filter(e => new Date(e.start_at) > now)
  const past = events.filter(e => new Date(e.start_at) <= now)

  return (
    <>
      <Helmet>
        <title>Evenements - Galerie Cheloudiakoff</title>
        <meta name="description" content="Decouvrez les evenements de la Galerie Cheloudiakoff." />
      </Helmet>

      <section className="py-16">
        <div className="container">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">Evenements</h1>

          {events.length === 0 ? (
            <p className="text-muted-foreground">Aucun evenement pour le moment.</p>
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-xl font-semibold mb-6">A venir</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcoming.map((event) => (
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
                              {formatDateRange(event.start_at, event.end_at)}
                            </p>
                            <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                            {event.location && (
                              <p className="text-sm text-muted-foreground">{event.location}</p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {past.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Passes</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {past.map((event) => (
                      <Link key={event.id} to={`/evenements/${event.slug}`}>
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full opacity-75">
                          {event.hero && (
                            <div className="aspect-video">
                              <img
                                src={event.hero.url}
                                alt={event.hero.alt || event.title}
                                className="w-full h-full object-cover grayscale"
                              />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <p className="text-sm text-muted-foreground mb-2">
                              {formatDateRange(event.start_at, event.end_at)}
                            </p>
                            <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                            {event.location && (
                              <p className="text-sm text-muted-foreground">{event.location}</p>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
