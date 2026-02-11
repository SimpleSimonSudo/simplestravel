-- ============================================================================
-- SCHEMA MIGRATION: Countries & Trips Trennung
-- ============================================================================
-- 
-- ZIEL:
-- - Länder als separate Tabelle
-- - Posts gehören zu genau EINEM Land
-- - Posts gehören zu genau EINEM Trip (optional)
-- - Trips können mehrere Länder beinhalten
--
-- WICHTIG: Führe diese Queries NACHEINANDER aus und prüfe die Ergebnisse!
-- ============================================================================

-- ============================================================================
-- SCHRITT 1: COUNTRIES Tabelle erstellen
-- ============================================================================

CREATE TABLE IF NOT EXISTS countries (
    country_id BIGSERIAL PRIMARY KEY,
    
    -- Grunddaten
    name TEXT UNIQUE NOT NULL,
    name_de TEXT,  -- Deutscher Name (optional)
    iso_code CHAR(2) UNIQUE,  -- ISO 3166-1 Alpha-2 (z.B. 'IT', 'HR')
    iso_code_3 CHAR(3),  -- ISO 3166-1 Alpha-3 (z.B. 'ITA', 'HRV')
    
    -- Geografische Info
    continent TEXT,  -- 'Europe', 'Asia', etc.
    region TEXT,  -- 'Southern Europe', 'Balkans', etc.
    
    -- Statistiken (automatisch berechnet)
    post_count INTEGER DEFAULT 0,
    first_visited DATE,
    last_visited DATE,
    
    -- Metadaten
    description TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Suchen
CREATE INDEX idx_countries_name ON countries(name);
CREATE INDEX idx_countries_iso ON countries(iso_code);

COMMENT ON TABLE countries IS 'Länder-Stammdaten';
COMMENT ON COLUMN countries.name IS 'Offizieller Name (Englisch)';
COMMENT ON COLUMN countries.iso_code IS 'ISO 3166-1 Alpha-2 Code';

-- ============================================================================
-- SCHRITT 2: Bestehende Länder aus posts migrieren
-- ============================================================================

-- Extrahiere einzigartige Länder aus posts.country und füge sie in countries ein
INSERT INTO countries (name, iso_code, continent)
SELECT DISTINCT
    country,
    CASE 
        WHEN country = 'Italy' THEN 'IT'
        WHEN country = 'Croatia' THEN 'HR'
        WHEN country = 'Slovenia' THEN 'SI'
        WHEN country = 'Austria' THEN 'AT'
        WHEN country = 'Germany' THEN 'DE'
        WHEN country = 'France' THEN 'FR'
        WHEN country = 'Spain' THEN 'ES'
        WHEN country = 'Greece' THEN 'GR'
        WHEN country = 'Switzerland' THEN 'CH'
        WHEN country = 'Netherlands' THEN 'NL'
        WHEN country = 'Belgium' THEN 'BE'
        WHEN country = 'Poland' THEN 'PL'
        WHEN country = 'Czech Republic' THEN 'CZ'
        WHEN country = 'Hungary' THEN 'HU'
        WHEN country = 'Serbia' THEN 'RS'
        WHEN country = 'Bosnia and Herzegovina' THEN 'BA'
        WHEN country = 'Montenegro' THEN 'ME'
        WHEN country = 'Albania' THEN 'AL'
        ELSE NULL
    END,
    'Europe'
FROM posts
WHERE country IS NOT NULL
ON CONFLICT (name) DO NOTHING;

-- Verifizierung: Prüfe eingefügte Länder
SELECT country_id, name, iso_code FROM countries ORDER BY name;

-- ============================================================================
-- SCHRITT 3: posts Tabelle modifizieren
-- ============================================================================

-- 3a) Neue Spalten hinzufügen
ALTER TABLE posts 
    ADD COLUMN IF NOT EXISTS country_id BIGINT REFERENCES countries(country_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS trip_id BIGINT REFERENCES trips(trip_id) ON DELETE SET NULL;

-- 3b) country_id aus bestehendem country TEXT befüllen
UPDATE posts p
SET country_id = c.country_id
FROM countries c
WHERE p.country = c.name;

-- Verifizierung: Prüfe wie viele Posts jetzt country_id haben
SELECT 
    COUNT(*) FILTER (WHERE country_id IS NOT NULL) as with_country_id,
    COUNT(*) FILTER (WHERE country_id IS NULL) as without_country_id,
    COUNT(*) as total
FROM posts;

-- 3c) Alte country Spalte in country_old umbenennen (als Backup)
ALTER TABLE posts RENAME COLUMN country TO country_old;

-- Optional: Wenn du sicher bist, kannst du country_old später löschen
-- ALTER TABLE posts DROP COLUMN country_old;

COMMENT ON COLUMN posts.country_id IS 'Foreign Key zu countries - jeder Post gehört zu genau einem Land';
COMMENT ON COLUMN posts.trip_id IS 'Foreign Key zu trips - jeder Post gehört zu genau einem Trip (optional)';

-- ============================================================================
-- SCHRITT 4: TRIP_COUNTRIES Tabelle erstellen (Many-to-Many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trip_countries (
    trip_id BIGINT NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
    country_id BIGINT NOT NULL REFERENCES countries(country_id) ON DELETE CASCADE,
    
    -- Reihenfolge im Trip (optional)
    visit_order INTEGER,
    
    -- Zeitraum in diesem Land während des Trips
    entry_date DATE,
    exit_date DATE,
    days_spent INTEGER,
    
    PRIMARY KEY (trip_id, country_id)
);

CREATE INDEX idx_trip_countries_trip ON trip_countries(trip_id);
CREATE INDEX idx_trip_countries_country ON trip_countries(country_id);

COMMENT ON TABLE trip_countries IS 'Many-to-Many: Ein Trip kann mehrere Länder besuchen';

-- ============================================================================
-- SCHRITT 5: Trips Tabelle anpassen (countries Array entfernen)
-- ============================================================================

-- Alte countries Array Spalte umbenennen (falls vorhanden)
ALTER TABLE trips RENAME COLUMN countries TO countries_old;

-- Optional: Später löschen
-- ALTER TABLE trips DROP COLUMN countries_old;

-- ============================================================================
-- SCHRITT 6: POST_TRIPS Tabelle löschen (wird nicht mehr gebraucht)
-- ============================================================================

-- Erst prüfen ob es Daten gibt die migriert werden müssen
SELECT 
    COUNT(*) as total_entries,
    COUNT(DISTINCT post_id) as unique_posts,
    COUNT(DISTINCT trip_id) as unique_trips
FROM post_trips;

-- Falls Daten vorhanden: Migriere zu posts.trip_id
-- (Nimmt nur den ersten Trip falls ein Post mehrere hat)
UPDATE posts p
SET trip_id = pt.trip_id
FROM (
    SELECT DISTINCT ON (post_id) post_id, trip_id
    FROM post_trips
    ORDER BY post_id, trip_id
) pt
WHERE p.post_id = pt.post_id;

-- Verifizierung: Prüfe wie viele Posts jetzt trip_id haben
SELECT 
    COUNT(*) FILTER (WHERE trip_id IS NOT NULL) as with_trip_id,
    COUNT(*) FILTER (WHERE trip_id IS NULL) as without_trip_id,
    COUNT(*) as total
FROM posts;

-- Jetzt kann post_trips gelöscht werden
DROP TABLE IF EXISTS post_trips;

-- ============================================================================
-- SCHRITT 7: Indizes für neue Struktur
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_posts_country_id ON posts(country_id);
CREATE INDEX IF NOT EXISTS idx_posts_trip_id ON posts(trip_id);

-- ============================================================================
-- SCHRITT 8: VIEWS aktualisieren
-- ============================================================================

-- Timeline View neu erstellen
DROP VIEW IF EXISTS timeline;

CREATE VIEW timeline AS
SELECT 
    p.post_id,
    p.post_date,
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

-- Posts mit Country Info View
CREATE OR REPLACE VIEW posts_with_country AS
SELECT 
    p.*,
    c.name as country_name,
    c.iso_code as country_code,
    c.continent
FROM posts p
LEFT JOIN countries c ON p.country_id = c.country_id;

-- Posts mit Trip Info View
CREATE OR REPLACE VIEW posts_with_trip AS
SELECT 
    p.*,
    t.trip_name,
    t.start_date as trip_start,
    t.end_date as trip_end
FROM posts p
LEFT JOIN trips t ON p.trip_id = t.trip_id;

-- Trips mit Countries View
CREATE OR REPLACE VIEW trips_with_countries AS
SELECT 
    t.*,
    array_agg(c.name ORDER BY tc.visit_order) as countries,
    array_agg(c.iso_code ORDER BY tc.visit_order) as country_codes,
    COUNT(DISTINCT p.post_id) as post_count
FROM trips t
LEFT JOIN trip_countries tc ON t.trip_id = tc.trip_id
LEFT JOIN countries c ON tc.country_id = c.country_id
LEFT JOIN posts p ON t.trip_id = p.trip_id
GROUP BY t.trip_id;

-- Countries mit Posts Count View
CREATE OR REPLACE VIEW countries_with_stats AS
SELECT 
    c.*,
    COUNT(DISTINCT p.post_id) as total_posts,
    MIN(p.post_date) as first_post_date,
    MAX(p.post_date) as last_post_date,
    array_agg(DISTINCT t.trip_name) FILTER (WHERE t.trip_name IS NOT NULL) as trips
FROM countries c
LEFT JOIN posts p ON c.country_id = p.country_id
LEFT JOIN trips t ON p.trip_id = t.trip_id
GROUP BY c.country_id;

-- ============================================================================
-- SCHRITT 9: FUNCTIONS & TRIGGERS aktualisieren
-- ============================================================================

-- Function: Country Stats aktualisieren
CREATE OR REPLACE FUNCTION update_country_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update post_count für betroffenes Land
    UPDATE countries
    SET 
        post_count = (
            SELECT COUNT(*) 
            FROM posts 
            WHERE country_id = NEW.country_id
        ),
        first_visited = (
            SELECT MIN(post_date::DATE) 
            FROM posts 
            WHERE country_id = NEW.country_id
        ),
        last_visited = (
            SELECT MAX(post_date::DATE) 
            FROM posts 
            WHERE country_id = NEW.country_id
        )
    WHERE country_id = NEW.country_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Bei Post Insert/Update Country Stats aktualisieren
DROP TRIGGER IF EXISTS trigger_update_country_stats ON posts;
CREATE TRIGGER trigger_update_country_stats
    AFTER INSERT OR UPDATE OF country_id ON posts
    FOR EACH ROW
    WHEN (NEW.country_id IS NOT NULL)
    EXECUTE FUNCTION update_country_stats();

-- Trigger für countries.updated_at
DROP TRIGGER IF EXISTS countries_updated_at ON countries;
CREATE TRIGGER countries_updated_at
    BEFORE UPDATE ON countries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SCHRITT 10: RLS Policies aktualisieren
-- ============================================================================

-- Countries: Public read access
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON countries;
CREATE POLICY "Public read access" ON countries 
    FOR SELECT USING (true);

-- Trip Countries: Public read access
ALTER TABLE trip_countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON trip_countries;
CREATE POLICY "Public read access" ON trip_countries 
    FOR SELECT USING (true);

-- ============================================================================
-- SCHRITT 11: Beispiel-Daten einfügen (optional)
-- ============================================================================

-- Beispiel Trip mit Ländern erstellen
/*
-- Erst Trip erstellen
INSERT INTO trips (trip_name, start_date, end_date, description)
VALUES (
    'Balkan Bike Tour 2025',
    '2025-06-01',
    '2025-08-15',
    'Cycling through the Balkans'
)
RETURNING trip_id;

-- Dann Länder zu Trip zuordnen (trip_id = 1 als Beispiel)
INSERT INTO trip_countries (trip_id, country_id, visit_order, entry_date, exit_date)
VALUES 
    (1, (SELECT country_id FROM countries WHERE name = 'Slovenia'), 1, '2025-06-01', '2025-06-10'),
    (1, (SELECT country_id FROM countries WHERE name = 'Croatia'), 2, '2025-06-11', '2025-07-15'),
    (1, (SELECT country_id FROM countries WHERE name = 'Italy'), 3, '2025-07-16', '2025-08-15');

-- Posts zu Trip zuordnen
UPDATE posts
SET trip_id = 1
WHERE country_id IN (
    SELECT country_id FROM countries 
    WHERE name IN ('Slovenia', 'Croatia', 'Italy')
)
AND post_date BETWEEN '2025-06-01' AND '2025-08-15';
*/

-- ============================================================================
-- VALIDIERUNG: Prüfe das neue Schema
-- ============================================================================

-- Übersicht Countries
SELECT 
    c.name,
    c.iso_code,
    COUNT(DISTINCT p.post_id) as posts,
    COUNT(DISTINCT t.trip_id) as trips
FROM countries c
LEFT JOIN posts p ON c.country_id = p.country_id
LEFT JOIN trip_countries tc ON c.country_id = tc.country_id
LEFT JOIN trips t ON tc.trip_id = t.trip_id
GROUP BY c.country_id, c.name, c.iso_code
ORDER BY posts DESC;

-- Prüfe ob alle Posts ein Land haben
SELECT 
    COUNT(*) FILTER (WHERE country_id IS NOT NULL) as with_country,
    COUNT(*) FILTER (WHERE country_id IS NULL) as without_country,
    COUNT(*) as total
FROM posts;

-- Prüfe Timeline View
SELECT * FROM timeline LIMIT 5;

-- Prüfe Countries mit Stats
SELECT * FROM countries_with_stats ORDER BY total_posts DESC;

-- ============================================================================
-- CLEANUP (Optional - erst später ausführen wenn alles funktioniert)
-- ============================================================================

/*
-- Alte Backup-Spalten löschen (VORSICHT!)
ALTER TABLE posts DROP COLUMN IF EXISTS country_old;
ALTER TABLE trips DROP COLUMN IF EXISTS countries_old;
*/

-- ============================================================================
-- FERTIG! ✅
-- ============================================================================

-- Zusammenfassung der Änderungen:
-- ✅ countries Tabelle erstellt
-- ✅ posts.country_id hinzugefügt (Foreign Key)
-- ✅ posts.trip_id hinzugefügt (Foreign Key)
-- ✅ trip_countries Tabelle erstellt (Many-to-Many)
-- ✅ post_trips gelöscht (nicht mehr benötigt)
-- ✅ Views aktualisiert
-- ✅ Trigger & Functions erstellt
-- ✅ RLS Policies gesetzt
