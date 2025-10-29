#!/usr/bin/env tsx

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { supabase } from '../src/utils/database.js';
import { createSlug } from '../src/utils/slug.js';

async function syncStudioAphorisms() {
  if (!supabase) {
    console.warn('⚠️  Supabase client not initialized. Skipping studio sync.');
    console.warn('This is fine for local builds that use content collections.');
    process.exit(0); // Exit successfully instead of failing
  }

  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const studioDir = path.resolve(__dirname, '../src/content/studio');

    console.log('🔄 Fetching studio aphorisms from content directory...');
    const aphorismFiles = await getAphorismFiles(studioDir);

    if (aphorismFiles.length === 0) {
      console.log('📝 No studio aphorisms found in content directory.');
      return;
    }

    console.log(`📚 Found ${aphorismFiles.length} aphorisms to sync`);

    // Track slugs of local aphorisms for cleanup
    const localAphorismSlugs = new Set<string>();

    for (const filePath of aphorismFiles) {
      const raw = await fs.readFile(filePath, 'utf-8');
      const { data, content } = parseFrontmatter(raw);

      // Skip drafts unless explicitly published
      if (data.status !== 'published') {
        console.log(`⏭️  Skipping ${data.status || 'draft'} aphorism: ${data.title}`);
        continue;
      }

      const title = String(data.title);
      const subtitle = data.subtitle ? String(data.subtitle) : null;
      const text = data.text ? String(data.text) : null;
      const palette = data.palette ? String(data.palette) : 'noir';
      const motion = data.motion ? String(data.motion) : 'moderate';
      const audio = data.audio ? String(data.audio) : null;
      const status = String(data.status);
      const published = data.published ? new Date(data.published) : new Date();
      const updated = data.updated ? new Date(data.updated) : new Date();
      const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
      const slug = data.slug ? String(data.slug) : createSlug(title);

      // Track this aphorism's slug
      localAphorismSlugs.add(slug);

      console.log(`🔄 Syncing: ${title}`);

      const { data: aphorismData, error: aphorismError } = await supabase
        .from('studio_aphorisms')
        .upsert(
          {
            title,
            subtitle,
            text,
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

      if (aphorismError) {
        console.error(`❌ Error syncing aphorism "${title}":`, aphorismError);
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
            .from('studio_aphorism_tags')
            .upsert(
              {
                aphorism_id: aphorismData.id,
                tag_id: tagData.id,
              },
              { onConflict: 'aphorism_id,tag_id' }
            );

          if (linkError) {
            console.error(`❌ Error linking tag "${tagName}" to aphorism:`, linkError);
          }
        }
      }

      console.log(`✅ Successfully synced: ${title}`);
    }

    // Clean up aphorisms that no longer exist locally
    console.log('🧹 Cleaning up deleted aphorisms from Supabase...');
    const { data: existingAphorisms, error: fetchError } = await supabase
      .from('studio_aphorisms')
      .select('id, slug, title');

    if (fetchError) {
      console.error('❌ Error fetching existing aphorisms:', fetchError);
    } else if (existingAphorisms) {
      for (const aphorism of existingAphorisms) {
        if (!localAphorismSlugs.has(aphorism.slug)) {
          console.log(`🗑️  Deleting removed aphorism: ${aphorism.title}`);
          
          // Delete aphorism_tags relationships first
          const { error: tagDeleteError } = await supabase
            .from('studio_aphorism_tags')
            .delete()
            .eq('aphorism_id', aphorism.id);

          if (tagDeleteError) {
            console.error(`❌ Error deleting tags for aphorism "${aphorism.title}":`, tagDeleteError);
          }

          // Delete the aphorism
          const { error: aphorismDeleteError } = await supabase
            .from('studio_aphorisms')
            .delete()
            .eq('id', aphorism.id);

          if (aphorismDeleteError) {
            console.error(`❌ Error deleting aphorism "${aphorism.title}":`, aphorismDeleteError);
          } else {
            console.log(`✅ Successfully deleted: ${aphorism.title}`);
          }
        }
      }
    }

    console.log('🎉 Studio aphorism sync completed successfully!');
  } catch (error) {
    console.error('❌ Error during studio aphorism sync:', error);
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

async function getAphorismFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(await getAphorismFiles(fullPath));
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
syncStudioAphorisms();
