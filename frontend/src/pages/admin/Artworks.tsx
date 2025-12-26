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
import type { ArtworkWithMedia, ArtistWithPortrait, Media } from '@/types'

export function AdminArtworks() {
  const [artworks, setArtworks] = useState<ArtworkWithMedia[]>([])
  const [artists, setArtists] = useState<ArtistWithPortrait[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ArtworkWithMedia | null>(null)
  const [creating, setCreating] = useState(false)

  const loadArtworks = () => {
    setLoading(true)
    Promise.all([
      adminApi.listArtworks(search || undefined),
      adminApi.listArtists(undefined, 1, 100),
    ])
      .then(([artworksData, artistsData]) => {
        setArtworks(artworksData)
        setArtists(artistsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(loadArtworks, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette oeuvre ?')) return
    try {
      await adminApi.deleteArtwork(id)
      setArtworks(artworks.filter(a => a.id !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const handleSave = async (data: Partial<ArtworkWithMedia> & { media_ids?: string[] }) => {
    try {
      if (editing) {
        const updated = await adminApi.updateArtwork(editing.id, data)
        setArtworks(artworks.map(a => a.id === updated.id ? updated : a))
      } else {
        const created = await adminApi.createArtwork(data)
        setArtworks([created, ...artworks])
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
        <title>Oeuvres - Admin</title>
      </Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Oeuvres</h1>
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
          <ArtworkForm
            artwork={editing}
            artists={artists}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setCreating(false) }}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : artworks.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Aucune oeuvre</p>
        ) : (
          <div className="space-y-2">
            {artworks.map((artwork) => (
              <div
                key={artwork.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                  onClick={() => window.open(`/artistes/${artwork.artist_slug}`, '_blank')}
                >
                  <div className="w-16 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                    {artwork.media?.[0] ? (
                      <img
                        src={artwork.media[0].url}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{artwork.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {artwork.artist_name} {artwork.year && `(${artwork.year})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {artwork.published ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(artwork)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(artwork.id)}
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

function ArtworkForm({
  artwork,
  artists,
  onSave,
  onCancel,
}: {
  artwork: ArtworkWithMedia | null
  artists: ArtistWithPortrait[]
  onSave: (data: Partial<ArtworkWithMedia> & { media_ids?: string[] }) => void
  onCancel: () => void
}) {
  const [artistId, setArtistId] = useState(artwork?.artist_id || '')
  const [title, setTitle] = useState(artwork?.title || '')
  const [year, setYear] = useState(artwork?.year?.toString() || '')
  const [medium, setMedium] = useState(artwork?.medium || '')
  const [dimensions, setDimensions] = useState(artwork?.dimensions || '')
  const [priceNote, setPriceNote] = useState(artwork?.price_note || '')
  const [artsperUrl, setArtsperUrl] = useState(artwork?.artsper_url || '')
  const [published, setPublished] = useState(artwork?.published || false)
  const [mediaIds, setMediaIds] = useState<string[]>(artwork?.media?.map((m) => m.id) || [])
  const [mediaPreviews, setMediaPreviews] = useState<Media[]>(artwork?.media || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      artist_id: artistId,
      title,
      year: year ? parseInt(year) : undefined,
      medium: medium || undefined,
      dimensions: dimensions || undefined,
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
        <CardTitle>{artwork ? 'Modifier' : 'Nouvelle oeuvre'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <MultiMediaPicker
            value={mediaIds}
            onChange={handleMediaChange}
            label="Images de l'oeuvre"
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
                placeholder="Huile sur toile"
              />
            </div>
            <div className="space-y-2">
              <Label>Dimensions</Label>
              <Input
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="100 x 80 cm"
              />
            </div>
            <div className="space-y-2">
              <Label>Note prix</Label>
              <Input
                value={priceNote}
                onChange={(e) => setPriceNote(e.target.value)}
                placeholder="Sur demande"
              />
            </div>
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
