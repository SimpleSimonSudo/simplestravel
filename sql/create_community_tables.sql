-- ============================================================================
-- COMMUNITY TABLES & POLICIES
-- ============================================================================

-- 1. VISITORS TABLE (community_visitors)
CREATE TABLE IF NOT EXISTS community_visitors (
    visitor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT NOT NULL,
    recovery_code TEXT UNIQUE NOT NULL,
    visit_count INTEGER DEFAULT 1,
    is_banned BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT name_length CHECK (char_length(display_name) BETWEEN 2 AND 30)
);

CREATE INDEX IF NOT EXISTS idx_comm_visitors_recovery ON community_visitors(recovery_code);

-- 2. IMPULSES TABLE (community_impulses)
CREATE TABLE IF NOT EXISTS community_impulses (
    impulse_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id UUID NOT NULL REFERENCES community_visitors(visitor_id) ON DELETE CASCADE,
    content TEXT NOT NULL CONSTRAINT content_len CHECK (char_length(content) BETWEEN 3 AND 300),
    post_id TEXT REFERENCES posts(post_id) ON DELETE SET NULL,
    country_id BIGINT REFERENCES countries(country_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_impulses_created ON community_impulses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_impulses_post ON community_impulses(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comm_impulses_country ON community_impulses(country_id) WHERE country_id IS NOT NULL;

-- 3. REPLIES TABLE (community_replies)
CREATE TABLE IF NOT EXISTS community_replies (
    reply_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    impulse_id UUID NOT NULL REFERENCES community_impulses(impulse_id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES community_visitors(visitor_id) ON DELETE CASCADE,
    content TEXT NOT NULL CONSTRAINT reply_len CHECK (char_length(content) BETWEEN 1 AND 200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comm_replies_impulse ON community_replies(impulse_id);

-- 4. REACTIONS TABLE (community_reactions)
CREATE TABLE IF NOT EXISTS community_reactions (
    reaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    impulse_id UUID NOT NULL REFERENCES community_impulses(impulse_id) ON DELETE CASCADE,
    visitor_id UUID NOT NULL REFERENCES community_visitors(visitor_id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart', 'sparkles', 'globe', 'funny')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_comm_visitor_reaction UNIQUE (impulse_id, visitor_id, reaction_type)
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE community_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_impulses ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_reactions ENABLE ROW LEVEL SECURITY;

-- Policies for public reading
DROP POLICY IF EXISTS "Allow public select" ON community_visitors;
CREATE POLICY "Allow public select" ON community_visitors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select" ON community_impulses;
CREATE POLICY "Allow public select" ON community_impulses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select" ON community_replies;
CREATE POLICY "Allow public select" ON community_replies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public select" ON community_reactions;
CREATE POLICY "Allow public select" ON community_reactions FOR SELECT USING (true);
