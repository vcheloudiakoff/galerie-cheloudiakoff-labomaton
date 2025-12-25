import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Card, CardContent } from '@/components/ui/card'
import { publicApi } from '@/api/client'
import { formatDate } from '@/lib/utils'
import type { PostWithHero } from '@/types'

export function News() {
  const [posts, setPosts] = useState<PostWithHero[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi.getPosts()
      .then(setPosts)
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
        <title>Actualites - Galerie Cheloudiakoff</title>
        <meta name="description" content="Les dernieres actualites de la Galerie Cheloudiakoff." />
      </Helmet>

      <section className="py-16">
        <div className="container">
          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">Actualites</h1>

          {posts.length === 0 ? (
            <p className="text-muted-foreground">Aucune actualite pour le moment.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
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
                      <h2 className="font-semibold text-lg">{post.title}</h2>
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
