import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui/card'
import { publicApi } from '@/api/client'
import type { ArtistWithPortrait } from '@/types'

export function Artists() {
  const [artists, setArtists] = useState<ArtistWithPortrait[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getArtists()
      .then(setArtists)
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
        <title>Artistes - Galerie Cheloudiakoff</title>
        <meta name="description" content="Decouvrez les artistes representes par la Galerie Cheloudiakoff." />
      </Helmet>

      <section className="py-16">
        <div className="container">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">Artistes</h1>

          {artists.length === 0 ? (
            <p className="text-muted-foreground">Aucun artiste pour le moment.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {artists.map((artist) => (
                <Link key={artist.id} to={`/artistes/${artist.slug}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="aspect-square bg-muted">
                      {artist.portrait ? (
                        <img
                          src={artist.portrait.url}
                          alt={artist.portrait.alt || artist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <span className="text-6xl font-serif">{artist.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h2 className="font-semibold text-lg">{artist.name}</h2>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
