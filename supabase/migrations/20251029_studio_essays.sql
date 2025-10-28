-- Studio essays table
CREATE TABLE studio_essays (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    abstract TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    palette TEXT NOT NULL DEFAULT 'noir',
    motion TEXT NOT NULL DEFAULT 'moderate',
    audio TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    published TIMESTAMPTZ,
    updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Studio tags table (separate from blog tags)
CREATE TABLE studio_tags (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL
);

-- Join table for many-to-many relationship
CREATE TABLE studio_essay_tags (
    essay_id INTEGER NOT NULL REFERENCES studio_essays(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES studio_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (essay_id, tag_id)
);

-- Index for performance
CREATE INDEX idx_studio_essays_slug ON studio_essays(slug);
CREATE INDEX idx_studio_essays_status ON studio_essays(status);
CREATE INDEX idx_studio_essays_published ON studio_essays(published);
