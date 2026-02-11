-- ============================================================================
-- SUPABASE SCHEMA für Travel Blog
-- ============================================================================

-- PostGIS Extension aktivieren (für Geo-Daten)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================================
-- 1. POSTS (Haupttabelle)
-- ============================================================================
CREATE TABLE IF NOT EXISTS posts (
    -- Primärschlüssel
    post_id TEXT PRIMARY KEY,
    
    -- Zeitstempel
    post_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Tumblr-Originaldaten
    tumblr_timestamp BIGINT,
    slug TEXT,
    original_url TEXT,
    short_url TEXT,
    state TEXT DEFAULT 'published',
    note_count INTEGER DEFAULT 0,
    
    -- Content
    title TEXT,
    summary TEXT,
    content_blocks JSONB NOT NULL,
    layout_info JSONB,
    
    -- Reise-Metadaten
    country TEXT,
    city TEXT,
    region TEXT,
    location_name TEXT,
    companions TEXT[],
    
    -- Geografische Daten
    coordinates GEOGRAPHY(POINT, 4326),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Reise-Kontext
    travel_mode TEXT,
    distance_km DECIMAL(8, 2),
    duration_days INTEGER,
    
    -- Stimmung & Kontext
    weather TEXT,
    mood TEXT,
    highlights TEXT[],
    
    -- Tags
    tags TEXT[],
    
    -- Statistiken
    media_count INTEGER DEFAULT 0,
    text_blocks_count INTEGER DEFAULT 0,
    
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

-- ============================================================================
-- 2. MEDIA (Bilder, Videos, Audio)
-- ============================================================================
CREATE TABLE IF NOT EXISTS media (
    media_id BIGSERIAL PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    
    -- Position im Post
    block_index INTEGER NOT NULL,
    display_order INTEGER DEFAULT 0,
    
    -- Media-Typ
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'audio', 'link')),
    mime_type TEXT,
    
    -- Dateipfade & URLs
    storage_path TEXT,
    local_path TEXT,
    original_url TEXT NOT NULL,
    tumblr_url TEXT,
    
    -- Dimensionen
    width INTEGER,
    height INTEGER,
    file_size BIGINT,
    
    -- Farben & Ästhetik
    dominant_colors JSONB,
    
    -- EXIF-Daten
    exif_data JSONB,
    camera_make TEXT,
    camera_model TEXT,
    lens TEXT,
    aperture DECIMAL(4, 2),
    exposure_time DECIMAL(12, 10),
    iso INTEGER,
    focal_length INTEGER,
    photo_taken_at TIMESTAMPTZ,
    
    -- Video-spezifisch
    duration_seconds INTEGER,
    provider TEXT,
    
    -- Metadaten
    alt_text TEXT,
    caption TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT media_post_block UNIQUE (post_id, block_index, display_order)
);

-- ============================================================================
-- 3. CONTENT_BLOCKS
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_blocks (
    block_id BIGSERIAL PRIMARY KEY,
    post_id TEXT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    
    block_index INTEGER NOT NULL,
    block_type TEXT NOT NULL,
    
    -- Text-Content
    text_content TEXT,
    text_formatting JSONB,
    text_subtype TEXT,
    
    -- Link-Content
    link_url TEXT,
    link_title TEXT,
    link_description TEXT,
    
    -- Layout
    layout_row INTEGER,
    layout_position INTEGER,
    
    -- Referenz zu Media
    media_id BIGINT REFERENCES media(media_id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT block_post_index UNIQUE (post_id, block_index)
);

-- ============================================================================
-- 4. TRIPS (Reisen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trips (
    trip_id BIGSERIAL PRIMARY KEY,
    
    trip_name TEXT NOT NULL,
    description TEXT,
    
    start_date DATE NOT NULL,
    end_date DATE,
    
    countries TEXT[],
    total_distance_km DECIMAL(10, 2),
    
    companions TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. POST_TRIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_trips (
    post_id TEXT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    trip_id BIGINT NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    
    day_number INTEGER,
    trip_order INTEGER,
    
    PRIMARY KEY (post_id, trip_id)
);

-- ============================================================================
-- INDIZES
-- ============================================================================

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(post_date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_country ON posts(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_companions ON posts USING GIN (companions) WHERE companions IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN (tags) WHERE tags IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_coordinates ON posts USING GIST (coordinates) WHERE coordinates IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_summary_search ON posts USING GIN (to_tsvector('english', summary)) WHERE summary IS NOT NULL;

-- Media
CREATE INDEX IF NOT EXISTS idx_media_post_id ON media(post_id);
CREATE INDEX IF NOT EXISTS idx_media_type ON media(media_type);
CREATE INDEX IF NOT EXISTS idx_media_photo_date ON media(photo_taken_at DESC) WHERE photo_taken_at IS NOT NULL;

-- Content Blocks
CREATE INDEX IF NOT EXISTS idx_blocks_post_id ON content_blocks(post_id);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON content_blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_blocks_text_search ON content_blocks USING GIN (to_tsvector('english', text_content)) WHERE text_content IS NOT NULL;

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_dates ON trips(start_date DESC, end_date DESC);
CREATE INDEX IF NOT EXISTS idx_post_trips_trip ON post_trips(trip_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW posts_with_media AS
SELECT 
    p.*,
    COUNT(DISTINCT m.media_id) as total_media,
    COUNT(DISTINCT m.media_id) FILTER (WHERE m.media_type = 'image') as image_count,
    COUNT(DISTINCT m.media_id) FILTER (WHERE m.media_type = 'video') as video_count
FROM posts p
LEFT JOIN media m ON p.post_id = m.post_id
GROUP BY p.post_id;

CREATE OR REPLACE VIEW posts_with_thumbnail AS
SELECT 
    p.*,
    (
        SELECT m.storage_path
        FROM media m
        WHERE m.post_id = p.post_id 
        AND m.media_type = 'image'
        ORDER BY m.block_index, m.display_order
        LIMIT 1
    ) as thumbnail_path
FROM posts p;

CREATE OR REPLACE VIEW timeline AS
SELECT 
    p.post_id,
    p.post_date,
    p.title,
    p.summary,
    p.country,
    p.city,
    p.companions,
    p.tags,
    array_agg(DISTINCT t.trip_name) FILTER (WHERE t.trip_name IS NOT NULL) as trips,
    COUNT(DISTINCT m.media_id) as media_count
FROM posts p
LEFT JOIN post_trips pt ON p.post_id = pt.post_id
LEFT JOIN trips t ON pt.trip_id = t.trip_id
LEFT JOIN media m ON p.post_id = m.post_id
GROUP BY p.post_id
ORDER BY p.post_date DESC;

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trips_updated_at ON trips;
CREATE TRIGGER trips_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION set_coordinates_from_lat_lng()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.coordinates = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_set_coordinates ON posts;
CREATE TRIGGER posts_set_coordinates
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW
    WHEN (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL)
    EXECUTE FUNCTION set_coordinates_from_lat_lng();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_trips ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Public read access" ON posts;
CREATE POLICY "Public read access" ON posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON media;
CREATE POLICY "Public read access" ON media FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON content_blocks;
CREATE POLICY "Public read access" ON content_blocks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON trips;
CREATE POLICY "Public read access" ON trips FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access" ON post_trips;
CREATE POLICY "Public read access" ON post_trips FOR SELECT USING (true);
