-- Rename studio_essays to studio_aphorisms and adjust schema for aphoristic content
-- This migration transforms the essay-focused structure into one optimized for short, aphoristic writing

-- Rename main table
ALTER TABLE studio_essays RENAME TO studio_aphorisms;

-- Rename join table
ALTER TABLE studio_essay_tags RENAME TO studio_aphorism_tags;

-- Update foreign key column name in join table
ALTER TABLE studio_aphorism_tags RENAME COLUMN essay_id TO aphorism_id;

-- Drop old indexes
DROP INDEX IF EXISTS idx_studio_essays_slug;
DROP INDEX IF EXISTS idx_studio_essays_status;
DROP INDEX IF EXISTS idx_studio_essays_published;

-- Create new indexes with updated names
CREATE INDEX idx_studio_aphorisms_slug ON studio_aphorisms(slug);
CREATE INDEX idx_studio_aphorisms_status ON studio_aphorisms(status);
CREATE INDEX idx_studio_aphorisms_published ON studio_aphorisms(published);

-- Make subtitle and abstract optional (aphorisms are self-contained)
ALTER TABLE studio_aphorisms ALTER COLUMN abstract DROP NOT NULL;

-- Add a brief aphorism text field (optional, for when content is just a line or two)
ALTER TABLE studio_aphorisms ADD COLUMN text TEXT;

-- Update constraint name in join table
ALTER TABLE studio_aphorism_tags 
  DROP CONSTRAINT studio_essay_tags_pkey;

ALTER TABLE studio_aphorism_tags 
  ADD PRIMARY KEY (aphorism_id, tag_id);

-- Update foreign key constraint
ALTER TABLE studio_aphorism_tags 
  DROP CONSTRAINT studio_essay_tags_essay_id_fkey;

ALTER TABLE studio_aphorism_tags 
  ADD CONSTRAINT studio_aphorism_tags_aphorism_id_fkey 
  FOREIGN KEY (aphorism_id) REFERENCES studio_aphorisms(id) ON DELETE CASCADE;

-- Rename tag constraint as well for consistency
ALTER TABLE studio_aphorism_tags 
  DROP CONSTRAINT studio_essay_tags_tag_id_fkey;

ALTER TABLE studio_aphorism_tags 
  ADD CONSTRAINT studio_aphorism_tags_tag_id_fkey 
  FOREIGN KEY (tag_id) REFERENCES studio_tags(id) ON DELETE CASCADE;

-- Add comment explaining the structure
COMMENT ON TABLE studio_aphorisms IS 'Short, aphoristic writings - focused, self-contained thoughts';
COMMENT ON COLUMN studio_aphorisms.text IS 'Optional: short aphorism text when content field contains full MDX';
COMMENT ON COLUMN studio_aphorisms.abstract IS 'Optional: brief context or expansion of the aphorism';
COMMENT ON COLUMN studio_aphorisms.subtitle IS 'Optional: secondary title or categorization';
