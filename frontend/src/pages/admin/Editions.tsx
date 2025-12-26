import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Search, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiMediaPicker } from '@/components/admin/MediaPicker'
import type { EditionWithMedia, ArtistWithPortrait, Media } from '@/types'

export function AdminEditions() {
  const [editions, setEditions] = useState<EditionWithMedia[]>([])
  const [artists, setArtists] = useState<ArtistWithPortrait[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterArtistId, setFilterArtistId] = useState('')
  const [editing, setEditing] = useState<EditionWithMedia | null>(null)
  const [creating, setCreating] = useState(false)

  const loadEditions = () => {
    setLoading(true)
    Promise.all([
      adminApi.listEditions(search || undefined),
      adminApi.listArtists(undefined, 1, 100),
    ])
      .then(([editionsData, artistsData]) => {
        setEditions(editionsData)
        setArtists(artistsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(loadEditions, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette edition ?')) return
    try {
      await adminApi.deleteEdition(id)
      setEditions(editions.filter(e => e.id !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const handleSave = async (data: Partial<EditionWithMedia> & { media_ids?: string[] }) => {
    try {
      if (editing) {
        const updated = await adminApi.updateEdition(editing.id, data)
        setEditions(editions.map(e => e.id === updated.id ? updated : e))
      } else {
        const created = await adminApi.createEdition(data)
        setEditions([created, ...editions])
      }
      setEditing(null)
      setCreating(false)
    } catch (error) {
      console.error(error)
    }
  }

  const handleTogglePublish = async (edition: EditionWithMedia) => {
    try {
      const updated = await adminApi.toggleEditionPublish(edition.id)
      setEditions(editions.map(e => e.id === updated.id ? { ...e, published: updated.published, published_at: updated.published_at } : e))
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <>
      <Helmet>
        <title>Editions - Admin</title>
      </Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Editions</h1>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={filterArtistId}
            onChange={(e) => setFilterArtistId(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 min-w-[200px]"
          >
            <option value="">Tous les artistes</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {(creating || editing) && (
          <EditionForm
            edition={editing}
            artists={artists}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setCreating(false) }}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : editions.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Aucune edition</p>
        ) : (
          <div className="space-y-2">
            {editions
              .filter((e) => !filterArtistId || e.artist_id === filterArtistId)
              .map((edition) => (
              <div
                key={edition.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                  onClick={() => window.open(`/artistes/${edition.artist_slug}`, '_blank')}
                >
                  <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                    {edition.media?.[0] ? (
                      <img
                        src={edition.media[0].url}
                        alt={edition.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{edition.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {edition.artist_name} {edition.year && `(${edition.year})`}
                      {edition.edition_size && ` - ${edition.edition_size}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTogglePublish(edition)}
                  >
                    {edition.published ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(edition)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(edition.id)}
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

function EditionForm({
  edition,
  artists,
  onSave,
  onCancel,
}: {
  edition: EditionWithMedia | null
  artists: ArtistWithPortrait[]
  onSave: (data: Partial<EditionWithMedia> & { media_ids?: string[] }) => void
  onCancel: () => void
}) {
  const [artistId, setArtistId] = useState(edition?.artist_id || '')
  const [title, setTitle] = useState(edition?.title || '')
  const [year, setYear] = useState(edition?.year?.toString() || '')
  const [medium, setMedium] = useState(edition?.medium || '')
  const [dimensions, setDimensions] = useState(edition?.dimensions || '')
  const [editionSize, setEditionSize] = useState(edition?.edition_size || '')
  const [priceNote, setPriceNote] = useState(edition?.price_note || '')
  const [artsperUrl, setArtsperUrl] = useState(edition?.artsper_url || '')
  const [published, setPublished] = useState(edition?.published || false)
  const [mediaIds, setMediaIds] = useState<string[]>(edition?.media?.map((m) => m.id) || [])
  const [mediaPreviews, setMediaPreviews] = useState<Media[]>(edition?.media || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      artist_id: artistId,
      title,
      year: year ? parseInt(year) : undefined,
      medium: medium || undefined,
      dimensions: dimensions || undefined,
      edition_size: editionSize || undefined,
      price_note: priceNote || undefined,
      artsper_url: artsperUrl || undefined,
      published,
      media_ids: mediaIds,
    })
  }

  const handleMediaChange = (ids: string[], mediaList: Media[]) => {
    setMediaIds(ids)
    setMediaPreviews(mediaList)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{edition ? 'Modifier' : 'Nouvelle edition'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultiMediaPicker
            value={mediaIds}
            onChange={handleMediaChange}
            label="Images de l'edition"
            previews={mediaPreviews}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Artiste *</Label>
              <select
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                required
                className="w-full h-10 rounded-md border border-input bg-background px-3"
              >
                <option value="">Selectionner...</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Annee</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Technique</Label>
              <Input
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                placeholder="Lithographie"
              />
            </div>
            <div className="space-y-2">
              <Label>Dimensions</Label>
              <Input
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="50 x 40 cm"
              />
            </div>
            <div className="space-y-2">
              <Label>Tirage</Label>
              <Input
                value={editionSize}
                onChange={(e) => setEditionSize(e.target.value)}
                placeholder="30 ex."
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Note prix</Label>
              <Input
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                placeholder="Sur demande"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Artsper</Label>
              <Input
                type="url"
                value={artsperUrl}
                onChange={(e) => setArtsperUrl(e.target.value)}
                placeholder="https://artsper.com/..."
              />
            </div>
          </div>

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
