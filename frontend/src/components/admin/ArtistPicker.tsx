import { useEffect, useState } from 'react'
import { Check, Plus, X, Users } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { ArtistWithPortrait } from '@/types'

interface ArtistPickerProps {
  value: string[]
  onChange: (artistIds: string[], artists: ArtistWithPortrait[]) => void
  label?: string
  previews?: ArtistWithPortrait[]
}

export function ArtistPicker({ value, onChange, label = 'Artistes', previews = [] }: ArtistPickerProps) {
  const [open, setOpen] = useState(false)
  const [artists, setArtists] = useState<ArtistWithPortrait[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>(value)
  const [search, setSearch] = useState('')

  const loadArtists = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listArtists(undefined, 1, 100)
      setArtists(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadArtists()
      setSelected(value)
      setSearch('')
    }
  }, [open, value])

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSelect = () => {
    const selectedArtists = artists.filter((a) => selected.includes(a.id))
    onChange(selected, selectedArtists)
    setOpen(false)
  }

  const handleRemove = (id: string) => {
    const newValue = value.filter((v) => v !== id)
    const newPreviews = previews.filter((p) => p.id !== id)
    onChange(newValue, newPreviews)
  }

  const filteredArtists = artists.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2">
        {previews.map((artist) => (
          <div
            key={artist.id}
            className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-2 py-1"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-background">
              {artist.portrait ? (
                <img
                  src={artist.portrait.url}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                  {artist.name[0]}
                </div>
              )}
            </div>
            <span className="text-sm">{artist.name}</span>
            <button
              type="button"
              onClick={() => handleRemove(artist.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Selectionner des artistes ({selected.length})
              </div>
            </DialogTitle>
          </DialogHeader>

          <DialogBody>
            <div className="mb-4">
              <Input
                placeholder="Rechercher un artiste..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredArtists.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                {search ? 'Aucun artiste trouve' : 'Aucun artiste disponible'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredArtists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    onClick={() => toggleSelect(artist.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
                      selected.includes(artist.id)
                        ? 'bg-primary/10 border border-primary'
                        : 'hover:bg-muted border border-transparent'
                    )}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
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
                      <p className="font-medium truncate">{artist.name}</p>
                      {artist.bio_md && (
                        <p className="text-sm text-muted-foreground truncate">
                          {artist.bio_md.slice(0, 60)}...
                        </p>
                      )}
                    </div>
                    {selected.includes(artist.id) && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
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
