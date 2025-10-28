#!/usr/bin/env tsx

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { supabase } from '../src/utils/database.js';
import { createSlug } from '../src/utils/slug.js';

async function syncStudioEssays() {
  if (!supabase) {
    console.warn('⚠️  Supabase client not initialized. Skipping studio sync.');
    console.warn('This is fine for local builds that use content collections.');
    process.exit(0); // Exit successfully instead of failing
  }

  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const studioDir = path.resolve(__dirname, '../src/content/studio');

    console.log('🔄 Fetching studio essays from content directory...');
    const essayFiles = await getEssayFiles(studioDir);

    if (essayFiles.length === 0) {
      console.log('📝 No studio essays found in content directory.');
      return;
    }

    console.log(`📚 Found ${essayFiles.length} essays to sync`);

    // Track slugs of local essays for cleanup
    const localEssaySlugs = new Set<string>();

    for (const filePath of essayFiles) {
      const raw = await fs.readFile(filePath, 'utf-8');
      const { data, content } = parseFrontmatter(raw);

      // Skip drafts unless explicitly published
      if (data.status !== 'published') {
        console.log(`⏭️  Skipping ${data.status || 'draft'} essay: ${data.title}`);
        continue;
      }

      const title = String(data.title);
      const subtitle = data.subtitle ? String(data.subtitle) : null;
      const abstract = String(data.abstract);
      const palette = data.palette ? String(data.palette) : 'noir';
      const motion = data.motion ? String(data.motion) : 'moderate';
      const audio = data.audio ? String(data.audio) : null;
      const status = String(data.status);
      const published = data.published ? new Date(data.published) : new Date();
      const updated = data.updated ? new Date(data.updated) : new Date();
      const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
      const slug = data.slug ? String(data.slug) : createSlug(title);

      // Track this essay's slug
      localEssaySlugs.add(slug);

      console.log(`🔄 Syncing: ${title}`);

      const { data: essayData, error: essayError } = await supabase
        .from('studio_essays')
        .upsert(
          {
            title,
            subtitle,
            abstract,
            slug,
            content,
            palette,
            motion,
            audio,
            status,
            published: published.toISOString(),
            updated: updated.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        )
        .select()
        .single();

      if (essayError) {
        console.error(`❌ Error syncing essay "${title}":`, essayError);
        continue;
      }

      if (tags.length > 0) {
        console.log(`🏷️  Processing ${tags.length} tags for: ${title}`);

        for (const tagName of tags) {
          const tagSlug = createSlug(tagName);

          const { data: tagData, error: tagError } = await supabase
            .from('studio_tags')
            .upsert(
              {
                name: tagName,
                slug: tagSlug,
              },
              { onConflict: 'slug' }
            )
            .select()
            .single();

          if (tagError) {
            console.error(`❌ Error creating tag "${tagName}":`, tagError);
            continue;
          }

          const { error: linkError } = await supabase
            .from('studio_essay_tags')
            .upsert(
              {
                essay_id: essayData.id,
                tag_id: tagData.id,
              },
              { onConflict: 'essay_id,tag_id' }
            );

          if (linkError) {
            console.error(`❌ Error linking tag "${tagName}" to essay:`, linkError);
          }
        }
      }

      console.log(`✅ Successfully synced: ${title}`);
    }

    // Clean up essays that no longer exist locally
    console.log('🧹 Cleaning up deleted essays from Supabase...');
    const { data: existingEssays, error: fetchError } = await supabase
      .from('studio_essays')
      .select('id, slug, title');

    if (fetchError) {
      console.error('❌ Error fetching existing essays:', fetchError);
    } else if (existingEssays) {
      for (const essay of existingEssays) {
        if (!localEssaySlugs.has(essay.slug)) {
          console.log(`🗑️  Deleting removed essay: ${essay.title}`);
          
          // Delete essay_tags relationships first
          const { error: tagDeleteError } = await supabase
            .from('studio_essay_tags')
            .delete()
            .eq('essay_id', essay.id);

          if (tagDeleteError) {
            console.error(`❌ Error deleting tags for essay "${essay.title}":`, tagDeleteError);
          }

          // Delete the essay
          const { error: essayDeleteError } = await supabase
            .from('studio_essays')
            .delete()
            .eq('id', essay.id);

          if (essayDeleteError) {
            console.error(`❌ Error deleting essay "${essay.title}":`, essayDeleteError);
          } else {
            console.log(`✅ Successfully deleted: ${essay.title}`);
          }
        }
      }
    }

    console.log('🎉 Studio essay sync completed successfully!');
  } catch (error) {
    console.error('❌ Error during studio essay sync:', error);
    process.exit(1);
  }
}

function parseFrontmatter(raw: string) {
  if (!raw.startsWith('---')) {
    return { data: {}, content: raw };
  }
  const endIndex = raw.indexOf('---', 3);
  if (endIndex === -1) {
    return { data: {}, content: raw };
  }
  const fm = raw.slice(3, endIndex).trim();
  const content = raw.slice(endIndex + 3).trimStart();
  let data: any;
  try {
    data = yaml.load(fm) || {};
  } catch (e) {
    console.error('❌ Error parsing YAML frontmatter:', e);
    data = {};
  }
  return { data, content };
}

async function getEssayFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(await getEssayFiles(fullPath));
      } else if (entry.isFile() && fullPath.endsWith('.mdx')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dir}:`, error);
  }
  return files;
}

// Run the sync
syncStudioEssays();
