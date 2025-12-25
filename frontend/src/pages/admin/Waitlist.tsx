import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Download } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { WaitlistEntry } from '@/types'

export function AdminWaitlist() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.listWaitlist()
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleExport = () => {
    const token = localStorage.getItem('token')
    window.open(`${adminApi.exportWaitlist()}?token=${token}`, '_blank')
  }

  return (
    <>
      <Helmet>
        <title>Waitlist Labomaton - Admin</title>
      </Helmet>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Waitlist Labomaton</h1>
            <p className="text-muted-foreground">
              {entries.length} inscription{entries.length > 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : entries.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            Aucune inscription pour le moment
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Source</th>
                  <th className="text-left p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t">
                    <td className="p-4">
                      <a
                        href={`mailto:${entry.email}`}
                        className="text-primary hover:underline"
                      >
                        {entry.email}
                      </a>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {entry.source || '-'}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {formatDate(entry.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
