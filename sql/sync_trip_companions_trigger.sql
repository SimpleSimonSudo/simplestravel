-- Migration: Sync Trip Companions Trigger and One-time Update

-- 1. Create/replace trigger function to update trips.companions
CREATE OR REPLACE FUNCTION sync_trip_companions()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the old trip companions (if any and if the trip changed or was removed)
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') 
        AND OLD.trip_id IS NOT NULL 
        AND (TG_OP = 'DELETE' OR NEW.trip_id IS NULL OR OLD.trip_id != NEW.trip_id) 
    THEN
        UPDATE trips
        SET companions = (
            SELECT array_agg(DISTINCT c)
            FROM (
                SELECT unnest(companions) AS c
                FROM posts
                WHERE trip_id = OLD.trip_id AND companions IS NOT NULL
            ) sub
        )
        WHERE trip_id = OLD.trip_id;
    END IF;

    -- Update the new trip companions (if any)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') 
        AND NEW.trip_id IS NOT NULL 
    THEN
        UPDATE trips
        SET companions = (
            SELECT array_agg(DISTINCT c)
            FROM (
                SELECT unnest(companions) AS c
                FROM posts
                WHERE trip_id = NEW.trip_id AND companions IS NOT NULL
            ) sub
        )
        WHERE trip_id = NEW.trip_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop existing trigger if it exists, and create it
DROP TRIGGER IF EXISTS trigger_sync_trip_companions ON posts;
CREATE TRIGGER trigger_sync_trip_companions
AFTER INSERT OR DELETE OR UPDATE OF trip_id, companions ON posts
FOR EACH ROW
EXECUTE FUNCTION sync_trip_companions();

-- 3. One-time update to synchronize existing trips
UPDATE trips t
SET companions = (
    SELECT array_agg(DISTINCT c)
    FROM (
        SELECT unnest(companions) AS c
        FROM posts
        WHERE trip_id = t.trip_id AND companions IS NOT NULL
    ) sub
);
