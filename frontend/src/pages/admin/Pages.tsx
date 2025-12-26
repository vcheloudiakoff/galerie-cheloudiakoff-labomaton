import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Pencil } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MediaPicker } from '@/components/admin/MediaPicker'
import { MarkdownEditor } from '@/components/admin/MarkdownEditor'
import type { PageWithHero, Media } from '@/types'

export function AdminPages() {
  const [pages, setPages] = useState<PageWithHero[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PageWithHero | null>(null)

  const loadPages = () => {
    setLoading(true)
    adminApi.listPages()
      .then(setPages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPages()
  }, [])

  const handleSave = async (data: Partial<PageWithHero>) => {
    if (!editing) return
    try {
      const updated = await adminApi.updatePage(editing.key, data)
      setPages(pages.map((p) => (p.key === updated.key ? updated : p)))
      setEditing(null)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Helmet>
        <title>Pages - Admin</title>
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold mb-6">Pages</h1>

        {editing && (
          <PageForm
            page={editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : pages.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Aucune page</p>
        ) : (
          <div className="space-y-2">
            {pages.map((page) => (
              <div
                key={page.key}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{page.title}</h3>
                  <p className="text-sm text-muted-foreground">/{page.key}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(page)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function PageForm({
  page,
  onSave,
  onCancel,
}: {
  page: PageWithHero
  onSave: (data: Partial<PageWithHero> & { hero_media_id?: string | null }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(page.title)
  const [body, setBody] = useState(page.body_md || '')
  const [heroId, setHeroId] = useState<string | null>(page.hero_media_id || null)
  const [hero, setHero] = useState<Media | null>(page.hero || null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title,
      body_md: body || undefined,
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
        <CardTitle>Modifier: {page.key}</CardTitle>
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
              <Label>Titre</Label>
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
