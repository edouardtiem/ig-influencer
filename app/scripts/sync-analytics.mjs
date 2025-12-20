/**
 * Sync Analytics — Fetch IG insights and update Supabase
 * 
 * Usage:
 *   node scripts/sync-analytics.mjs           # Sync both accounts
 *   node scripts/sync-analytics.mjs mila      # Sync Mila only
 *   node scripts/sync-analytics.mjs elena     # Sync Elena only
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// ===========================================
// CONFIG
// ===========================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ACCOUNTS = {
  mila: {
    name: 'Mila Verne',
    accountId: process.env.INSTAGRAM_ACCOUNT_ID,
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  },
  elena: {
    name: 'Elena Visconti',
    accountId: process.env.INSTAGRAM_ACCOUNT_ID_ELENA,
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN_ELENA,
  },
};

// ===========================================
// FETCH IG MEDIA
// ===========================================

async function fetchRecentMedia(account) {
  const { accountId, accessToken } = account;
  
  const url = `https://graph.facebook.com/v21.0/${accountId}/media`;
  const params = {
    fields: 'id,caption,media_type,permalink,timestamp,like_count,comments_count',
    limit: 25,
    access_token: accessToken,
  };

  try {
    const response = await axios.get(url, { params });
    return response.data.data || [];
  } catch (error) {
    console.error('❌ Error fetching media:', error.response?.data?.error?.message || error.message);
    return [];
  }
}

// ===========================================
// FETCH INSIGHTS FOR A POST
// ===========================================

async function fetchPostInsights(mediaId, accessToken, mediaType) {
  // Different metrics for different media types
  let metrics = 'impressions,reach';
  if (mediaType === 'VIDEO' || mediaType === 'REELS') {
    metrics = 'impressions,reach,plays';
  }
  
  const url = `https://graph.facebook.com/v21.0/${mediaId}/insights`;
  const params = {
    metric: metrics,
    access_token: accessToken,
  };

  try {
    const response = await axios.get(url, { params });
    const data = response.data.data || [];
    
    const insights = {};
    data.forEach(metric => {
      insights[metric.name] = metric.values?.[0]?.value || 0;
    });
    
    return insights;
  } catch (error) {
    // Insights may not be available for all posts
    return { impressions: 0, reach: 0 };
  }
}

// ===========================================
// UPDATE SUPABASE
// ===========================================

async function updatePostInSupabase(character, igPost, insights) {
  const { data: existingPost } = await supabase
    .from('posts')
    .select('id')
    .eq('instagram_post_id', igPost.id)
    .single();

  const postData = {
    likes_count: igPost.like_count || 0,
    comments_count: igPost.comments_count || 0,
    reach: insights.reach || 0,
    impressions: insights.impressions || 0,
    analytics_updated_at: new Date().toISOString(),
  };

  // Calculate engagement rate
  if (insights.reach > 0) {
    postData.engagement_rate = ((igPost.like_count || 0) / insights.reach * 100).toFixed(2);
  }

  if (existingPost) {
    // Update existing
    await supabase
      .from('posts')
      .update(postData)
      .eq('id', existingPost.id);
    
    return { action: 'updated', id: existingPost.id };
  } else {
    // Insert new
    const mediaType = igPost.media_type === 'CAROUSEL_ALBUM' ? 'carousel' 
      : igPost.media_type === 'VIDEO' ? 'reel' : 'photo';

    const newPost = {
      character_name: character,
      instagram_post_id: igPost.id,
      instagram_permalink: igPost.permalink,
      post_type: mediaType,
      caption: igPost.caption?.substring(0, 500),
      image_urls: [igPost.permalink],
      posted_at: igPost.timestamp,
      ...postData,
    };

    const { data } = await supabase
      .from('posts')
      .insert(newPost)
      .select('id')
      .single();

    return { action: 'inserted', id: data?.id };
  }
}

// ===========================================
// SAVE ANALYTICS SNAPSHOT
// ===========================================

async function saveAnalyticsSnapshot(character, posts) {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate aggregates
  const totalLikes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
  const avgEngagement = posts.length > 0 
    ? (totalLikes / posts.length / 100).toFixed(2)
    : 0;

  // Find best performers
  const bestPost = posts.sort((a, b) => (b.like_count || 0) - (a.like_count || 0))[0];

  const snapshot = {
    character,
    snapshot_date: today,
    posts_count: posts.length,
    total_likes_week: totalLikes,
    total_comments_week: totalComments,
    avg_engagement_rate: avgEngagement,
  };

  await supabase
    .from('analytics_snapshots')
    .upsert(snapshot, { onConflict: 'character,snapshot_date' });

  return snapshot;
}

// ===========================================
// MAIN SYNC
// ===========================================

async function syncAccount(character) {
  const account = ACCOUNTS[character];
  
  if (!account.accountId || !account.accessToken) {
    console.log(`⚠️  ${character}: Missing credentials, skipping`);
    return;
  }

  console.log(`\n📊 Syncing ${account.name} (@${character === 'mila' ? 'mila_verne' : 'elenav.paris'})...`);

  // Fetch recent media
  const media = await fetchRecentMedia(account);
  console.log(`   Found ${media.length} posts`);

  let updated = 0;
  let inserted = 0;

  for (const post of media) {
    // Fetch insights
    const insights = await fetchPostInsights(post.id, account.accessToken, post.media_type);
    
    // Update Supabase
    const result = await updatePostInSupabase(character, post, insights);
    if (result.action === 'updated') updated++;
    if (result.action === 'inserted') inserted++;
  }

  console.log(`   ✅ Updated: ${updated} | Inserted: ${inserted}`);

  // Save snapshot
  const snapshot = await saveAnalyticsSnapshot(character, media);
  console.log(`   📸 Snapshot saved: ${snapshot.total_likes_week} total likes`);
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('\n🔄 ═══════════════════════════════════════════════════════');
  console.log('   SYNC ANALYTICS — IG → Supabase');
  console.log('═══════════════════════════════════════════════════════════');

  const args = process.argv.slice(2);
  const target = args[0]?.toLowerCase();

  if (target === 'mila') {
    await syncAccount('mila');
  } else if (target === 'elena') {
    await syncAccount('elena');
  } else {
    // Sync both
    await syncAccount('mila');
    await syncAccount('elena');
  }

  // Show summary from Supabase
  console.log('\n📈 Database Summary:');
  
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });
  
  const { data: topPosts } = await supabase
    .from('posts')
    .select('character_name, post_type, likes_count, engagement_rate')
    .order('likes_count', { ascending: false })
    .limit(3);

  console.log(`   Total posts in DB: ${postsCount}`);
  console.log('   Top 3 posts:');
  topPosts?.forEach((p, i) => {
    console.log(`     ${i+1}. ${p.character_name} ${p.post_type}: ${p.likes_count} likes (${p.engagement_rate || '?'}% ER)`);
  });

  console.log('\n✅ Sync complete!\n');
}

main().catch(console.error);

