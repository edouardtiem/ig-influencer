#!/usr/bin/env node
/**
 * Debug Instagram Insights - Check what metrics are actually returned
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

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

async function getRecentMedia(token, accountId) {
  const params = new URLSearchParams({
    fields: 'id,caption,media_type,timestamp,like_count,comments_count,permalink',
    limit: '5',
    access_token: token,
  });
  
  const response = await fetch(`${INSTAGRAM_GRAPH_API}/${accountId}/media?${params}`);
  return response.json();
}

async function getMediaInsightsDebug(token, mediaId, mediaType) {
  console.log(`\n   📊 Testing insights for ${mediaType} (${mediaId})...`);
  
  // Test different metric combinations
  const metricSets = [
    // For all media types
    { name: 'Basic', metrics: 'impressions,reach' },
    { name: 'With saved', metrics: 'impressions,reach,saved' },
    { name: 'With shares', metrics: 'impressions,reach,saved,shares' },
    // For Reels/Video
    { name: 'Video plays', metrics: 'plays,reach,saved,shares' },
    { name: 'Total interactions', metrics: 'reach,saved,shares,total_interactions' },
    // New metrics (API v21+)
    { name: 'Views (new)', metrics: 'views,reach' },
    { name: 'ig_reels_video_view_total_time', metrics: 'ig_reels_video_view_total_time' },
  ];
  
  for (const set of metricSets) {
    const params = new URLSearchParams({
      metric: set.metrics,
      access_token: token,
    });
    
    try {
      const response = await fetch(`${INSTAGRAM_GRAPH_API}/${mediaId}/insights?${params}`);
      const data = await response.json();
      
      if (data.error) {
        console.log(`      ❌ ${set.name}: ${data.error.message}`);
      } else if (data.data && data.data.length > 0) {
        const values = data.data.map(d => `${d.name}=${d.values?.[0]?.value || 0}`).join(', ');
        console.log(`      ✅ ${set.name}: ${values}`);
      } else {
        console.log(`      ⚠️  ${set.name}: No data returned`);
      }
    } catch (err) {
      console.log(`      ❌ ${set.name}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🔍 DEBUG INSTAGRAM INSIGHTS');
  console.log('═'.repeat(60));
  
  for (const [key, config] of Object.entries(ACCOUNTS)) {
    if (!config.token || !config.accountId) {
      console.log(`\n⚠️  ${config.name}: Missing credentials`);
      continue;
    }
    
    console.log(`\n📱 ${config.name}`);
    console.log('-'.repeat(40));
    
    const media = await getRecentMedia(config.token, config.accountId);
    
    if (media.error) {
      console.log(`   ❌ Error: ${media.error.message}`);
      continue;
    }
    
    const posts = media.data || [];
    console.log(`   Found ${posts.length} recent posts`);
    
    // Test insights for each media type found
    const testedTypes = new Set();
    
    for (const post of posts) {
      if (!testedTypes.has(post.media_type)) {
        testedTypes.add(post.media_type);
        const date = new Date(post.timestamp).toLocaleDateString('fr-FR');
        console.log(`\n   📸 ${post.media_type} from ${date}`);
        console.log(`      Likes: ${post.like_count || 0} | Comments: ${post.comments_count || 0}`);
        console.log(`      URL: ${post.permalink}`);
        await getMediaInsightsDebug(config.token, post.id, post.media_type);
      }
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📝 NOTES:');
  console.log('═'.repeat(60));
  console.log(`
- impressions: Total views of the post
- reach: Unique accounts that saw the post  
- plays: Video plays (for REELS/VIDEO only)
- views: New metric in API v21+
- saved: Number of saves
- shares: Number of shares

If metrics return errors, they may not be available for:
- Posts less than 24-48 hours old
- Personal accounts (need Business/Creator)
- Certain media types
`);
}

main().catch(console.error);

