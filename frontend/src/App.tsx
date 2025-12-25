import { Routes, Route } from 'react-router-dom'

// Layouts
import { PublicLayout } from '@/components/layout/PublicLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'

// Public Pages
import { Home } from '@/pages/public/Home'
import { Gallery } from '@/pages/public/Gallery'
import { Artists } from '@/pages/public/Artists'
import { ArtistDetail } from '@/pages/public/ArtistDetail'
import { Events } from '@/pages/public/Events'
import { EventDetail } from '@/pages/public/EventDetail'
import { News } from '@/pages/public/News'
import { NewsDetail } from '@/pages/public/NewsDetail'
import { Contact } from '@/pages/public/Contact'
import { Labomaton } from '@/pages/public/Labomaton'

// Admin Pages
import { Login } from '@/pages/admin/Login'
import { Dashboard } from '@/pages/admin/Dashboard'
import { AdminArtists } from '@/pages/admin/Artists'
import { AdminArtworks } from '@/pages/admin/Artworks'
import { AdminEvents } from '@/pages/admin/Events'
import { AdminPosts } from '@/pages/admin/Posts'
import { AdminMedia } from '@/pages/admin/Media'
import { AdminPages } from '@/pages/admin/Pages'
import { AdminMessages } from '@/pages/admin/Messages'
import { AdminWaitlist } from '@/pages/admin/Waitlist'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/galerie" element={<Gallery />} />
        <Route path="/artistes" element={<Artists />} />
        <Route path="/artistes/:slug" element={<ArtistDetail />} />
        <Route path="/evenements" element={<Events />} />
        <Route path="/evenements/:slug" element={<EventDetail />} />
        <Route path="/actualites" element={<News />} />
        <Route path="/actualites/:slug" element={<NewsDetail />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/labomaton" element={<Labomaton />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="artistes" element={<AdminArtists />} />
        <Route path="oeuvres" element={<AdminArtworks />} />
        <Route path="evenements" element={<AdminEvents />} />
        <Route path="actualites" element={<AdminPosts />} />
        <Route path="medias" element={<AdminMedia />} />
        <Route path="pages" element={<AdminPages />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="waitlist" element={<AdminWaitlist />} />
      </Route>
    </Routes>
  )
}

export default App
