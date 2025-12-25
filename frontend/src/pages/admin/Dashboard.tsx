import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Users, Palette, Calendar, FileText, Mail, ListOrdered } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminApi } from '@/api/client'

interface Stats {
  artists: number
  artworks: number
  events: number
  posts: number
  messages: number
  waitlist: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    artists: 0,
    artworks: 0,
    events: 0,
    posts: 0,
    messages: 0,
    waitlist: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.listArtists(undefined, 1, 1),
      adminApi.listArtworks(undefined, 1, 1),
      adminApi.listEvents(undefined, 1, 1),
      adminApi.listPosts(undefined, 1, 1),
      adminApi.listMessages(1, 1),
      adminApi.listWaitlist(1, 1),
    ])
      .then(([artists, artworks, events, posts, messages, waitlist]) => {
        setStats({
          artists: artists.length,
          artworks: artworks.length,
          events: events.length,
          posts: posts.length,
          messages: messages.length,
          waitlist: waitlist.length,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { title: 'Artistes', value: stats.artists, icon: Users, href: '/admin/artistes', color: 'text-blue-500' },
    { title: 'Oeuvres', value: stats.artworks, icon: Palette, href: '/admin/oeuvres', color: 'text-purple-500' },
    { title: 'Evenements', value: stats.events, icon: Calendar, href: '/admin/evenements', color: 'text-green-500' },
    { title: 'Actualites', value: stats.posts, icon: FileText, href: '/admin/actualites', color: 'text-orange-500' },
    { title: 'Messages', value: stats.messages, icon: Mail, href: '/admin/messages', color: 'text-red-500' },
    { title: 'Waitlist', value: stats.waitlist, icon: ListOrdered, href: '/admin/waitlist', color: 'text-teal-500' },
  ]

  return (
    <>
      <Helmet>
        <title>Dashboard - Admin</title>
      </Helmet>

      <div>
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cards.map((card) => (
              <Link key={card.title} to={card.href}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}+</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Actions rapides</h2>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/artistes"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              + Nouvel artiste
            </Link>
            <Link
              to="/admin/oeuvres"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              + Nouvelle oeuvre
            </Link>
            <Link
              to="/admin/evenements"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              + Nouvel evenement
            </Link>
            <Link
              to="/admin/actualites"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              + Nouvelle actualite
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
