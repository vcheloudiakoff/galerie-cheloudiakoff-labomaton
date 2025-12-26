import { useEffect, useState } from 'react'
import { Check, ImagePlus, X, Upload } from 'lucide-react'
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

  const loadMedia = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listMedia(1, 100)
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
            <div className="mb-4">
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
                  <span>{uploading ? 'Upload en cours...' : 'Uploader une image'}</span>
                </div>
              </label>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : media.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Aucun media. Uploadez des images pour commencer.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {media.map((m) => (
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
}

export function MultiMediaPicker({ value, onChange, label = 'Images', previews = [] }: MultiMediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>(value)
  const [uploading, setUploading] = useState(false)

  const loadMedia = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listMedia(1, 100)
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

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSelect = () => {
    const selectedMedia = media.filter((m) => selected.includes(m.id))
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
        const m = await adminApi.uploadMedia(file)
        uploaded.push(m)
      }
      setMedia([...uploaded, ...media])
      setSelected([...selected, ...uploaded.map((u) => u.id)])
    } catch (error) {
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-3">
        {previews.map((m) => (
          <div key={m.id} className="relative group">
            <img
              src={m.url}
              alt={m.alt || ''}
              className="w-20 h-20 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => handleRemove(m.id)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
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
            <div className="mb-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>{uploading ? 'Upload en cours...' : 'Uploader des images'}</span>
                </div>
              </label>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : media.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Aucun media. Uploadez des images pour commencer.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {media.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSelect(m.id)}
                    className={cn(
                      'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                      selected.includes(m.id)
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-transparent hover:border-muted-foreground/50'
                    )}
                  >
                    <img
                      src={m.url}
                      alt={m.alt || m.filename}
                      className="w-full h-full object-cover"
                    />
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
