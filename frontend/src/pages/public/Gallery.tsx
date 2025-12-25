import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import { publicApi } from '@/api/client'
import type { PageWithHero } from '@/types'

export function Gallery() {
  const [page, setPage] = useState<PageWithHero | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getPage('galerie')
      .then(setPage)
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
        <title>{page?.title || 'La Galerie'} - Galerie Cheloudiakoff</title>
        <meta name="description" content="Decouvrez la Galerie Cheloudiakoff, un espace dedie a l'art contemporain." />
      </Helmet>

      {/* Hero */}
      {page?.hero && (
        <section className="relative h-[40vh] md:h-[50vh]">
          <img
            src={page.hero.url}
            alt={page.hero.alt || page.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white">
              {page.title}
            </h1>
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-16">
        <div className="container max-w-3xl">
          {!page?.hero && (
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">
              {page?.title || 'La Galerie'}
            </h1>
          )}
          {page?.body_md && (
            <div className="prose">
              <ReactMarkdown>{page.body_md}</ReactMarkdown>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
