import { useEffect, useState, useMemo } from 'react'
import { Check, ImagePlus, X, Upload, ArrowUpDown, GripVertical, FolderOpen } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Media } from '@/types'

type SortOption = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'
type DateFilter = 'all' | 'today' | 'week' | 'month'

function filterByDate(items: Media[], filter: DateFilter): Media[] {
  if (filter === 'all') return items

  const now = new Date()
  const cutoff = new Date()

  switch (filter) {
    case 'today':
      cutoff.setHours(0, 0, 0, 0)
      break
    case 'week':
      cutoff.setDate(now.getDate() - 7)
      break
    case 'month':
      cutoff.setDate(now.getDate() - 30)
      break
  }

  return items.filter(m => new Date(m.created_at) >= cutoff)
}

interface MediaPickerProps {
  value: string | null
  onChange: (mediaId: string | null, media: Media | null) => void
  label?: string
  preview?: Media | null
}

export function MediaPicker({ value, onChange, label = 'Image', preview }: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(value)
  const [uploading, setUploading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  const loadMedia = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listMedia(1, 200)
      setMedia(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadMedia()
      setSelected(value)
    }
  }, [open, value])

  const filteredAndSortedMedia = useMemo(() => {
    let result = filterByDate(media, dateFilter)
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name_asc':
          return a.filename.localeCompare(b.filename)
        case 'name_desc':
          return b.filename.localeCompare(a.filename)
        default:
          return 0
      }
    })
  }, [media, sortBy, dateFilter])

  const dateCounts = useMemo(() => ({
    today: filterByDate(media, 'today').length,
    week: filterByDate(media, 'week').length,
    month: filterByDate(media, 'month').length,
  }), [media])

  const handleSelect = () => {
    const selectedMedia = media.find((m) => m.id === selected) || null
    onChange(selected, selectedMedia)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(null, null)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploaded = await adminApi.uploadMedia(file)
      setMedia([uploaded, ...media])
      setSelected(uploaded.id)
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-start gap-4">
        {preview ? (
          <div className="relative group">
            <img
              src={preview.url}
              alt={preview.alt || ''}
              className="w-24 h-24 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
            <ImagePlus className="h-8 w-8" />
          </div>
        )}
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          {preview ? 'Changer' : 'Choisir'}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Bibliotheque de medias</DialogTitle>
          </DialogHeader>

          <DialogBody>
            <div className="flex gap-4 mb-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? 'Upload en cours...' : 'Uploader'}</span>
                </div>
              </label>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="date_desc">Plus recents</option>
                  <option value="date_asc">Plus anciens</option>
                  <option value="name_asc">Nom A-Z</option>
                  <option value="name_desc">Nom Z-A</option>
                </select>
              </div>
            </div>

            {/* Date filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setDateFilter('all')}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full border transition-colors",
                  dateFilter === 'all'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                )}
              >
                Tout ({media.length})
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('today')}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full border transition-colors",
                  dateFilter === 'today'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                )}
              >
                Aujourd'hui ({dateCounts.today})
              </button>
              <button
                type="button"
                onClick={() => setDateFilter('week')}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full border transition-colors",
                  dateFilter === 'week'
                    ? "bg-primary text-primary-foreground border-primary"
                    : "hover:bg-muted"
                )}
              >
                7 jours ({dateCounts.week})
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : media.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Aucun media. Uploadez des images pour commencer.
              </p>
            ) : filteredAndSortedMedia.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Aucun media pour cette periode
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filteredAndSortedMedia.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelected(m.id)}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                      selected === m.id
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-transparent hover:border-muted-foreground/50'
                    )}
                  >
                    <img
                      src={m.url}
                      alt={m.alt || m.filename}
                      className="w-full h-full object-cover"
                    />
                    {selected === m.id && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="h-8 w-8 text-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSelect} disabled={!selected}>
              Selectionner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface MultiMediaPickerProps {
  value: string[]
  onChange: (mediaIds: string[], mediaList: Media[]) => void
  label?: string
  previews?: Media[]
  artistId?: string // Pre-filter by this artist
  artists?: { id: string; name: string }[] // List of artists for upload selection
}

export function MultiMediaPicker({ value, onChange, label = 'Images', previews = [], artistId, artists = [] }: MultiMediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>(value)
  const [uploading, setUploading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [artistFilter, setArtistFilter] = useState<string>(artistId || '')
  const [uploadArtistId, setUploadArtistId] = useState<string>(artistId || '')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [sessionUploads, setSessionUploads] = useState<string[]>([])

  const loadMedia = async () => {
    setLoading(true)
    try {
      const mediaData = await adminApi.listMedia(1, 500)
      setMedia(mediaData)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadMedia()
      setSelected(value)
      // Pre-set artist filter if artistId is provided
      if (artistId) {
        setArtistFilter(artistId)
        setUploadArtistId(artistId)
      }
    }
  }, [open, value, artistId])

  const filteredAndSortedMedia = useMemo(() => {
    let result = [...media]

    // Filter by artist
    if (artistFilter) {
      result = result.filter(m => m.artist_id === artistFilter)
    }

    // Then filter by date
    result = filterByDate(result, dateFilter)

    // Then sort
    return result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name_asc':
          return a.filename.localeCompare(b.filename)
        case 'name_desc':
          return b.filename.localeCompare(a.filename)
        default:
          return 0
      }
    })
  }, [media, sortBy, dateFilter, artistFilter])

  // Count for date filters (considering artist filter)
  const dateCounts = useMemo(() => {
    const filtered = artistFilter ? media.filter(m => m.artist_id === artistFilter) : media
    return {
      today: filterByDate(filtered, 'today').length,
      week: filterByDate(filtered, 'week').length,
      month: filterByDate(filtered, 'month').length,
    }
  }, [media, artistFilter])

  // Count media per artist
  const artistMediaCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const m of media) {
      if (m.artist_id) {
        counts[m.artist_id] = (counts[m.artist_id] || 0) + 1
      }
    }
    return counts
  }, [media])

  // Get unique artists from media that have images
  const artistsWithMedia = useMemo(() => {
    const artistMap = new Map<string, string>()
    for (const m of media) {
      if (m.artist_id && m.artist_name) {
        artistMap.set(m.artist_id, m.artist_name)
      }
    }
    return Array.from(artistMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [media])

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSelect = () => {
    // Keep the order from selected array, but get full media objects
    const selectedMedia = selected.map(id => media.find(m => m.id === id)).filter((m): m is Media => m !== undefined)
    onChange(selected, selectedMedia)
    setOpen(false)
  }

  const handleRemove = (id: string) => {
    const newValue = value.filter((v) => v !== id)
    const newPreviews = previews.filter((p) => p.id !== id)
    onChange(newValue, newPreviews)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    try {
      const uploaded: Media[] = []
      for (const file of Array.from(files)) {
        const m = await adminApi.uploadMedia(file, undefined, undefined, undefined, uploadArtistId || undefined)
        uploaded.push(m)
      }
      const uploadedIds = uploaded.map((u) => u.id)
      setMedia([...uploaded, ...media])
      setSelected([...selected, ...uploadedIds])
      setSessionUploads([...sessionUploads, ...uploadedIds])

      // Auto-filter by the artist we just uploaded to
      if (uploadArtistId) {
        setArtistFilter(uploadArtistId)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const selectAllSessionUploads = () => {
    const newSelected = [...new Set([...selected, ...sessionUploads])]
    setSelected(newSelected)
  }

  const selectAllVisible = () => {
    const visibleIds = filteredAndSortedMedia.map(m => m.id)
    const newSelected = [...new Set([...selected, ...visibleIds])]
    setSelected(newSelected)
  }

  const clearSelection = () => {
    setSelected([])
  }

  // Drag and drop handlers for reordering previews
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Reorder the arrays
    const newValue = [...value]
    const newPreviews = [...previews]

    const [movedId] = newValue.splice(draggedIndex, 1)
    const [movedPreview] = newPreviews.splice(draggedIndex, 1)

    newValue.splice(index, 0, movedId)
    newPreviews.splice(index, 0, movedPreview)

    onChange(newValue, newPreviews)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {previews.length > 1 && (
        <p className="text-xs text-muted-foreground">Glissez pour reordonner</p>
      )}
      <div className="flex flex-wrap gap-3">
        {previews.map((m, index) => (
          <div
            key={m.id}
            className={cn(
              "relative group cursor-grab active:cursor-grabbing",
              draggedIndex === index && "opacity-50"
            )}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className="absolute top-1 left-1 bg-black/50 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <GripVertical className="h-3 w-3 text-white" />
            </div>
            <img
              src={m.url}
              alt={m.alt || ''}
              className="w-20 h-20 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => handleRemove(m.id)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <X className="h-3 w-3" />
            </button>
            <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              {index + 1}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <ImagePlus className="h-6 w-6" />
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Bibliotheque de medias ({selected.length} selectionnes)</DialogTitle>
          </DialogHeader>

          <DialogBody>
            {/* Upload section with artist selection */}
            <div className="border rounded-lg p-4 mb-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Artiste pour l'upload</span>
              </div>
              <div className="flex gap-2 mb-3">
                <select
                  value={uploadArtistId}
                  onChange={(e) => setUploadArtistId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1"
                >
                  <option value="">Sans artiste</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <label className="cursor-pointer inline-block">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? 'Upload en cours...' : 'Uploader des images'}</span>
                </div>
              </label>
            </div>

            {/* Artist filter */}
            {(artistsWithMedia.length > 0 || artists.length > 0) && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filtrer par artiste</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setArtistFilter('')}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-colors",
                      artistFilter === ''
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    Tous ({media.length})
                  </button>
                  {artistsWithMedia.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setArtistFilter(a.id)}
                      className={cn(
                        "px-3 py-1.5 text-sm rounded-full border transition-colors",
                        artistFilter === a.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      {a.name} ({artistMediaCounts[a.id] || 0})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort and date filters */}
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="date_desc">Plus recents</option>
                  <option value="date_asc">Plus anciens</option>
                  <option value="name_asc">Nom A-Z</option>
                  <option value="name_desc">Nom Z-A</option>
                </select>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setDateFilter('all')}
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition-colors",
                    dateFilter === 'all'
                      ? "bg-muted border-primary"
                      : "hover:bg-muted"
                  )}
                >
                  Tout
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('today')}
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition-colors",
                    dateFilter === 'today'
                      ? "bg-muted border-primary"
                      : "hover:bg-muted"
                  )}
                >
                  Auj. ({dateCounts.today})
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('week')}
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition-colors",
                    dateFilter === 'week'
                      ? "bg-muted border-primary"
                      : "hover:bg-muted"
                  )}
                >
                  7j ({dateCounts.week})
                </button>
                <button
                  type="button"
                  onClick={() => setDateFilter('month')}
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition-colors",
                    dateFilter === 'month'
                      ? "bg-muted border-primary"
                      : "hover:bg-muted"
                  )}
                >
                  30j ({dateCounts.month})
                </button>
              </div>
            </div>

            {/* Selection actions */}
            <div className="flex gap-2 mb-4">
              {sessionUploads.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllSessionUploads}
                  className="px-3 py-1.5 text-sm rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  Selectionner uploads recents ({sessionUploads.length})
                </button>
              )}
              {filteredAndSortedMedia.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted transition-colors"
                >
                  Tout selectionner ({filteredAndSortedMedia.length})
                </button>
              )}
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted transition-colors text-muted-foreground"
                >
                  Effacer selection
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : media.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Aucun media. Uploadez des images pour commencer.
              </p>
            ) : filteredAndSortedMedia.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Aucun media pour cette periode
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {filteredAndSortedMedia.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSelect(m.id)}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                      selected.includes(m.id)
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : sessionUploads.includes(m.id)
                        ? 'border-green-400 ring-1 ring-green-400'
                        : 'border-transparent hover:border-muted-foreground/50'
                    )}
                  >
                    <img
                      src={m.url}
                      alt={m.alt || m.filename}
                      className="w-full h-full object-cover"
                    />
                    {sessionUploads.includes(m.id) && !selected.includes(m.id) && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        NEW
                      </div>
                    )}
                    {selected.includes(m.id) && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                          {selected.indexOf(m.id) + 1}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={handleSelect}>
              Confirmer ({selected.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
