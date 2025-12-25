import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import { ExternalLink, Instagram, Globe } from 'lucide-react'
import { publicApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { ArtistDetailResponse } from '@/types'

export function ArtistDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [artist, setArtist] = useState<ArtistDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    publicApi.getArtist(slug)
      .then(setArtist)
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

  if (error || !artist) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Artiste non trouve</h1>
        <Button asChild>
          <Link to="/artistes">Retour aux artistes</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{artist.name} - Galerie Cheloudiakoff</title>
        <meta name="description" content={artist.bio_md?.slice(0, 160) || `Decouvrez les oeuvres de ${artist.name}`} />
      </Helmet>

      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Artist Info */}
            <div>
              {artist.portrait && (
                <div className="aspect-square rounded-lg overflow-hidden mb-6">
                  <img
                    src={artist.portrait.url}
                    alt={artist.portrait.alt || artist.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h1 className="font-serif text-3xl font-bold mb-4">{artist.name}</h1>

              {/* Links */}
              <div className="flex flex-wrap gap-2 mb-6">
                {artist.artsper_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={artist.artsper_url} target="_blank" rel="noopener noreferrer">
                      Voir sur Artsper
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                  </Button>
                )}
                {artist.website_url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={artist.website_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {artist.instagram_url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              {artist.bio_md && (
                <div className="prose prose-sm">
                  <ReactMarkdown>{artist.bio_md}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Artworks */}
            <div className="md:col-span-2">
              <h2 className="font-serif text-2xl font-bold mb-6">Oeuvres</h2>
              {artist.artworks.length === 0 ? (
                <p className="text-muted-foreground">Aucune oeuvre disponible.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-6">
                  {artist.artworks.map((artwork) => (
                    <Card key={artwork.id} className="overflow-hidden">
                      {artwork.media[0] && (
                        <div className="aspect-[4/3]">
                          <img
                            src={artwork.media[0].url}
                            alt={artwork.media[0].alt || artwork.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1">{artwork.title}</h3>
                        {artwork.year && (
                          <p className="text-sm text-muted-foreground">{artwork.year}</p>
                        )}
                        {artwork.medium && (
                          <p className="text-sm text-muted-foreground">{artwork.medium}</p>
                        )}
                        {artwork.dimensions && (
                          <p className="text-sm text-muted-foreground">{artwork.dimensions}</p>
                        )}
                        {artwork.artsper_url && (
                          <>
                            <Separator className="my-3" />
                            <Button variant="outline" size="sm" asChild className="w-full">
                              <a href={artwork.artsper_url} target="_blank" rel="noopener noreferrer">
                                Voir sur Artsper
                                <ExternalLink className="ml-2 h-3 w-3" />
                              </a>
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
