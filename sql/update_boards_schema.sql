-- ============================================================================
-- COMMUNITY BOARDS SCHEMA UPDATE
-- ============================================================================

-- 1. CREATE BOARDS TABLE
CREATE TABLE IF NOT EXISTS community_boards (
    board_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL UNIQUE CONSTRAINT board_name_len CHECK (
        char_length(name) BETWEEN 2 AND 50
    ),
    description TEXT CONSTRAINT board_desc_len CHECK (
        char_length(description) <= 150
    ),
    created_by UUID REFERENCES community_visitors (visitor_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE community_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select" ON community_boards;

CREATE POLICY "Allow public select" ON community_boards FOR
SELECT USING (true);

-- 2. SEED DEFAULT BOARD
INSERT INTO
    community_boards (name, description)
VALUES (
        'Commen Ground',
        'Welcome to the campfire! Feel free to share any thought, feeling or impuls.'
    )
ON CONFLICT (name) DO NOTHING;

-- 3. ADD board_id TO IMPULSES
ALTER TABLE community_impulses
ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES community_boards (board_id) ON DELETE CASCADE;

-- 4. BACKFILL EXISTING IMPULSES TO DEFAULT BOARD
UPDATE community_impulses
SET
    board_id = (
        SELECT board_id
        FROM community_boards
        WHERE
            name = 'General Chat'
        LIMIT 1
    )
WHERE
    board_id IS NULL;

-- 5. ENFORCE NOT NULL ON board_id
ALTER TABLE community_impulses ALTER COLUMN board_id SET NOT NULL;