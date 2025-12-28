-- Add folder field to media for organization
ALTER TABLE media ADD COLUMN folder VARCHAR(100);

-- Add artist_id to link media to an artist
ALTER TABLE media ADD COLUMN artist_id UUID REFERENCES artists(id) ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX idx_media_folder ON media(folder);
CREATE INDEX idx_media_artist_id ON media(artist_id);
