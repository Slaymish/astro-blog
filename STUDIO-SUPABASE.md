# Studio Supabase Integration

This document explains how studio essays are synced to Supabase.

## Database Schema

### Tables Created

1. **studio_essays** - Main table for studio essays
   - `id` - Primary key
   - `title` - Essay title
   - `subtitle` - Optional subtitle
   - `abstract` - Brief abstract (required)
   - `slug` - URL-friendly identifier (unique)
   - `content` - Full MDX content
   - `palette` - Color scheme (noir, sepia, forest, ocean, ember)
   - `motion` - Animation profile (minimal, moderate, expressive)
   - `audio` - Optional ambient audio filename
   - `status` - Publication status (draft, published, archived)
   - `published` - Publication date
   - `updated` - Last updated date
   - `created_at` - Record creation timestamp
   - `updated_at` - Record update timestamp

2. **studio_tags** - Tags for categorizing essays
   - `id` - Primary key
   - `name` - Display name
   - `slug` - URL-friendly identifier (unique)

3. **studio_essay_tags** - Join table for many-to-many relationship
   - `essay_id` - Foreign key to studio_essays
   - `tag_id` - Foreign key to studio_tags

## Setup

### 1. Run the Migration

First, apply the migration to create the tables in your Supabase database:

```bash
# Using Supabase CLI
supabase db push

# Or apply the SQL directly in your Supabase dashboard
# Copy contents of: supabase/migrations/20251029_studio_essays.sql
```

### 2. Environment Variables

Ensure you have these set in your `.env` file:

```env
SUPABASE_DATABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### 3. Sync Essays

Run the sync script to upload your studio essays:

```bash
# Sync only studio essays
npm run sync:studio

# Sync both blog posts and studio essays
npm run sync:all
```

## How It Works

The `sync-studio.ts` script:

1. **Reads MDX Files** - Scans `src/content/studio/` for `.mdx` files
2. **Parses Frontmatter** - Extracts metadata from YAML frontmatter
3. **Filters by Status** - Only syncs essays with `status: "published"`
4. **Upserts Essays** - Creates or updates essays in Supabase (matching by slug)
5. **Syncs Tags** - Creates tags and links them to essays
6. **Cleanup** - Removes essays from Supabase that no longer exist locally

## Deployment

The build process automatically syncs essays before building:

```bash
npm run build
```

This runs: `sync:posts` → `sync:studio` → `astro check` → `astro build`

## Querying Essays from Supabase

If you want to fetch essays from Supabase instead of the local content collection:

```typescript
import { supabase } from '@/utils/database';

// Get all published essays
const { data: essays } = await supabase
  .from('studio_essays')
  .select('*')
  .eq('status', 'published')
  .order('published', { ascending: false });

// Get essay by slug
const { data: essay } = await supabase
  .from('studio_essays')
  .select('*')
  .eq('slug', 'demo-essay')
  .single();

// Get essays with tags
const { data: essay } = await supabase
  .from('studio_essays')
  .select(`
    *,
    studio_essay_tags (
      studio_tags (
        name,
        slug
      )
    )
  `)
  .eq('slug', 'demo-essay')
  .single();
```

## Notes

- **Separate from Blog Posts** - Studio essays use their own tables, completely independent from the blog posts system
- **Draft Protection** - Essays with `status: "draft"` or `status: "archived"` won't be synced
- **Slug Uniqueness** - Each essay must have a unique slug
- **Content Backup** - Full MDX content is stored in Supabase as a backup
- **Automatic Cleanup** - Deleted local essays are automatically removed from Supabase

## Troubleshooting

**TypeScript errors about table names:**
- The `supabase/types.ts` file has been updated with the new table definitions
- Restart your TypeScript server or VS Code if you see type errors

**Essays not syncing:**
- Verify `status: "published"` in essay frontmatter
- Check environment variables are set
- Run with verbose logging: `tsx scripts/sync-studio.ts`

**Migration errors:**
- Ensure you're connected to the correct Supabase project
- Check that table names don't conflict with existing tables
