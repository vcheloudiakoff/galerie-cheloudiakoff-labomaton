import type {
  HomeData,
  ArtistWithPortrait,
  ArtistDetailResponse,
  EventWithDetails,
  PostWithHero,
  PageWithHero,
  Media,
  ContactMessage,
  WaitlistEntry,
  LoginResponse,
  ArtworkWithMedia,
} from '@/types'

const API_BASE = '/api'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token')

  const headers: HeadersInit = {
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(response.status, error.error || 'Request failed')
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// Auth
export const auth = {
  login: (email: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ id: string; email: string; role: string }>('/auth/me'),
}

// Public API
export const publicApi = {
  getHome: () => request<HomeData>('/public/home'),

  getArtists: (page = 1, perPage = 20) =>
    request<ArtistWithPortrait[]>(`/public/artists?page=${page}&per_page=${perPage}`),

  getArtist: (slug: string) =>
    request<ArtistDetailResponse>(`/public/artists/${slug}`),

  getEvents: (page = 1, perPage = 20) =>
    request<EventWithDetails[]>(`/public/events?page=${page}&per_page=${perPage}`),

  getEvent: (slug: string) =>
    request<EventWithDetails>(`/public/events/${slug}`),

  getPosts: (page = 1, perPage = 20) =>
    request<PostWithHero[]>(`/public/posts?page=${page}&per_page=${perPage}`),

  getPost: (slug: string) =>
    request<PostWithHero>(`/public/posts/${slug}`),

  getPage: (key: string) =>
    request<PageWithHero>(`/public/pages/${key}`),

  sendContact: (data: { name: string; email: string; message: string }) =>
    request<ContactMessage>('/public/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  joinWaitlist: (email: string, source?: string) =>
    request<{ success: boolean; message: string }>('/public/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    }),
}

// Admin API
export const adminApi = {
  // Media
  listMedia: (page = 1, perPage = 50) =>
    request<Media[]>(`/admin/media?page=${page}&per_page=${perPage}`),

  uploadMedia: (file: File, alt?: string, credit?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (alt) formData.append('alt', alt)
    if (credit) formData.append('credit', credit)
    return request<Media>('/admin/media', {
      method: 'POST',
      body: formData,
    })
  },

  updateMedia: (id: string, data: { alt?: string; credit?: string }) =>
    request<Media>(`/admin/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteMedia: (id: string) =>
    request<{ success: boolean }>(`/admin/media/${id}`, { method: 'DELETE' }),

  // Artists
  listArtists: (search?: string, page = 1, perPage = 20) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (search) params.set('q', search)
    return request<ArtistWithPortrait[]>(`/admin/artists?${params}`)
  },

  getArtist: (id: string) =>
    request<ArtistWithPortrait>(`/admin/artists/${id}`),

  createArtist: (data: Partial<ArtistWithPortrait>) =>
    request<ArtistWithPortrait>('/admin/artists', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateArtist: (id: string, data: Partial<ArtistWithPortrait>) =>
    request<ArtistWithPortrait>(`/admin/artists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteArtist: (id: string) =>
    request<{ success: boolean }>(`/admin/artists/${id}`, { method: 'DELETE' }),

  toggleArtistPublish: (id: string) =>
    request<ArtistWithPortrait>(`/admin/artists/${id}/publish`, { method: 'POST' }),

  // Artworks
  listArtworks: (search?: string, page = 1, perPage = 20) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (search) params.set('q', search)
    return request<ArtworkWithMedia[]>(`/admin/artworks?${params}`)
  },

  getArtwork: (id: string) =>
    request<ArtworkWithMedia>(`/admin/artworks/${id}`),

  createArtwork: (data: Partial<ArtworkWithMedia> & { media_ids?: string[] }) =>
    request<ArtworkWithMedia>('/admin/artworks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateArtwork: (id: string, data: Partial<ArtworkWithMedia> & { media_ids?: string[] }) =>
    request<ArtworkWithMedia>(`/admin/artworks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteArtwork: (id: string) =>
    request<{ success: boolean }>(`/admin/artworks/${id}`, { method: 'DELETE' }),

  // Events
  listEvents: (search?: string, page = 1, perPage = 20) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (search) params.set('q', search)
    return request<EventWithDetails[]>(`/admin/events?${params}`)
  },

  getEvent: (id: string) =>
    request<EventWithDetails>(`/admin/events/${id}`),

  createEvent: (data: Partial<EventWithDetails> & { artist_ids?: string[] }) =>
    request<EventWithDetails>('/admin/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEvent: (id: string, data: Partial<EventWithDetails> & { artist_ids?: string[] }) =>
    request<EventWithDetails>(`/admin/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEvent: (id: string) =>
    request<{ success: boolean }>(`/admin/events/${id}`, { method: 'DELETE' }),

  // Posts
  listPosts: (search?: string, page = 1, perPage = 20) => {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
    if (search) params.set('q', search)
    return request<PostWithHero[]>(`/admin/posts?${params}`)
  },

  getPost: (id: string) =>
    request<PostWithHero>(`/admin/posts/${id}`),

  createPost: (data: Partial<PostWithHero>) =>
    request<PostWithHero>('/admin/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePost: (id: string, data: Partial<PostWithHero>) =>
    request<PostWithHero>(`/admin/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deletePost: (id: string) =>
    request<{ success: boolean }>(`/admin/posts/${id}`, { method: 'DELETE' }),

  // Pages
  listPages: () =>
    request<PageWithHero[]>('/admin/pages'),

  getPage: (key: string) =>
    request<PageWithHero>(`/admin/pages/${key}`),

  updatePage: (key: string, data: Partial<PageWithHero>) =>
    request<PageWithHero>(`/admin/pages/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Messages
  listMessages: (page = 1, perPage = 50) =>
    request<ContactMessage[]>(`/admin/messages?page=${page}&per_page=${perPage}`),

  updateMessageStatus: (id: string, status: string) =>
    request<ContactMessage>(`/admin/messages/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  // Waitlist
  listWaitlist: (page = 1, perPage = 50) =>
    request<WaitlistEntry[]>(`/admin/waitlist?page=${page}&per_page=${perPage}`),

  exportWaitlist: () => `${API_BASE}/admin/waitlist/export`,
}
