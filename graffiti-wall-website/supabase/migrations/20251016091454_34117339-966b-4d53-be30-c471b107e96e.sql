-- Add is_main column to displays table to identify the main billboard
ALTER TABLE displays ADD COLUMN is_main BOOLEAN NOT NULL DEFAULT false;

-- Create a partial unique index to ensure only one main billboard
-- This allows only one row with is_main = true
CREATE UNIQUE INDEX displays_only_one_main_idx ON displays (is_main) WHERE is_main = true;

-- Set the first display as the main billboard
UPDATE displays 
SET is_main = true 
WHERE id = (SELECT id FROM displays ORDER BY created_at LIMIT 1);