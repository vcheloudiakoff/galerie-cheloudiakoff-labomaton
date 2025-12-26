import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui/card'
import { publicApi } from '@/api/client'
import type { EditionWithMedia } from '@/types'

export function Editions() {
  const [editions, setEditions] = useState<EditionWithMedia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getEditions()
      .then(setEditions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Group editions by artist
  const editionsByArtist = useMemo(() => {
    const groups: Record<string, { name: string; slug: string; editions: EditionWithMedia[] }> = {}

    for (const edition of editions) {
      const key = edition.artist_slug || 'unknown'
      if (!groups[key]) {
        groups[key] = {
          name: edition.artist_name || 'Artiste inconnu',
          slug: edition.artist_slug || '',
          editions: [],
        }
      }
      groups[key].editions.push(edition)
    }

    return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name))
  }, [editions])

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
        <title>Editions - Galerie Cheloudiakoff</title>
        <meta name="description" content="Decouvrez les editions limitees des artistes de la Galerie Cheloudiakoff." />
      </Helmet>

      <section className="py-16">
        <div className="container">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">Editions</h1>

          {editions.length === 0 ? (
            <p className="text-muted-foreground">Aucune edition pour le moment.</p>
          ) : (
            <div className="space-y-12">
              {editionsByArtist.map((group) => (
                <div key={group.slug}>
                  <Link
                    to={`/artistes/${group.slug}`}
                    className="inline-block font-serif text-2xl font-semibold mb-4 hover:text-primary transition-colors"
                  >
                    {group.name}
                  </Link>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {group.editions.map((edition) => (
                      <Card key={edition.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="aspect-[4/3] bg-muted">
                          {edition.media?.[0] ? (
                            <img
                              src={edition.media[0].url}
                              alt={edition.media[0].alt || edition.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <span className="text-sm">Pas d'image</span>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{edition.title}</h3>
                          <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
                            {edition.year && <p>{edition.year}</p>}
                            {edition.medium && <p>{edition.medium}</p>}
                            {edition.dimensions && <p>{edition.dimensions}</p>}
                            {edition.edition_size && (
                              <p className="font-medium text-foreground">{edition.edition_size}</p>
                            )}
                          </div>
                          {edition.artsper_url && (
                            <a
                              href={edition.artsper_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-3 text-sm text-primary hover:underline"
                            >
                              Voir sur Artsper
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
