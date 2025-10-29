# Studio Refactor: Essays → Aphorisms

## Summary

The Studio subsystem has been refactored from an essay-focused system to one optimized for **aphorisms** - short, self-contained, impactful thoughts. This change affects the entire stack from database to UI.

## What Changed

### 1. Database Schema (Supabase)
- **Migration**: `supabase/migrations/20251030_rename_essays_to_aphorisms.sql`
- Tables renamed:
  - `studio_essays` → `studio_aphorisms`
  - `studio_essay_tags` → `studio_aphorism_tags`
- Schema changes:
  - `abstract` field now nullable (aphorisms may not need expansion)
  - Added `text` field for ultra-short aphorisms (one-liners)
  - Foreign keys updated to reference `aphorism_id`
- **Types**: `supabase/types.ts` updated with new table names and structure
  - Added `AphorismWithTags` type

### 2. Content Collection Schema
- **File**: `src/content.config.ts`
- Changes:
  - Removed required `abstract` field
  - Added optional `text` field for short aphorism text
  - Schema now focuses on minimal, essential metadata

### 3. Sync Script
- **File**: `scripts/sync-studio.ts`
- All references updated:
  - Functions renamed: `syncStudioEssays` → `syncStudioAphorisms`
  - Variables: `essay` → `aphorism`, `essayFiles` → `aphorismFiles`
  - Database tables: uses `studio_aphorisms` and `studio_aphorism_tags`
  - Console logs updated to reference aphorisms

### 4. Studio Pages
- **Files**: 
  - `src/pages/studio/index.astro` - Landing page
  - `src/pages/studio/[slug].astro` - Individual aphorism page

- Changes:
  - Variables: `essay` → `aphorism`
  - CSS classes: `.essay-*` → `.aphorism-*`
  - UI text: "essays" → "aphorisms"
  - New manifesto text emphasizing brevity and focus
  - Added `.aphorism-text-display` for displaying the `text` field
  - Simplified layout (less margin space for components)

### 5. Documentation
- **STUDIO-SUPABASE.md**: Updated all references and examples
- **STUDIO-STYLE-GUIDE.md**: 
  - Added "Aphorism Design Principles" section
  - Guidance on component usage (use sparingly)
  - Updated typography descriptions
  - Adjusted layout measurements for shorter content
- **.github/copilot-instructions.md**: Updated to reflect aphorism focus

### 6. Example Content
- **New file**: `src/content/studio/on-motion-and-meaning-simple.mdx`
  - Demonstrates proper aphoristic style
  - Short, focused, no complex components
  - Uses `text` field for the core aphorism

## Design Philosophy

### Before (Essays)
- Long-form writing with elaborate layout
- Heavy use of margin notes, footnotes, dialectic tabs
- Abstract required for all content
- Designed for exploration and argumentation

### After (Aphorisms)
- Short, distilled thoughts (1-3 paragraphs typically)
- Components available but used sparingly
- Optional `text` field for one-liner aphorisms
- Designed for impact and clarity

## Component Usage Guidelines

**For Aphorisms:**
- ❌ **Barely**: `DialecticTabs`, `ClaimCounter` (too essay-like)
- ⚠️ **Rarely**: `MarginNote`, `Footnote` (only if essential)
- ✓ **Sometimes**: `PullQuote` (to emphasize core insight)
- ✓ **As needed**: `AudioPlayer` (if it enhances the thought)

## Migration Path

If you have existing essay-style content in Studio:

1. **Apply the migration**: Run both SQL migrations in Supabase
2. **Update frontmatter**: 
   - Remove `abstract` (or keep it if you want)
   - Add `text` field for ultra-short aphorisms
3. **Simplify content**: 
   - Condense to essential points
   - Remove or reduce component usage
   - Aim for self-contained thoughts
4. **Re-sync**: Run `npm run sync:studio`

## Technical Notes

### TypeScript Caching
If you see TypeScript errors about missing `text` property:
- Restart your TypeScript server
- Restart VS Code
- Run `npm run build` to regenerate types

### Database Migration
Run migrations in order:
1. `20251029_studio_essays.sql` (creates original tables)
2. `20251030_rename_essays_to_aphorisms.sql` (renames and modifies)

### Backward Compatibility
- Old `on-motion-and-meaning.mdx` file still exists (can be removed)
- New simplified version at `on-motion-and-meaning-simple.mdx`
- Components still work but are discouraged for most aphorisms

## Example Aphorism Frontmatter

```yaml
---
title: "On Motion and Meaning"
text: "Motion is punctuation. Use it to make the sentence legible."
palette: "noir"
motion: "subtle"
published: 2025-10-28
tags: ["design", "interaction"]
status: "published"
---
```

## Key Files Modified

- `supabase/migrations/20251030_rename_essays_to_aphorisms.sql` (new)
- `supabase/types.ts`
- `src/content.config.ts`
- `src/content/studio/on-motion-and-meaning-simple.mdx` (new)
- `scripts/sync-studio.ts`
- `src/pages/studio/index.astro`
- `src/pages/studio/[slug].astro`
- `STUDIO-SUPABASE.md`
- `STUDIO-STYLE-GUIDE.md`
- `.github/copilot-instructions.md`
- `src/content/config.ts` (removed - was unused)

## Next Steps

1. Apply the database migration in Supabase
2. Restart your development server
3. Test the studio pages locally
4. Create new aphorisms following the simplified format
5. Consider removing or simplifying existing content to match the aphoristic style
