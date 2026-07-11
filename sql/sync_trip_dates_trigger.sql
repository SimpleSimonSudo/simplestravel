-- Migration: Sync Trip Dates Trigger and One-time Update

-- 1. Ensure start_date is nullable to support trips without posts
ALTER TABLE trips ALTER COLUMN start_date DROP NOT NULL;

-- 2. Create/replace trigger function to update trips.start_date and trips.end_date
CREATE OR REPLACE FUNCTION sync_trip_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the old trip dates (if any and if the trip changed or was removed)
    IF (TG_OP = 'UPDATE' OR TG_OP = 'DELETE') 
        AND OLD.trip_id IS NOT NULL 
        AND (TG_OP = 'DELETE' OR NEW.trip_id IS NULL OR OLD.trip_id != NEW.trip_id) 
    THEN
        UPDATE trips
        SET 
            start_date = (
                SELECT MIN(actual_date::DATE)
                FROM posts
                WHERE trip_id = OLD.trip_id
            ),
            end_date = (
                SELECT MAX(actual_date::DATE)
                FROM posts
                WHERE trip_id = OLD.trip_id
            )
        WHERE trip_id = OLD.trip_id;
    END IF;

    -- Update the new trip dates (if any)
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') 
        AND NEW.trip_id IS NOT NULL 
    THEN
        UPDATE trips
        SET 
            start_date = (
                SELECT MIN(actual_date::DATE)
                FROM posts
                WHERE trip_id = NEW.trip_id
            ),
            end_date = (
                SELECT MAX(actual_date::DATE)
                FROM posts
                WHERE trip_id = NEW.trip_id
            )
        WHERE trip_id = NEW.trip_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Drop existing trigger if it exists, and create it
DROP TRIGGER IF EXISTS trigger_sync_trip_dates ON posts;
CREATE TRIGGER trigger_sync_trip_dates
AFTER INSERT OR DELETE OR UPDATE OF trip_id, actual_date ON posts
FOR EACH ROW
EXECUTE FUNCTION sync_trip_dates();

-- 4. One-time update to synchronize existing trips
UPDATE trips t
SET 
    start_date = (
        SELECT MIN(actual_date::DATE)
        FROM posts
        WHERE trip_id = t.trip_id
    ),
    end_date = (
        SELECT MAX(actual_date::DATE)
        FROM posts
        WHERE trip_id = t.trip_id
    );
