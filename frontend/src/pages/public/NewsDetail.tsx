import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import ReactMarkdown from 'react-markdown'
import { publicApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { PostWithHero } from '@/types'

export function NewsDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostWithHero | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    publicApi.getPost(slug)
      .then(setPost)
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

  if (error || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Article non trouve</h1>
        <Button asChild>
          <Link to="/actualites">Retour aux actualites</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{post.title} - Galerie Cheloudiakoff</title>
        <meta name="description" content={post.body_md?.slice(0, 160) || post.title} />
      </Helmet>

      {/* Hero */}
      {post.hero && (
        <section className="relative h-[40vh] md:h-[50vh]">
          <img
            src={post.hero.url}
            alt={post.hero.alt || post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-end">
            <div className="container pb-8">
              <p className="text-white/80 mb-2">
                {formatDate(post.published_at || post.created_at)}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-white">
                {post.title}
              </h1>
            </div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container max-w-3xl">
          {!post.hero && (
            <>
              <p className="text-muted-foreground mb-2">
                {formatDate(post.published_at || post.created_at)}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">
                {post.title}
              </h1>
            </>
          )}

          {post.body_md && (
            <div className="prose max-w-none">
              <ReactMarkdown>{post.body_md}</ReactMarkdown>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
