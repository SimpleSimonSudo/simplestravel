-- Migration: Add tags column to media table for individual image/media tagging
ALTER TABLE media ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create GIN index for efficient filtering and searching of tags
CREATE INDEX IF NOT EXISTS idx_media_tags ON media USING GIN (tags) WHERE tags IS NOT NULL;
