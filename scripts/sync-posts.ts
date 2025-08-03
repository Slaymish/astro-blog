#!/usr/bin/env tsx

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { supabase } from '../src/utils/database.js';
import { createSlug } from '../src/utils/slug.js';

async function syncPosts() {
  if (!supabase) {
    console.error('❌ Supabase client not initialized. Check your environment variables.');
    process.exit(1);
  }

  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const postsDir = path.resolve(__dirname, '../src/content/posts');

    console.log('🔄 Fetching posts from content directory...');
    const postFiles = await getPostFiles(postsDir);

    if (postFiles.length === 0) {
      console.log('📝 No posts found in content directory.');
      return;
    }

    console.log(`📚 Found ${postFiles.length} posts to sync`);

    for (const filePath of postFiles) {
      const raw = await fs.readFile(filePath, 'utf-8');
      const { data, content } = parseFrontmatter(raw);

      if (data.draft) {
        console.log(`⏭️  Skipping draft post: ${data.title}`);
        continue;
      }

      const title = String(data.title);
      // const description = data.description ? String(data.description) : undefined;
      const pubDate = data.pubDate ? new Date(data.pubDate) : new Date();
      const tags = Array.isArray(data.tags) ? data.tags.map(String) : [];
      // const featured = data.featured === true;
      // const draft = data.draft === true;
      // const author = data.author ? String(data.author) : undefined;
      // const image = data.image ? String(data.image) : undefined;
      // const imageAlt = data.imageAlt ? String(data.imageAlt) : undefined;
      const slug = data.slug ? String(data.slug) : createSlug(title);

      console.log(`🔄 Syncing: ${title}`);

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .upsert(
          {
            title,
            slug,
            content,
            created_at: pubDate.toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        )
        .select()
        .single();

      if (postError) {
        console.error(`❌ Error syncing post "${title}":`, postError);
        continue;
      }

      if (tags.length > 0) {
        console.log(`🏷️  Processing ${tags.length} tags for: ${title}`);

        for (const tagName of tags) {
          const tagSlug = createSlug(tagName);

          const { data: tagData, error: tagError } = await supabase
            .from('tags')
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
            .from('post_tags')
            .upsert(
              {
                post_id: postData.id,
                tag_id: tagData.id,
              },
              { onConflict: 'post_id,tag_id' }
            );

          if (linkError) {
            console.error(`❌ Error linking tag "${tagName}" to post:`, linkError);
          }
        }
      }

      console.log(`✅ Successfully synced: ${title}`);
    }

    console.log('🎉 Post sync completed successfully!');
  } catch (error) {
    console.error('❌ Error during post sync:', error);
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

async function getPostFiles(dir: string): Promise<string[]> {
  let files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await getPostFiles(fullPath));
    } else if (entry.isFile() && (fullPath.endsWith('.md') || fullPath.endsWith('.mdx'))) {
      files.push(fullPath);
    }
  }
  return files;
}

// Run the sync
syncPosts();