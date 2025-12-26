-- Editions (prints, limited editions, etc.)
CREATE TABLE editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    year INT,
    medium VARCHAR(255),
    dimensions VARCHAR(255),
    edition_size VARCHAR(100),
    price_note VARCHAR(255),
    artsper_url VARCHAR(500),
    published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(artist_id, slug)
);

-- Edition Media (many-to-many)
CREATE TABLE edition_media (
    edition_id UUID REFERENCES editions(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    PRIMARY KEY (edition_id, media_id)
);

-- Indexes
CREATE INDEX idx_editions_slug ON editions(slug);
CREATE INDEX idx_editions_artist ON editions(artist_id);
CREATE INDEX idx_editions_published ON editions(published);
