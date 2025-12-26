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
import { ArtistPicker } from '@/components/admin/ArtistPicker'
import { MarkdownEditor } from '@/components/admin/MarkdownEditor'
import { formatDateRange } from '@/lib/utils'
import type { EventWithDetails, Media, ArtistWithPortrait } from '@/types'

export function AdminEvents() {
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<EventWithDetails | null>(null)
  const [creating, setCreating] = useState(false)

  const loadEvents = () => {
    setLoading(true)
    adminApi.listEvents(search || undefined)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(loadEvents, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet evenement ?')) return
    try {
      await adminApi.deleteEvent(id)
      setEvents(events.filter(e => e.id !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const handleSave = async (data: Partial<EventWithDetails> & { artist_ids?: string[] }) => {
    try {
      if (editing) {
        const updated = await adminApi.updateEvent(editing.id, data)
        setEvents(events.map(e => e.id === updated.id ? updated : e))
      } else {
        const created = await adminApi.createEvent(data)
        setEvents([created, ...events])
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
        <title>Evenements - Admin</title>
      </Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Evenements</h1>
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau
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
          <EventForm
            event={editing}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setCreating(false) }}
          />
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Aucun evenement</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-4 p-4 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDateRange(event.start_at, event.end_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {event.published ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(event)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(event.id)}
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

function EventForm({
  event,
  onSave,
  onCancel,
}: {
  event: EventWithDetails | null
  onSave: (data: Partial<EventWithDetails> & { artist_ids?: string[]; hero_media_id?: string | null }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(event?.title || '')
  const [startAt, setStartAt] = useState(event?.start_at?.slice(0, 16) || '')
  const [endAt, setEndAt] = useState(event?.end_at?.slice(0, 16) || '')
  const [location, setLocation] = useState(event?.location || '')
  const [description, setDescription] = useState(event?.description_md || '')
  const [published, setPublished] = useState(event?.published || false)
  const [heroId, setHeroId] = useState<string | null>(event?.hero_media_id || null)
  const [hero, setHero] = useState<Media | null>(event?.hero || null)
  const [artistIds, setArtistIds] = useState<string[]>(event?.artists?.map((a) => a.id) || [])
  const [artistPreviews, setArtistPreviews] = useState<ArtistWithPortrait[]>(event?.artists || [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      title,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : undefined,
      location: location || undefined,
      description_md: description || undefined,
      published,
      hero_media_id: heroId,
      artist_ids: artistIds,
    })
  }

  const handleHeroChange = (mediaId: string | null, media: Media | null) => {
    setHeroId(mediaId)
    setHero(media)
  }

  const handleArtistsChange = (ids: string[], artists: ArtistWithPortrait[]) => {
    setArtistIds(ids)
    setArtistPreviews(artists)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{event ? 'Modifier' : 'Nouvel evenement'}</CardTitle>
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
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de debut *</Label>
                  <Input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Lieu</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Galerie Cheloudiakoff, Paris"
                />
              </div>
            </div>
          </div>

          <ArtistPicker
            value={artistIds}
            onChange={handleArtistsChange}
            label="Artistes de l'evenement"
            previews={artistPreviews}
          />

          <MarkdownEditor
            value={description}
            onChange={setDescription}
            rows={6}
            label="Description"
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
