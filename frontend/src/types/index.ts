export interface User {
  id: string
  email: string
  role: 'admin' | 'editor'
}

export interface Media {
  id: string
  filename: string
  url: string
  alt: string | null
  credit: string | null
  width: number | null
  height: number | null
  created_at: string
}

export interface Artist {
  id: string
  name: string
  slug: string
  bio_md: string | null
  portrait_media_id: string | null
  artsper_url: string | null
  website_url: string | null
  instagram_url: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ArtistWithPortrait extends Artist {
  portrait: Media | null
}

export interface Artwork {
  id: string
  artist_id: string
  title: string
  slug: string
  year: number | null
  medium: string | null
  dimensions: string | null
  price_note: string | null
  artsper_url: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ArtworkWithMedia extends Artwork {
  media: Media[]
  artist_name: string | null
  artist_slug: string | null
}

export interface Event {
  id: string
  title: string
  slug: string
  start_at: string
  end_at: string | null
  location: string | null
  description_md: string | null
  hero_media_id: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface EventWithDetails extends Event {
  hero: Media | null
  artists: ArtistWithPortrait[]
}

export interface Post {
  id: string
  title: string
  slug: string
  body_md: string | null
  hero_media_id: string | null
  published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PostWithHero extends Post {
  hero: Media | null
}

export interface Page {
  key: string
  title: string
  body_md: string | null
  hero_media_id: string | null
  updated_at: string
}

export interface PageWithHero extends Page {
  hero: Media | null
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  status: 'new' | 'read' | 'archived'
  created_at: string
}

export interface WaitlistEntry {
  id: string
  email: string
  source: string | null
  created_at: string
}

export interface HomeData {
  current_event: EventWithDetails | null
  upcoming_events: EventWithDetails[]
  featured_artists: ArtistWithPortrait[]
  latest_posts: PostWithHero[]
}

export interface ArtistDetailResponse extends ArtistWithPortrait {
  artworks: ArtworkWithMedia[]
}

export interface LoginResponse {
  token: string
  user: User
}
