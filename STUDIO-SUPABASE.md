# Studio Supabase Integration

This document explains how studio aphorisms are synced to Supabase.

## Database Schema

### Tables Created

1. **studio_aphorisms** - Main table for studio aphorisms
   - `id` - Primary key
   - `title` - Aphorism title
   - `subtitle` - Optional subtitle or categorization
   - `text` - Optional: short aphorism text (for very brief aphorisms)
   - `abstract` - Optional: brief context or expansion (nullable)
   - `slug` - URL-friendly identifier (unique)
   - `content` - Full MDX content
   - `palette` - Color scheme (noir, sepia, forest, ocean, ember)
   - `motion` - Animation profile (subtle, moderate, expressive)
   - `audio` - Optional ambient audio filename
   - `status` - Publication status (draft, published)
   - `published` - Publication date
   - `updated` - Last updated date
   - `created_at` - Record creation timestamp
   - `updated_at` - Record update timestamp

2. **studio_tags** - Tags for categorizing aphorisms
   - `id` - Primary key
   - `name` - Display name
   - `slug` - URL-friendly identifier (unique)

3. **studio_aphorism_tags** - Join table for many-to-many relationship
   - `aphorism_id` - Foreign key to studio_aphorisms
   - `tag_id` - Foreign key to studio_tags

## Setup

### 1. Run the Migrations

First, apply the migrations to create and update the tables in your Supabase database:

```bash
# Using Supabase CLI
supabase db push

# Or apply the SQL directly in your Supabase dashboard
# 1. Copy contents of: supabase/migrations/20251029_studio_essays.sql
# 2. Copy contents of: supabase/migrations/20251030_rename_essays_to_aphorisms.sql
```

### 2. Environment Variables

Ensure you have these set in your `.env` file:

```env
SUPABASE_DATABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### 3. Sync Aphorisms

Run the sync script to upload your studio aphorisms:

```bash
# Sync only studio aphorisms
npm run sync:studio

# Sync both blog posts and studio aphorisms
npm run sync:all
```

## How It Works

The `sync-studio.ts` script:

1. **Reads MDX Files** - Scans `src/content/studio/` for `.mdx` files
2. **Parses Frontmatter** - Extracts metadata from YAML frontmatter
3. **Filters by Status** - Only syncs aphorisms with `status: "published"`
4. **Upserts Aphorisms** - Creates or updates aphorisms in Supabase (matching by slug)
5. **Syncs Tags** - Creates tags and links them to aphorisms
6. **Cleanup** - Removes aphorisms from Supabase that no longer exist locally

## Deployment

The build process automatically syncs aphorisms before building:

```bash
npm run build
```

This runs: `sync:posts` → `sync:studio` → `astro check` → `astro build`

## Querying Aphorisms from Supabase

If you want to fetch aphorisms from Supabase instead of the local content collection:

```typescript
import { supabase } from '@/utils/database';

// Get all published aphorisms
const { data: aphorisms } = await supabase
  .from('studio_aphorisms')
  .select('*')
  .eq('status', 'published')
  .order('published', { ascending: false });

// Get aphorism by slug
const { data: aphorism } = await supabase
  .from('studio_aphorisms')
  .select('*')
  .eq('slug', 'demo-aphorism')
  .single();

// Get aphorisms with tags
const { data: aphorism } = await supabase
  .from('studio_aphorisms')
  .select(`
    *,
    studio_aphorism_tags (
      studio_tags (
        name,
        slug
      )
    )
  `)
  .eq('slug', 'demo-aphorism')
  .single();
```

## Notes

- **Separate from Blog Posts** - Studio aphorisms use their own tables, completely independent from the blog posts system
- **Draft Protection** - Aphorisms with `status: "draft"` won't be synced
- **Slug Uniqueness** - Each aphorism must have a unique slug
- **Content Backup** - Full MDX content is stored in Supabase as a backup
- **Automatic Cleanup** - Deleted local aphorisms are automatically removed from Supabase
- **Aphoristic Format** - Content is designed to be short, self-contained, and impactful

## Troubleshooting

**TypeScript errors about table names:**
- The `supabase/types.ts` file has been updated with the new table definitions
- Restart your TypeScript server or VS Code if you see type errors

**Aphorisms not syncing:**
- Verify `status: "published"` in aphorism frontmatter
- Check environment variables are set
- Run with verbose logging: `tsx scripts/sync-studio.ts`

**Migration errors:**
- Ensure you're connected to the correct Supabase project
- Run both migrations in order: `20251029_studio_essays.sql` then `20251030_rename_essays_to_aphorisms.sql`
- Check that table names don't conflict with existing tables
