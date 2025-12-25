import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import { MapPin, Calendar } from 'lucide-react'
import { publicApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDateRange } from '@/lib/utils'
import type { EventWithDetails } from '@/types'

export function EventDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<EventWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    publicApi.getEvent(slug)
      .then(setEvent)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Evenement non trouve</h1>
        <Button asChild>
          <Link to="/evenements">Retour aux evenements</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{event.title} - Galerie Cheloudiakoff</title>
        <meta name="description" content={event.description_md?.slice(0, 160) || `Evenement: ${event.title}`} />
      </Helmet>

      {/* Hero */}
      {event.hero && (
        <section className="relative h-[40vh] md:h-[50vh]">
          <img
            src={event.hero.url}
            alt={event.hero.alt || event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-end">
            <div className="container pb-8">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-white/80">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDateRange(event.start_at, event.end_at)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container">
          {!event.hero && (
            <>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground mb-8">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDateRange(event.start_at, event.end_at)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </span>
                )}
              </div>
            </>
          )}

          <div className="grid md:grid-cols-3 gap-12">
            {/* Description */}
            <div className="md:col-span-2">
              {event.description_md && (
                <div className="prose max-w-none">
                  <ReactMarkdown>{event.description_md}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Artists */}
            {event.artists.length > 0 && (
              <div>
                <h2 className="font-serif text-xl font-bold mb-4">Artistes</h2>
                <div className="space-y-4">
                  {event.artists.map((artist) => (
                    <Link key={artist.id} to={`/artistes/${artist.slug}`}>
                      <Card className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 p-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                            {artist.portrait ? (
                              <img
                                src={artist.portrait.url}
                                alt={artist.portrait.alt || artist.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                <span className="text-xl font-serif">{artist.name[0]}</span>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-0">
                            <h3 className="font-semibold">{artist.name}</h3>
                          </CardContent>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
