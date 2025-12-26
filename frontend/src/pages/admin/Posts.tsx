import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Search, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { MarkdownEditor } from '@/components/admin/MarkdownEditor'
import { formatDate } from '@/lib/utils'
import type { PostWithHero, Media } from '@/types'

export function AdminPosts() {
  const [posts, setPosts] = useState<PostWithHero[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<PostWithHero | null>(null)
  const [creating, setCreating] = useState(false)

  const loadPosts = () => {
    setLoading(true)
    adminApi.listPosts(search || undefined)
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(loadPosts, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette actualite ?')) return
    try {
      await adminApi.deletePost(id)
      setPosts(posts.filter(p => p.id !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const handleSave = async (data: Partial<PostWithHero>) => {
    try {
      if (editing) {
        const updated = await adminApi.updatePost(editing.id, data)
        setPosts(posts.map(p => p.id === updated.id ? updated : p))
      } else {
        const created = await adminApi.createPost(data)
        setPosts([created, ...posts])
      }
      setEditing(null)
      setCreating(false)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Helmet>
        <title>Actualites - Admin</title>
      </Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Actualites</h1>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {(creating || editing) && (
          <PostForm
            post={editing}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setCreating(false) }}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Aucune actualite</p>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => window.open(`/actualites/${post.slug}`, '_blank')}
                >
                  <h3 className="font-semibold truncate">{post.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(post.published_at || post.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {post.published ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(post)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(post.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function PostForm({
  post,
  onSave,
  onCancel,
}: {
  post: PostWithHero | null
  onSave: (data: Partial<PostWithHero> & { hero_media_id?: string | null }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(post?.title || '')
  const [body, setBody] = useState(post?.body_md || '')
  const [published, setPublished] = useState(post?.published || false)
  const [heroId, setHeroId] = useState<string | null>(post?.hero_media_id || null)
  const [hero, setHero] = useState<Media | null>(post?.hero || null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title,
      body_md: body || undefined,
      published,
      hero_media_id: heroId,
    })
  }

  const handleHeroChange = (mediaId: string | null, media: Media | null) => {
    setHeroId(mediaId)
    setHero(media)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{post ? 'Modifier' : 'Nouvelle actualite'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-[200px_1fr] gap-6">
            <MediaPicker
              value={heroId}
              onChange={handleHeroChange}
              label="Image hero"
              preview={hero}
            />
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <MarkdownEditor
            value={body}
            onChange={setBody}
            rows={10}
            label="Contenu"
          />

          <div className="flex items-center gap-2">
            <Switch
              checked={published}
              onCheckedChange={setPublished}
            />
            <Label>Publie</Label>
          </div>

          <div className="flex gap-2">
            <Button type="submit">Enregistrer</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
