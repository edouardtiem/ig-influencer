#!/usr/bin/env node
/**
 * Full Sync Insights - Re-fetch views for ALL posts in Supabase
 * Uses the new API v22 metrics (views instead of impressions)
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
  // New API v22 metrics
  const metrics = 'views,reach,saved,shares,total_interactions';
  
  const params = new URLSearchParams({
    metric: metrics,
    access_token: token,
  });

  try {
    const response = await fetch(`${INSTAGRAM_GRAPH_API}/${mediaId}/insights?${params}`);
    const data = await response.json();
    
    if (data.error) {
      return null;
    }
    
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
  } catch (err) {
    return null;
  }
}

async function fetchAllMedia(token, accountId, limit = 100) {
  const params = new URLSearchParams({
    fields: 'id,media_type,timestamp,like_count,comments_count',
    limit: limit.toString(),
    access_token: token,
  });
  
  const response = await fetch(`${INSTAGRAM_GRAPH_API}/${accountId}/media?${params}`);
  const data = await response.json();
  return data.data || [];
}

async function syncCharacter(character) {
  const config = ACCOUNTS[character];
  
  if (!config.token || !config.accountId) {
    console.log(`⚠️  ${character}: Missing credentials`);
    return;
  }

  console.log(`\n📊 Syncing ${config.name}...`);
  
  // Get all posts from Supabase for this character
  const { data: dbPosts } = await supabase
    .from('posts')
    .select('id, instagram_post_id, impressions, posted_at')
    .eq('character_name', character)
    .order('posted_at', { ascending: false });

  console.log(`   Found ${dbPosts.length} posts in DB`);
  
  // Fetch all media from Instagram (up to 100 posts)
  const igMedia = await fetchAllMedia(config.token, config.accountId, 100);
  console.log(`   Found ${igMedia.length} posts on Instagram`);
  
  // Create a map of IG posts
  const igMap = new Map(igMedia.map(m => [m.id, m]));
  
  let updated = 0;
  let skipped = 0;
  let totalViews = 0;
  
  for (const dbPost of dbPosts) {
    if (!dbPost.instagram_post_id) {
      skipped++;
      continue;
    }
    
    // Fetch fresh insights
    const insights = await fetchMediaInsights(config.token, dbPost.instagram_post_id);
    
    if (!insights) {
      console.log(`   ⚠️  No insights for post ${dbPost.instagram_post_id}`);
      skipped++;
      continue;
    }
    
    // Get likes/comments from IG if available
    const igPost = igMap.get(dbPost.instagram_post_id);
    
    // Update in Supabase
    const updateData = {
      impressions: insights.impressions,
      reach: insights.reach,
      saves_count: insights.saved,
      shares_count: insights.shares,
      analytics_updated_at: new Date().toISOString(),
    };
    
    if (igPost) {
      updateData.likes_count = igPost.like_count || 0;
      updateData.comments_count = igPost.comments_count || 0;
    }
    
    await supabase
      .from('posts')
      .update(updateData)
      .eq('id', dbPost.id);
    
    totalViews += insights.impressions;
    updated++;
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 100));
    
    // Progress indicator
    if (updated % 10 === 0) {
      process.stdout.write(`   Updated ${updated}/${dbPosts.length}...\r`);
    }
  }
  
  console.log(`\n   ✅ Updated: ${updated} | Skipped: ${skipped}`);
  console.log(`   📊 Total views: ${totalViews}`);
  
  return { updated, skipped, totalViews };
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🔄 FULL SYNC INSIGHTS - Re-fetch all views');
  console.log('═'.repeat(60));
  
  const args = process.argv.slice(2);
  const target = args[0]?.toLowerCase();
  
  let totalViews = 0;
  
  if (target === 'mila') {
    const result = await syncCharacter('mila');
    totalViews = result?.totalViews || 0;
  } else if (target === 'elena') {
    const result = await syncCharacter('elena');
    totalViews = result?.totalViews || 0;
  } else {
    // Sync both
    const milaResult = await syncCharacter('mila');
    const elenaResult = await syncCharacter('elena');
    totalViews = (milaResult?.totalViews || 0) + (elenaResult?.totalViews || 0);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`📊 TOTAL VIEWS: ${totalViews.toLocaleString()}`);
  console.log('═'.repeat(60));
  console.log('\n✅ Full sync complete!\n');
}

main().catch(console.error);

