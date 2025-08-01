#!/usr/bin/env tsx

import { getCollection } from 'astro:content';
import { supabase } from '../src/utils/database.js';
import { createSlug } from '../src/utils/slug.js';

interface PostData {
  title: string;
  description?: string;
  pubDate: Date;
  tags: string[];
  featured: boolean;
  draft: boolean;
  author?: string;
  image?: string;
  imageAlt?: string;
}

interface PostEntry {
  id: string;
  slug: string;
  body: string;
  data: PostData;
}

async function syncPosts() {
  if (!supabase) {
    console.error('❌ Supabase client not initialized. Check your environment variables.');
    process.exit(1);
  }

  try {
    console.log('🔄 Fetching posts from content collection...');
    const posts = await getCollection('posts') as PostEntry[];
    
    if (posts.length === 0) {
      console.log('📝 No posts found in content collection.');
      return;
    }

    console.log(`📚 Found ${posts.length} posts to sync`);

    for (const post of posts) {
      // Skip draft posts
      if (post.data.draft) {
        console.log(`⏭️  Skipping draft post: ${post.data.title}`);
        continue;
      }

      const slug = post.slug || createSlug(post.data.title);
      
      console.log(`🔄 Syncing: ${post.data.title}`);

      // Upsert post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .upsert({
          title: post.data.title,
          slug: slug,
          content: post.body,
          created_at: post.data.pubDate.toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'slug'
        })
        .select()
        .single();

      if (postError) {
        console.error(`❌ Error syncing post "${post.data.title}":`, postError);
        continue;
      }

      // Handle tags
      if (post.data.tags && post.data.tags.length > 0) {
        console.log(`🏷️  Processing ${post.data.tags.length} tags for: ${post.data.title}`);
        
        for (const tagName of post.data.tags) {
          const tagSlug = createSlug(tagName);
          
          // Upsert tag
          const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .upsert({
              name: tagName,
              slug: tagSlug,
            }, {
              onConflict: 'slug'
            })
            .select()
            .single();

          if (tagError) {
            console.error(`❌ Error creating tag "${tagName}":`, tagError);
            continue;
          }

          // Link post to tag
          const { error: linkError } = await supabase
            .from('post_tags')
            .upsert({
              post_id: postData.id,
              tag_id: tagData.id,
            }, {
              onConflict: 'post_id,tag_id'
            });

          if (linkError) {
            console.error(`❌ Error linking tag "${tagName}" to post:`, linkError);
          }
        }
      }

      console.log(`✅ Successfully synced: ${post.data.title}`);
    }

    console.log('🎉 Post sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during post sync:', error);
    process.exit(1);
  }
}

// Run the sync
syncPosts();