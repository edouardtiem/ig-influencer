#!/usr/bin/env node
/**
 * Import Missing Posts - Sync all Instagram posts that are not in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const ACCOUNTS = {
  mila: {
    name: 'Mila Verne',
    token: process.env.INSTAGRAM_ACCESS_TOKEN,
    accountId: process.env.INSTAGRAM_ACCOUNT_ID,
  },
  elena: {
    name: 'Elena Visconti',
    token: process.env.INSTAGRAM_ACCESS_TOKEN_ELENA,
    accountId: process.env.INSTAGRAM_ACCOUNT_ID_ELENA,
  },
};

async function fetchMediaInsights(token, mediaId) {
  const metrics = 'views,reach,saved,shares,total_interactions';
  const params = new URLSearchParams({
    metric: metrics,
    access_token: token,
  });

  try {
    const response = await fetch(`${INSTAGRAM_GRAPH_API}/${mediaId}/insights?${params}`);
    const data = await response.json();
    
    if (data.error) return null;
    
    const insights = {};
    if (data.data) {
      data.data.forEach(item => {
        insights[item.name] = item.values?.[0]?.value || 0;
      });
    }
    
    return {
      impressions: insights.views || 0,
      reach: insights.reach || 0,
      saved: insights.saved || 0,
      shares: insights.shares || 0,
    };
  } catch {
    return null;
  }
}

async function fetchAllMedia(token, accountId) {
  let allMedia = [];
  let url = `${INSTAGRAM_GRAPH_API}/${accountId}/media`;
  let params = new URLSearchParams({
    fields: 'id,media_type,timestamp,like_count,comments_count,caption,permalink,media_url,thumbnail_url',
    limit: '50',
    access_token: token,
  });
  
  // Paginate through all media
  while (url) {
    const response = await fetch(`${url}?${params}`);
    const data = await response.json();
    
    if (data.data) {
      allMedia = allMedia.concat(data.data);
    }
    
    // Check for next page
    if (data.paging?.next) {
      url = data.paging.next;
      params = new URLSearchParams(); // URL already contains params
    } else {
      break;
    }
  }
  
  return allMedia;
}

async function importCharacter(character) {
  const config = ACCOUNTS[character];
  
  if (!config.token || !config.accountId) {
    console.log(`⚠️  ${character}: Missing credentials`);
    return;
  }

  console.log(`\n📊 Importing ${config.name}...`);
  
  // Get existing posts from Supabase
  const { data: dbPosts } = await supabase
    .from('posts')
    .select('instagram_post_id')
    .eq('character_name', character);

  const existingIds = new Set(dbPosts.map(p => p.instagram_post_id).filter(Boolean));
  console.log(`   ${existingIds.size} posts already in DB`);
  
  // Fetch all media from Instagram
  const igMedia = await fetchAllMedia(config.token, config.accountId);
  console.log(`   ${igMedia.length} posts on Instagram`);
  
  // Find missing posts
  const missingPosts = igMedia.filter(m => !existingIds.has(m.id));
  console.log(`   ${missingPosts.length} posts to import`);
  
  if (missingPosts.length === 0) {
    console.log(`   ✅ All posts already imported`);
    return { imported: 0, totalViews: 0 };
  }
  
  let imported = 0;
  let totalViews = 0;
  
  for (const post of missingPosts) {
    // Get insights
    const insights = await fetchMediaInsights(config.token, post.id);
    
    // Map Instagram media types to our post_type
    const mediaTypeMap = {
      'IMAGE': 'image',
      'VIDEO': 'reel',
      'CAROUSEL_ALBUM': 'carousel',
      'REELS': 'reel',
    };
    
    // Get image URL (media_url for images, thumbnail_url for videos)
    const imageUrl = post.media_url || post.thumbnail_url || post.permalink;
    
    const postData = {
      character_name: character,
      instagram_post_id: post.id,
      instagram_permalink: post.permalink,
      post_type: mediaTypeMap[post.media_type] || 'image',
      posted_at: post.timestamp,
      caption: post.caption?.substring(0, 2000) || '',
      image_urls: [imageUrl],
      likes_count: post.like_count || 0,
      comments_count: post.comments_count || 0,
      impressions: insights?.impressions || 0,
      reach: insights?.reach || 0,
      saves_count: insights?.saved || 0,
      shares_count: insights?.shares || 0,
      analytics_updated_at: new Date().toISOString(),
    };
    
    const { error } = await supabase
      .from('posts')
      .insert(postData);
    
    if (!error) {
      imported++;
      totalViews += insights?.impressions || 0;
      const date = new Date(post.timestamp).toLocaleDateString('fr-FR');
      console.log(`   ✅ ${date} | ${post.media_type} | ${insights?.impressions || 0} views`);
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 150));
  }
  
  console.log(`\n   📊 Imported: ${imported} | Views: ${totalViews}`);
  
  return { imported, totalViews };
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('📥 IMPORT MISSING POSTS FROM INSTAGRAM');
  console.log('═'.repeat(60));
  
  const args = process.argv.slice(2);
  const target = args[0]?.toLowerCase();
  
  let totalImported = 0;
  let totalViews = 0;
  
  if (target === 'mila') {
    const result = await importCharacter('mila');
    totalImported = result?.imported || 0;
    totalViews = result?.totalViews || 0;
  } else if (target === 'elena') {
    const result = await importCharacter('elena');
    totalImported = result?.imported || 0;
    totalViews = result?.totalViews || 0;
  } else {
    const milaResult = await importCharacter('mila');
    const elenaResult = await importCharacter('elena');
    totalImported = (milaResult?.imported || 0) + (elenaResult?.imported || 0);
    totalViews = (milaResult?.totalViews || 0) + (elenaResult?.totalViews || 0);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`📥 IMPORTED: ${totalImported} posts | ${totalViews.toLocaleString()} views`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);

