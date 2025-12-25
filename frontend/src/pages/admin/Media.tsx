import { useEffect, useState, useRef } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Trash2, Upload } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Media } from '@/types'

export function AdminMedia() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMedia = () => {
    setLoading(true)
    adminApi.listMedia()
      .then(setMedia)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMedia()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const uploaded = await adminApi.uploadMedia(file)
        setMedia((prev) => [uploaded, ...prev])
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
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-muted">
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    className="w-full h-full object-cover"
                  />
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
