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
import type { ArtistWithPortrait, Media } from '@/types'

export function AdminArtists() {
  const [artists, setArtists] = useState<ArtistWithPortrait[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<ArtistWithPortrait | null>(null)
  const [creating, setCreating] = useState(false)

  const loadArtists = () => {
    setLoading(true)
    adminApi.listArtists(search || undefined)
      .then(setArtists)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(loadArtists, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleTogglePublish = async (artist: ArtistWithPortrait) => {
    try {
      const updated = await adminApi.toggleArtistPublish(artist.id)
      setArtists(artists.map(a => a.id === updated.id ? { ...a, ...updated } : a))
    } catch (error) {
      console.error(error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet artiste ?')) return
    try {
      await adminApi.deleteArtist(id)
      setArtists(artists.filter(a => a.id !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const handleSave = async (data: Partial<ArtistWithPortrait>) => {
    try {
      if (editing) {
        const updated = await adminApi.updateArtist(editing.id, data)
        setArtists(artists.map(a => a.id === updated.id ? updated : a))
      } else {
        const created = await adminApi.createArtist(data)
        setArtists([created, ...artists])
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
        <title>Artistes - Admin</title>
      </Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Artistes</h1>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Form */}
        {(creating || editing) && (
          <ArtistForm
            artist={editing}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setCreating(false) }}
          />
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : artists.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Aucun artiste</p>
        ) : (
          <div className="space-y-2">
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {artist.portrait ? (
                    <img
                      src={artist.portrait.url}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      {artist.name[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{artist.name}</h3>
                  <p className="text-sm text-muted-foreground">/{artist.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTogglePublish(artist)}
                  >
                    {artist.published ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(artist)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(artist.id)}
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

function ArtistForm({
  artist,
  onSave,
  onCancel,
}: {
  artist: ArtistWithPortrait | null
  onSave: (data: Partial<ArtistWithPortrait> & { portrait_media_id?: string | null }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(artist?.name || '')
  const [bio, setBio] = useState(artist?.bio_md || '')
  const [artsperUrl, setArtsperUrl] = useState(artist?.artsper_url || '')
  const [websiteUrl, setWebsiteUrl] = useState(artist?.website_url || '')
  const [instagramUrl, setInstagramUrl] = useState(artist?.instagram_url || '')
  const [published, setPublished] = useState(artist?.published || false)
  const [portraitId, setPortraitId] = useState<string | null>(artist?.portrait_media_id || null)
  const [portrait, setPortrait] = useState<Media | null>(artist?.portrait || null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      bio_md: bio || undefined,
      artsper_url: artsperUrl || undefined,
      website_url: websiteUrl || undefined,
      instagram_url: instagramUrl || undefined,
      published,
      portrait_media_id: portraitId,
    })
  }

  const handlePortraitChange = (mediaId: string | null, media: Media | null) => {
    setPortraitId(mediaId)
    setPortrait(media)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{artist ? 'Modifier' : 'Nouvel artiste'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-[200px_1fr] gap-6">
            <MediaPicker
              value={portraitId}
              onChange={handlePortraitChange}
              label="Portrait"
              preview={portrait}
            />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <MarkdownEditor
                value={bio}
                onChange={setBio}
                rows={4}
                label="Biographie"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>URL Artsper</Label>
              <Input
                type="url"
                value={artsperUrl}
                onChange={(e) => setArtsperUrl(e.target.value)}
                placeholder="https://artsper.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label>Site web</Label>
              <Input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/..."
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
