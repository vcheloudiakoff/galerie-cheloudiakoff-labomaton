import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Mail, MailOpen, Archive } from 'lucide-react'
import { adminApi } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { ContactMessage } from '@/types'

export function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ContactMessage | null>(null)

  useEffect(() => {
    adminApi.listMessages()
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await adminApi.updateMessageStatus(id, status)
      setMessages(messages.map((m) => (m.id === updated.id ? updated : m)))
      if (selected?.id === id) {
        setSelected(updated)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Mail className="h-4 w-4 text-blue-500" />
      case 'read':
        return <MailOpen className="h-4 w-4 text-green-500" />
      case 'archived':
        return <Archive className="h-4 w-4 text-muted-foreground" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  return (
    <>
      <Helmet>
        <title>Messages - Admin</title>
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">Aucun message</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {/* List */}
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => {
                    setSelected(message)
                    if (message.status === 'new') {
                      handleStatusChange(message.id, 'read')
                    }
                  }}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selected?.id === message.id
                      ? 'border-primary bg-muted/50'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  {getStatusIcon(message.status)}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${message.status === 'new' ? '' : 'font-normal'}`}>
                      {message.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {message.email}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(message.created_at, { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              ))}
            </div>

            {/* Detail */}
            {selected && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="font-semibold text-lg">{selected.name}</h2>
                      <a
                        href={`mailto:${selected.email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selected.email}
                      </a>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(selected.created_at)}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap mb-6">{selected.message}</p>

                  <div className="flex gap-2">
                    {selected.status !== 'read' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(selected.id, 'read')}
                      >
                        <MailOpen className="h-4 w-4 mr-2" />
                        Marquer lu
                      </Button>
                    )}
                    {selected.status !== 'archived' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(selected.id, 'archived')}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archiver
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={`mailto:${selected.email}`}>
                        Repondre
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  )
}
