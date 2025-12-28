import { useEffect, useState, useRef, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Trash2, Upload, ArrowUpDown, Search, User } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import type { Media, ArtistWithPortrait } from '@/types'

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

export function AdminMedia() {
  const [media, setMedia] = useState<Media[]>([])
  const [artists, setArtists] = useState<ArtistWithPortrait[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [artistFilter, setArtistFilter] = useState<string>('')
  const [uploadArtistId, setUploadArtistId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      adminApi.listMedia(1, 500),
      adminApi.listArtists(undefined, 1, 100),
    ])
      .then(([mediaData, artistsData]) => {
        setMedia(mediaData)
        setArtists(artistsData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const uploaded = await adminApi.uploadMedia(file, undefined, undefined, undefined, uploadArtistId || undefined)
        setMedia((prev) => [uploaded, ...prev])
      }
      // Auto-filter to show uploaded images
      if (uploadArtistId) {
        setArtistFilter(uploadArtistId)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce media ?')) return
    try {
      await adminApi.deleteMedia(id)
      setMedia(media.filter((m) => m.id !== id))
    } catch (error) {
      console.error(error)
    }
  }

  const handleUpdateAlt = async (id: string, alt: string) => {
    try {
      const updated = await adminApi.updateMedia(id, { alt })
      setMedia(media.map((m) => (m.id === updated.id ? updated : m)))
    } catch (error) {
      console.error(error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length === 0) return

    setUploading(true)
    try {
      for (const file of files) {
        const uploaded = await adminApi.uploadMedia(file, undefined, undefined, undefined, uploadArtistId || undefined)
        setMedia((prev) => [uploaded, ...prev])
      }
      // Auto-filter to show uploaded images
      if (uploadArtistId) {
        setArtistFilter(uploadArtistId)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const filteredAndSortedMedia = useMemo(() => {
    let result = [...media]

    // Filter by artist
    if (artistFilter) {
      result = result.filter(m => m.artist_id === artistFilter)
    }

    // Filter by date
    result = filterByDate(result, dateFilter)

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(m =>
        m.filename.toLowerCase().includes(searchLower) ||
        m.alt?.toLowerCase().includes(searchLower) ||
        m.artist_name?.toLowerCase().includes(searchLower)
      )
    }

    // Sort
    result.sort((a, b) => {
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

    return result
  }, [media, sortBy, dateFilter, artistFilter, search])

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

  // Get artists that have media
  const artistsWithMedia = useMemo(() => {
    return artists.filter(a => artistMediaCounts[a.id] > 0)
  }, [artists, artistMediaCounts])

  // Date counts (considering artist filter)
  const dateCounts = useMemo(() => {
    const filtered = artistFilter ? media.filter(m => m.artist_id === artistFilter) : media
    return {
      today: filterByDate(filtered, 'today').length,
      week: filterByDate(filtered, 'week').length,
      month: filterByDate(filtered, 'month').length,
    }
  }, [media, artistFilter])

  return (
    <>
      <Helmet>
        <title>Medias - Admin</title>
      </Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Medias</h1>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                'Upload...'
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Upload zone with artist selection */}
        <div className="mb-6 border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-4 mb-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Assigner a un artiste</span>
            <select
              value={uploadArtistId}
              onChange={(e) => setUploadArtistId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1 max-w-xs"
            >
              <option value="">Sans artiste</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
          >
            <Upload className={`h-8 w-8 mx-auto mb-2 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className={`text-sm ${dragOver ? 'text-primary' : 'text-muted-foreground'}`}>
              {uploading ? 'Upload en cours...' : 'Glissez-deposez des images ici'}
            </p>
            {uploadArtistId && (
              <p className="text-xs text-primary mt-2">
                Les images seront assignees a: {artists.find(a => a.id === uploadArtistId)?.name}
              </p>
            )}
          </div>
        </div>

        {/* Search and sort */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom ou texte alternatif..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-10 rounded-md border border-input bg-background px-3 min-w-[180px]"
            >
              <option value="date_desc">Plus recents</option>
              <option value="date_asc">Plus anciens</option>
              <option value="name_asc">Nom A-Z</option>
              <option value="name_desc">Nom Z-A</option>
            </select>
          </div>
        </div>

        {/* Artist filter */}
        {artistsWithMedia.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtrer par artiste</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setArtistFilter('')}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  artistFilter === ''
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted'
                }`}
              >
                Tous ({media.length})
              </button>
              {artistsWithMedia.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setArtistFilter(a.id)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                    artistFilter === a.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  {a.name} ({artistMediaCounts[a.id]})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              dateFilter === 'all'
                ? 'bg-secondary text-secondary-foreground border-secondary'
                : 'hover:bg-muted'
            }`}
          >
            Toutes dates
          </button>
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              dateFilter === 'today'
                ? 'bg-secondary text-secondary-foreground border-secondary'
                : 'hover:bg-muted'
            }`}
          >
            Aujourd'hui ({dateCounts.today})
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              dateFilter === 'week'
                ? 'bg-secondary text-secondary-foreground border-secondary'
                : 'hover:bg-muted'
            }`}
          >
            7 jours ({dateCounts.week})
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              dateFilter === 'month'
                ? 'bg-secondary text-secondary-foreground border-secondary'
                : 'hover:bg-muted'
            }`}
          >
            30 jours ({dateCounts.month})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : media.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Aucun media</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter des images
              </Button>
            </CardContent>
          </Card>
        ) : filteredAndSortedMedia.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            Aucun resultat{search && ` pour "${search}"`}{artistFilter && ` pour cet artiste`}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAndSortedMedia.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    className="w-full h-full object-cover"
                  />
                  {item.artist_name && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                      {item.artist_name}
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <Input
                    placeholder="Texte alternatif"
                    defaultValue={item.alt || ''}
                    onBlur={(e) => handleUpdateAlt(item.id, e.target.value)}
                    className="text-sm mb-2"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {item.filename}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
