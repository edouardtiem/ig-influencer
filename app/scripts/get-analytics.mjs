#!/usr/bin/env node
/**
 * Get Instagram Analytics
 * Fetches real metrics from your Instagram posts
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

// ═══════════════════════════════════════════════════════════════
// FETCH FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function getAccountInfo() {
  const params = new URLSearchParams({
    fields: 'username,name,followers_count,media_count,profile_picture_url',
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });
  
  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${process.env.INSTAGRAM_ACCOUNT_ID}?${params}`
  );
  
  return response.json();
}

async function getRecentMedia(limit = 25) {
  const params = new URLSearchParams({
    fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink',
    limit: limit.toString(),
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });
  
  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${process.env.INSTAGRAM_ACCOUNT_ID}/media?${params}`
  );
  
  return response.json();
}

async function getMediaInsights(mediaId, mediaType) {
  // Different metrics available for different media types
  let metrics;
  if (mediaType === 'VIDEO' || mediaType === 'REELS') {
    metrics = 'impressions,reach,saved,shares,plays,total_interactions';
  } else if (mediaType === 'CAROUSEL_ALBUM') {
    metrics = 'impressions,reach,saved,shares,total_interactions';
  } else {
    metrics = 'impressions,reach,saved,shares,total_interactions';
  }
  
  const params = new URLSearchParams({
    metric: metrics,
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });
  
  try {
    const response = await fetch(
      `${INSTAGRAM_GRAPH_API}/${mediaId}/insights?${params}`
    );
    const data = await response.json();
    
    if (data.error) {
      return null;
    }
    
    // Transform to object
    const insights = {};
    if (data.data) {
      data.data.forEach(item => {
        insights[item.name] = item.values[0]?.value || 0;
      });
    }
    return insights;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// ANALYSIS
// ═══════════════════════════════════════════════════════════════

function analyzeContent(posts) {
  const analysis = {
    byType: {},
    byDayOfWeek: {},
    byHour: {},
    topPosts: [],
    averages: {},
  };
  
  posts.forEach(post => {
    const type = post.media_type;
    const date = new Date(post.timestamp);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = date.getHours();
    
    // By type
    if (!analysis.byType[type]) {
      analysis.byType[type] = { count: 0, totalLikes: 0, totalComments: 0, totalReach: 0, totalSaves: 0, totalShares: 0 };
    }
    analysis.byType[type].count++;
    analysis.byType[type].totalLikes += post.like_count || 0;
    analysis.byType[type].totalComments += post.comments_count || 0;
    if (post.insights) {
      analysis.byType[type].totalReach += post.insights.reach || 0;
      analysis.byType[type].totalSaves += post.insights.saved || 0;
      analysis.byType[type].totalShares += post.insights.shares || 0;
    }
    
    // By day
    if (!analysis.byDayOfWeek[dayOfWeek]) {
      analysis.byDayOfWeek[dayOfWeek] = { count: 0, totalEngagement: 0 };
    }
    analysis.byDayOfWeek[dayOfWeek].count++;
    analysis.byDayOfWeek[dayOfWeek].totalEngagement += (post.like_count || 0) + (post.comments_count || 0);
    
    // By hour
    if (!analysis.byHour[hour]) {
      analysis.byHour[hour] = { count: 0, totalEngagement: 0 };
    }
    analysis.byHour[hour].count++;
    analysis.byHour[hour].totalEngagement += (post.like_count || 0) + (post.comments_count || 0);
  });
  
  // Calculate averages
  Object.keys(analysis.byType).forEach(type => {
    const data = analysis.byType[type];
    data.avgLikes = Math.round(data.totalLikes / data.count);
    data.avgComments = Math.round(data.totalComments / data.count * 10) / 10;
    data.avgReach = Math.round(data.totalReach / data.count);
    data.avgSaves = Math.round(data.totalSaves / data.count * 10) / 10;
    data.avgShares = Math.round(data.totalShares / data.count * 10) / 10;
  });
  
  // Top posts by engagement
  analysis.topPosts = posts
    .map(p => ({
      ...p,
      engagement: (p.like_count || 0) + (p.comments_count || 0) * 2 + (p.insights?.saved || 0) * 3 + (p.insights?.shares || 0) * 4
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);
  
  return analysis;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '█'.repeat(60));
  console.log('📊 INSTAGRAM ANALYTICS');
  console.log('█'.repeat(60));
  
  // Get account info
  console.log('\n📱 Fetching account info...');
  const account = await getAccountInfo();
  
  if (account.error) {
    console.log('❌ Error:', account.error.message);
    process.exit(1);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('ACCOUNT');
  console.log('═'.repeat(60));
  console.log(`👤 @${account.username}`);
  console.log(`👥 Followers: ${account.followers_count?.toLocaleString() || 'N/A'}`);
  console.log(`📸 Posts: ${account.media_count || 'N/A'}`);
  
  // Get recent media
  console.log('\n📸 Fetching recent posts...');
  const media = await getRecentMedia(25);
  
  if (media.error) {
    console.log('❌ Error:', media.error.message);
    process.exit(1);
  }
  
  const posts = media.data || [];
  console.log(`   Found ${posts.length} posts`);
  
  // Get insights for each post
  console.log('\n📈 Fetching insights...');
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    process.stdout.write(`   ${i + 1}/${posts.length}\r`);
    post.insights = await getMediaInsights(post.id, post.media_type);
    await new Promise(r => setTimeout(r, 100)); // Rate limit
  }
  console.log('   ✅ Done        ');
  
  // Analyze
  const analysis = analyzeContent(posts);
  
  // Display results
  console.log('\n' + '═'.repeat(60));
  console.log('PERFORMANCE PAR TYPE DE CONTENU');
  console.log('═'.repeat(60));
  
  const typeOrder = ['REELS', 'VIDEO', 'CAROUSEL_ALBUM', 'IMAGE'];
  typeOrder.forEach(type => {
    const data = analysis.byType[type];
    if (!data) return;
    
    const emoji = type === 'REELS' || type === 'VIDEO' ? '🎬' : type === 'CAROUSEL_ALBUM' ? '🎠' : '📷';
    console.log(`\n${emoji} ${type} (${data.count} posts)`);
    console.log(`   ❤️  Likes moyens:    ${data.avgLikes}`);
    console.log(`   💬 Comments moyens: ${data.avgComments}`);
    console.log(`   👁️  Reach moyen:     ${data.avgReach}`);
    console.log(`   🔖 Saves moyens:    ${data.avgSaves}`);
    console.log(`   🔄 Shares moyens:   ${data.avgShares}`);
  });
  
  // Top 5 posts
  console.log('\n' + '═'.repeat(60));
  console.log('🏆 TOP 5 POSTS (par engagement)');
  console.log('═'.repeat(60));
  
  analysis.topPosts.forEach((post, i) => {
    const type = post.media_type === 'REELS' || post.media_type === 'VIDEO' ? '🎬' : 
                 post.media_type === 'CAROUSEL_ALBUM' ? '🎠' : '📷';
    const date = new Date(post.timestamp).toLocaleDateString('fr-FR');
    const caption = (post.caption || '').slice(0, 40).replace(/\n/g, ' ');
    
    console.log(`\n#${i + 1} ${type} ${date}`);
    console.log(`   "${caption}..."`);
    console.log(`   ❤️ ${post.like_count} | 💬 ${post.comments_count} | 👁️ ${post.insights?.reach || '?'} | 🔖 ${post.insights?.saved || '?'}`);
  });
  
  // Best day/hour
  console.log('\n' + '═'.repeat(60));
  console.log('📅 MEILLEURS MOMENTS');
  console.log('═'.repeat(60));
  
  const bestDay = Object.entries(analysis.byDayOfWeek)
    .map(([day, data]) => ({ day, avgEngagement: data.totalEngagement / data.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  
  const bestHour = Object.entries(analysis.byHour)
    .map(([hour, data]) => ({ hour: parseInt(hour), avgEngagement: data.totalEngagement / data.count }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)[0];
  
  if (bestDay) {
    console.log(`\n📆 Meilleur jour: ${bestDay.day} (${Math.round(bestDay.avgEngagement)} engagement moyen)`);
  }
  if (bestHour) {
    console.log(`⏰ Meilleure heure: ${bestHour.hour}h (${Math.round(bestHour.avgEngagement)} engagement moyen)`);
  }
  
  // Summary
  console.log('\n' + '█'.repeat(60));
  console.log('💡 INSIGHTS');
  console.log('█'.repeat(60));
  
  const types = Object.entries(analysis.byType);
  if (types.length > 1) {
    const sorted = types.sort((a, b) => b[1].avgLikes - a[1].avgLikes);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    
    console.log(`\n✅ Meilleur format: ${best[0]} (${best[1].avgLikes} likes moyens)`);
    if (worst[0] !== best[0]) {
      console.log(`⚠️  Moins performant: ${worst[0]} (${worst[1].avgLikes} likes moyens)`);
    }
    
    // Ratio
    if (best[1].avgLikes > 0 && worst[1].avgLikes > 0) {
      const ratio = (best[1].avgLikes / worst[1].avgLikes).toFixed(1);
      console.log(`\n📊 ${best[0]} performe ${ratio}x mieux que ${worst[0]}`);
    }
  }
  
  console.log('\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

