-- Users & Auth
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'editor',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    alt VARCHAR(255),
    credit VARCHAR(255),
    width INT,
    height INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artists
CREATE TABLE artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    bio_md TEXT,
    portrait_media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    artsper_url VARCHAR(500),
    website_url VARCHAR(500),
    instagram_url VARCHAR(500),
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Artworks
CREATE TABLE artworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    year INT,
    medium VARCHAR(255),
    dimensions VARCHAR(255),
    price_note VARCHAR(255),
    artsper_url VARCHAR(500),
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(artist_id, slug)
);

-- Artwork Media (many-to-many)
CREATE TABLE artwork_media (
    artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    PRIMARY KEY (artwork_id, media_id)
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    location VARCHAR(255),
    description_md TEXT,
    hero_media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event Artists (many-to-many)
CREATE TABLE event_artists (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, artist_id)
);

-- Posts (actualites)
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    body_md TEXT,
    hero_media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Static Pages
CREATE TABLE pages (
    key VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body_md TEXT,
    hero_media_id UUID REFERENCES media(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact Messages
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labomaton Waitlist
CREATE TABLE labomaton_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_artists_slug ON artists(slug);
CREATE INDEX idx_artists_published ON artists(published);
CREATE INDEX idx_artworks_slug ON artworks(slug);
CREATE INDEX idx_artworks_artist ON artworks(artist_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_dates ON events(start_at, end_at);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published);

-- Seed default pages
INSERT INTO pages (key, title, body_md) VALUES
('galerie', 'La Galerie', 'Bienvenue a la Galerie Cheloudiakoff, un espace dedie a l''art contemporain.'),
('labomaton', 'Labomaton', 'Labomaton est notre service d''impression photo haut de gamme. Bientot disponible.');
