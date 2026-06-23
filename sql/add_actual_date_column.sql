-- Migration: Add actual_date (travel date) column and update views/triggers

-- 1. Add actual_date column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS actual_date TIMESTAMPTZ;

-- 2. Populate actual_date with post_date as default fallback
UPDATE posts SET actual_date = post_date WHERE actual_date IS NULL;

-- 3. Make actual_date NOT NULL for future constraints, or keep it nullable?
-- Since every post must have a date, we make it NOT NULL
ALTER TABLE posts ALTER COLUMN actual_date SET NOT NULL;

-- 4. Create index for actual_date sorting
CREATE INDEX IF NOT EXISTS idx_posts_actual_date ON posts(actual_date DESC);

-- 5. Recreate the timeline view to include actual_date and sort by actual_date DESC
DROP VIEW IF EXISTS timeline;

CREATE OR REPLACE VIEW timeline AS
SELECT 
    p.post_id,
    p.post_date,
    p.actual_date,
    p.title,
    p.summary,
    c.name as country,
    c.iso_code as country_code,
    p.city,
    p.companions,
    p.tags,
    t.trip_name,
    COUNT(DISTINCT m.media_id) as media_count
FROM posts p
LEFT JOIN countries c ON p.country_id = c.country_id
LEFT JOIN trips t ON p.trip_id = t.trip_id
LEFT JOIN media m ON p.post_id = m.post_id
GROUP BY p.post_id, c.name, c.iso_code, t.trip_name
ORDER BY p.post_date DESC;

-- 6. Recreate countries_with_stats view to calculate first/last visited based on actual_date
DROP VIEW IF EXISTS countries_with_stats;

CREATE OR REPLACE VIEW countries_with_stats AS
SELECT 
    c.*,
    COUNT(DISTINCT p.post_id) as total_posts,
    MIN(p.actual_date) as first_post_date,
    MAX(p.actual_date) as last_post_date,
    array_agg(DISTINCT t.trip_name) FILTER (WHERE t.trip_name IS NOT NULL) as trips
FROM countries c
LEFT JOIN posts p ON c.country_id = p.country_id
LEFT JOIN trips t ON p.trip_id = t.trip_id
GROUP BY c.country_id;

-- 7. Recreate the update_country_stats function to use actual_date
CREATE OR REPLACE FUNCTION update_country_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE countries
    SET 
        first_visited = (
            SELECT MIN(actual_date::DATE) 
            FROM posts 
            WHERE country_id = NEW.country_id
        ),
        last_visited = (
            SELECT MAX(actual_date::DATE) 
            FROM posts 
            WHERE country_id = NEW.country_id
        )
    WHERE country_id = NEW.country_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Recreate posts_with_thumbnail and posts_with_media views to expand p.* and capture actual_date
DROP VIEW IF EXISTS posts_with_thumbnail CASCADE;
DROP VIEW IF EXISTS posts_with_media CASCADE;

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
