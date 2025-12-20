#!/usr/bin/env node
/**
 * Dual Account Instagram Analytics
 * Analyzes both Mila and Elena accounts with detailed insights
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

// Account configurations
const ACCOUNTS = {
  mila: {
    name: 'Mila Verne',
    emoji: '💪',
    token: process.env.INSTAGRAM_ACCESS_TOKEN,
    accountId: process.env.INSTAGRAM_ACCOUNT_ID,
  },
  elena: {
    name: 'Elena Visconti',
    emoji: '✨',
    token: process.env.INSTAGRAM_ACCESS_TOKEN_ELENA,
    accountId: process.env.INSTAGRAM_ACCOUNT_ID_ELENA,
  },
};

// ═══════════════════════════════════════════════════════════════
// FETCH FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function getAccountInfo(token, accountId) {
  const params = new URLSearchParams({
    fields: 'username,name,followers_count,follows_count,media_count,profile_picture_url,biography',
    access_token: token,
  });
  
  const response = await fetch(`${INSTAGRAM_GRAPH_API}/${accountId}?${params}`);
  return response.json();
}

async function getRecentMedia(token, accountId, limit = 50) {
  const params = new URLSearchParams({
    fields: 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink',
    limit: limit.toString(),
    access_token: token,
  });
  
  const response = await fetch(`${INSTAGRAM_GRAPH_API}/${accountId}/media?${params}`);
  return response.json();
}

async function getMediaInsights(token, mediaId, mediaType) {
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
    access_token: token,
  });
  
  try {
    const response = await fetch(`${INSTAGRAM_GRAPH_API}/${mediaId}/insights?${params}`);
    const data = await response.json();
    
    if (data.error) return null;
    
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
// ANALYSIS FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function analyzeAccount(posts, accountInfo) {
  const now = new Date();
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
  
  const analysis = {
    totalPosts: posts.length,
    followers: accountInfo.followers_count || 0,
    following: accountInfo.follows_count || 0,
    
    // Content breakdown
    byType: {},
    
    // Engagement metrics
    avgLikes: 0,
    avgComments: 0,
    avgReach: 0,
    avgSaves: 0,
    avgShares: 0,
    engagementRate: 0,
    
    // Time analysis
    byDayOfWeek: {},
    byHour: {},
    
    // Trend analysis (last 7 days vs previous 7)
    recentPosts: [],
    previousPosts: [],
    trend: 0,
    
    // Top performers
    topPosts: [],
    worstPosts: [],
    
    // Caption analysis
    avgCaptionLength: 0,
    hashtagUsage: 0,
    emojiUsage: 0,
    
    // Post frequency
    postsLastWeek: 0,
    postsLast2Weeks: 0,
    avgPostsPerWeek: 0,
  };
  
  let totalLikes = 0;
  let totalComments = 0;
  let totalReach = 0;
  let totalSaves = 0;
  let totalShares = 0;
  let totalCaptionLength = 0;
  let totalHashtags = 0;
  let totalEmojis = 0;
  
  posts.forEach(post => {
    const type = post.media_type;
    const date = new Date(post.timestamp);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = date.getHours();
    const caption = post.caption || '';
    
    // Time classification
    if (date >= oneWeekAgo) {
      analysis.postsLastWeek++;
      analysis.recentPosts.push(post);
    } else if (date >= twoWeeksAgo) {
      analysis.previousPosts.push(post);
    }
    
    if (date >= twoWeeksAgo) {
      analysis.postsLast2Weeks++;
    }
    
    // By type
    if (!analysis.byType[type]) {
      analysis.byType[type] = { count: 0, likes: 0, comments: 0, reach: 0, saves: 0, shares: 0 };
    }
    analysis.byType[type].count++;
    analysis.byType[type].likes += post.like_count || 0;
    analysis.byType[type].comments += post.comments_count || 0;
    if (post.insights) {
      analysis.byType[type].reach += post.insights.reach || 0;
      analysis.byType[type].saves += post.insights.saved || 0;
      analysis.byType[type].shares += post.insights.shares || 0;
    }
    
    // By day
    if (!analysis.byDayOfWeek[dayOfWeek]) {
      analysis.byDayOfWeek[dayOfWeek] = { count: 0, engagement: 0 };
    }
    analysis.byDayOfWeek[dayOfWeek].count++;
    analysis.byDayOfWeek[dayOfWeek].engagement += (post.like_count || 0) + (post.comments_count || 0);
    
    // By hour
    if (!analysis.byHour[hour]) {
      analysis.byHour[hour] = { count: 0, engagement: 0 };
    }
    analysis.byHour[hour].count++;
    analysis.byHour[hour].engagement += (post.like_count || 0) + (post.comments_count || 0);
    
    // Totals
    totalLikes += post.like_count || 0;
    totalComments += post.comments_count || 0;
    if (post.insights) {
      totalReach += post.insights.reach || 0;
      totalSaves += post.insights.saved || 0;
      totalShares += post.insights.shares || 0;
    }
    
    // Caption analysis
    totalCaptionLength += caption.length;
    totalHashtags += (caption.match(/#\w+/g) || []).length;
    totalEmojis += (caption.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  });
  
  // Calculate averages
  if (posts.length > 0) {
    analysis.avgLikes = Math.round(totalLikes / posts.length);
    analysis.avgComments = Math.round(totalComments / posts.length * 10) / 10;
    analysis.avgReach = Math.round(totalReach / posts.length);
    analysis.avgSaves = Math.round(totalSaves / posts.length * 10) / 10;
    analysis.avgShares = Math.round(totalShares / posts.length * 10) / 10;
    analysis.avgCaptionLength = Math.round(totalCaptionLength / posts.length);
    analysis.hashtagUsage = Math.round(totalHashtags / posts.length * 10) / 10;
    analysis.emojiUsage = Math.round(totalEmojis / posts.length * 10) / 10;
  }
  
  // Engagement rate
  if (analysis.followers > 0) {
    analysis.engagementRate = Math.round((totalLikes + totalComments) / posts.length / analysis.followers * 10000) / 100;
  }
  
  // Calculate type averages
  Object.keys(analysis.byType).forEach(type => {
    const data = analysis.byType[type];
    data.avgLikes = Math.round(data.likes / data.count);
    data.avgComments = Math.round(data.comments / data.count * 10) / 10;
    data.avgReach = Math.round(data.reach / data.count);
    data.avgSaves = Math.round(data.saves / data.count * 10) / 10;
    data.avgShares = Math.round(data.shares / data.count * 10) / 10;
  });
  
  // Post frequency
  const oldestPost = posts[posts.length - 1];
  if (oldestPost) {
    const daysSinceFirst = (now - new Date(oldestPost.timestamp)) / (1000 * 60 * 60 * 24);
    analysis.avgPostsPerWeek = Math.round(posts.length / (daysSinceFirst / 7) * 10) / 10;
  }
  
  // Trend analysis
  if (analysis.recentPosts.length > 0 && analysis.previousPosts.length > 0) {
    const recentAvg = analysis.recentPosts.reduce((sum, p) => sum + (p.like_count || 0), 0) / analysis.recentPosts.length;
    const previousAvg = analysis.previousPosts.reduce((sum, p) => sum + (p.like_count || 0), 0) / analysis.previousPosts.length;
    analysis.trend = Math.round((recentAvg - previousAvg) / previousAvg * 100);
  }
  
  // Top/worst posts
  const scored = posts.map(p => ({
    ...p,
    score: (p.like_count || 0) + (p.comments_count || 0) * 2 + (p.insights?.saved || 0) * 3 + (p.insights?.shares || 0) * 4
  })).sort((a, b) => b.score - a.score);
  
  analysis.topPosts = scored.slice(0, 3);
  analysis.worstPosts = scored.slice(-3).reverse();
  
  return analysis;
}

function generateRecommendations(mila, elena, milaPosts, elenaPosts) {
  const recommendations = {
    mila: [],
    elena: [],
    general: [],
  };
  
  // ═══════════════════════════════════════════════════════════════
  // MILA SPECIFIC
  // ═══════════════════════════════════════════════════════════════
  
  // Content type recommendations
  const milaTypes = Object.entries(mila.byType);
  const milaReels = mila.byType['REELS'] || mila.byType['VIDEO'];
  const milaCarousels = mila.byType['CAROUSEL_ALBUM'];
  
  if (!milaReels || milaReels.count < mila.totalPosts * 0.3) {
    recommendations.mila.push({
      priority: '🔴 HAUTE',
      title: 'Plus de Reels',
      detail: `Les Reels sont le format le plus poussé par l'algorithme Instagram. Tu n'en as que ${milaReels?.count || 0} sur ${mila.totalPosts} posts. Vise au moins 40-50% de Reels.`,
    });
  }
  
  if (milaCarousels && milaCarousels.avgLikes > mila.avgLikes * 1.2) {
    recommendations.mila.push({
      priority: '🟢 OPPORTUNITÉ',
      title: 'Carousels performants',
      detail: `Tes carousels ont ${milaCarousels.avgLikes} likes en moyenne vs ${mila.avgLikes} global. Continue à en faire !`,
    });
  }
  
  // Engagement rate
  if (mila.engagementRate < 3) {
    recommendations.mila.push({
      priority: '🔴 HAUTE',
      title: 'Engagement rate faible',
      detail: `Ton taux d'engagement est de ${mila.engagementRate}%. Un bon taux pour ton nombre de followers serait 5-10%. Améliore tes captions avec des questions et CTA.`,
    });
  }
  
  // Post frequency
  if (mila.avgPostsPerWeek < 5) {
    recommendations.mila.push({
      priority: '🟡 MOYENNE',
      title: 'Fréquence de post',
      detail: `Tu postes ${mila.avgPostsPerWeek}x/semaine. Pour grandir vite, vise 7-10 posts/semaine (1-2 par jour).`,
    });
  }
  
  // Caption analysis
  if (mila.avgCaptionLength < 100) {
    recommendations.mila.push({
      priority: '🟡 MOYENNE',
      title: 'Captions trop courtes',
      detail: `Tes captions font ${mila.avgCaptionLength} caractères en moyenne. Des captions plus longues (150-300 car.) avec des stories augmentent l'engagement.`,
    });
  }
  
  if (mila.hashtagUsage < 5) {
    recommendations.mila.push({
      priority: '🟡 MOYENNE',
      title: 'Hashtags sous-utilisés',
      detail: `Tu utilises ${mila.hashtagUsage} hashtags en moyenne. Utilise 10-15 hashtags mixtes (niches + populaires) pour plus de reach.`,
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // ELENA SPECIFIC
  // ═══════════════════════════════════════════════════════════════
  
  const elenaReels = elena.byType['REELS'] || elena.byType['VIDEO'];
  const elenaCarousels = elena.byType['CAROUSEL_ALBUM'];
  
  if (!elenaReels || elenaReels.count < elena.totalPosts * 0.3) {
    recommendations.elena.push({
      priority: '🔴 HAUTE',
      title: 'Plus de Reels',
      detail: `Les Reels sont essentiels pour la croissance. Tu n'en as que ${elenaReels?.count || 0} sur ${elena.totalPosts} posts. Vise au moins 40-50% de Reels.`,
    });
  }
  
  if (elena.engagementRate < 3) {
    recommendations.elena.push({
      priority: '🔴 HAUTE',
      title: 'Engagement rate faible',
      detail: `Ton taux d'engagement est de ${elena.engagementRate}%. Un bon taux serait 5-10%. Pose des questions dans tes captions.`,
    });
  }
  
  if (elena.avgPostsPerWeek < 5) {
    recommendations.elena.push({
      priority: '🟡 MOYENNE',
      title: 'Fréquence de post',
      detail: `Tu postes ${elena.avgPostsPerWeek}x/semaine. Pour grandir vite, vise 7-10 posts/semaine.`,
    });
  }
  
  if (elena.avgCaptionLength < 100) {
    recommendations.elena.push({
      priority: '🟡 MOYENNE',
      title: 'Captions trop courtes',
      detail: `Tes captions font ${elena.avgCaptionLength} caractères en moyenne. Des captions plus storytelling augmentent l'engagement.`,
    });
  }
  
  if (elena.hashtagUsage < 5) {
    recommendations.elena.push({
      priority: '🟡 MOYENNE',
      title: 'Hashtags sous-utilisés',
      detail: `Tu utilises ${elena.hashtagUsage} hashtags en moyenne. Utilise 10-15 hashtags mixtes.`,
    });
  }
  
  // ═══════════════════════════════════════════════════════════════
  // GENERAL RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════
  
  // Best posting times
  const milaBestDay = Object.entries(mila.byDayOfWeek)
    .map(([day, data]) => ({ day, avg: data.engagement / data.count }))
    .sort((a, b) => b.avg - a.avg)[0];
  
  const elenaBestDay = Object.entries(elena.byDayOfWeek)
    .map(([day, data]) => ({ day, avg: data.engagement / data.count }))
    .sort((a, b) => b.avg - a.avg)[0];
  
  recommendations.general.push({
    priority: '🟢 OPPORTUNITÉ',
    title: 'Meilleurs jours',
    detail: `Mila: ${milaBestDay?.day || 'N/A'} | Elena: ${elenaBestDay?.day || 'N/A'}. Concentre les posts importants ces jours-là.`,
  });
  
  // Cross-promotion
  recommendations.general.push({
    priority: '🟢 OPPORTUNITÉ',
    title: 'Cross-promotion',
    detail: `Fais des collabs entre Mila et Elena ! Stories ensemble, posts duo, etc. Ça expose chaque compte à l'audience de l'autre.`,
  });
  
  // Trending content
  recommendations.general.push({
    priority: '🟡 MOYENNE',
    title: 'Trending audio',
    detail: `Utilise des audios trending sur les Reels. Vérifie les sons populaires chaque semaine.`,
  });
  
  // Engagement strategy
  recommendations.general.push({
    priority: '🔴 HAUTE',
    title: 'Engagement actif',
    detail: `Réponds à TOUS les commentaires dans l'heure suivant le post. Commente sur des comptes similaires. L'algorithme aime l'activité.`,
  });
  
  // Stories
  recommendations.general.push({
    priority: '🔴 HAUTE',
    title: 'Stories quotidiennes',
    detail: `Poste 5-10 stories par jour. Les stories maintiennent l'engagement et rappellent aux followers que tu existes.`,
  });
  
  return recommendations;
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function displayAccountSummary(name, emoji, username, analysis) {
  console.log(`\n${emoji} ${name.toUpperCase()} (@${username})`);
  console.log('─'.repeat(50));
  console.log(`👥 Followers: ${analysis.followers?.toLocaleString() || 'N/A'}`);
  console.log(`📸 Posts: ${analysis.totalPosts}`);
  console.log(`📊 Engagement Rate: ${analysis.engagementRate}%`);
  console.log(`❤️  Likes moyens: ${analysis.avgLikes}`);
  console.log(`💬 Comments moyens: ${analysis.avgComments}`);
  console.log(`📈 Trend (7j): ${analysis.trend > 0 ? '+' : ''}${analysis.trend}%`);
  console.log(`📅 Posts/semaine: ${analysis.avgPostsPerWeek}`);
}

function displayTypeBreakdown(analysis) {
  console.log('\n📊 Par type de contenu:');
  const typeOrder = ['REELS', 'VIDEO', 'CAROUSEL_ALBUM', 'IMAGE'];
  typeOrder.forEach(type => {
    const data = analysis.byType[type];
    if (!data) return;
    const emoji = type === 'REELS' || type === 'VIDEO' ? '🎬' : type === 'CAROUSEL_ALBUM' ? '🎠' : '📷';
    console.log(`   ${emoji} ${type}: ${data.count} posts | ${data.avgLikes} likes | ${data.avgReach} reach`);
  });
}

function displayTopPosts(topPosts, label) {
  console.log(`\n${label}:`);
  topPosts.forEach((post, i) => {
    const date = new Date(post.timestamp).toLocaleDateString('fr-FR');
    const caption = (post.caption || '').slice(0, 35).replace(/\n/g, ' ');
    console.log(`   ${i + 1}. ${date} | ❤️${post.like_count} 💬${post.comments_count} | "${caption}..."`);
  });
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('\n' + '█'.repeat(60));
  console.log('📊 INSTAGRAM ANALYTICS - DUAL ACCOUNT REPORT');
  console.log('█'.repeat(60));
  console.log(`📅 ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  
  const results = {};
  
  for (const [key, config] of Object.entries(ACCOUNTS)) {
    if (!config.token || !config.accountId) {
      console.log(`\n⚠️  ${config.name}: Token ou Account ID manquant`);
      continue;
    }
    
    console.log(`\n📱 Fetching ${config.name}...`);
    
    // Get account info
    const accountInfo = await getAccountInfo(config.token, config.accountId);
    if (accountInfo.error) {
      console.log(`   ❌ Error: ${accountInfo.error.message}`);
      continue;
    }
    
    // Get media
    const media = await getRecentMedia(config.token, config.accountId, 50);
    if (media.error) {
      console.log(`   ❌ Error: ${media.error.message}`);
      continue;
    }
    
    const posts = media.data || [];
    console.log(`   Found ${posts.length} posts`);
    
    // Get insights for each post
    process.stdout.write('   Fetching insights...');
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      post.insights = await getMediaInsights(config.token, post.id, post.media_type);
      await new Promise(r => setTimeout(r, 50)); // Rate limit
    }
    console.log(' ✅');
    
    results[key] = {
      config,
      accountInfo,
      posts,
      analysis: analyzeAccount(posts, accountInfo),
    };
  }
  
  // Display results
  console.log('\n' + '═'.repeat(60));
  console.log('📈 RÉSUMÉ DES COMPTES');
  console.log('═'.repeat(60));
  
  for (const [key, data] of Object.entries(results)) {
    displayAccountSummary(
      data.config.name,
      data.config.emoji,
      data.accountInfo.username,
      data.analysis
    );
    displayTypeBreakdown(data.analysis);
    displayTopPosts(data.analysis.topPosts, '🏆 Top 3 posts');
  }
  
  // Comparison
  if (results.mila && results.elena) {
    console.log('\n' + '═'.repeat(60));
    console.log('⚔️  COMPARAISON MILA vs ELENA');
    console.log('═'.repeat(60));
    
    const m = results.mila.analysis;
    const e = results.elena.analysis;
    
    console.log(`\n| Métrique          | Mila          | Elena         | Gagnant |`);
    console.log(`|-------------------|---------------|---------------|---------|`);
    console.log(`| Followers         | ${m.followers?.toString().padStart(12) || 'N/A'.padStart(12)} | ${e.followers?.toString().padStart(12) || 'N/A'.padStart(12)} | ${m.followers > e.followers ? '💪' : '✨'} |`);
    console.log(`| Engagement Rate   | ${(m.engagementRate + '%').padStart(12)} | ${(e.engagementRate + '%').padStart(12)} | ${m.engagementRate > e.engagementRate ? '💪' : '✨'} |`);
    console.log(`| Likes moyens      | ${m.avgLikes.toString().padStart(12)} | ${e.avgLikes.toString().padStart(12)} | ${m.avgLikes > e.avgLikes ? '💪' : '✨'} |`);
    console.log(`| Posts/semaine     | ${m.avgPostsPerWeek.toString().padStart(12)} | ${e.avgPostsPerWeek.toString().padStart(12)} | ${m.avgPostsPerWeek > e.avgPostsPerWeek ? '💪' : '✨'} |`);
    console.log(`| Trend 7j          | ${(m.trend + '%').padStart(12)} | ${(e.trend + '%').padStart(12)} | ${m.trend > e.trend ? '💪' : '✨'} |`);
    
    // Generate recommendations
    const recommendations = generateRecommendations(m, e, results.mila.posts, results.elena.posts);
    
    console.log('\n' + '═'.repeat(60));
    console.log('💡 RECOMMANDATIONS MILA');
    console.log('═'.repeat(60));
    recommendations.mila.forEach(r => {
      console.log(`\n${r.priority} ${r.title}`);
      console.log(`   ${r.detail}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log('💡 RECOMMANDATIONS ELENA');
    console.log('═'.repeat(60));
    recommendations.elena.forEach(r => {
      console.log(`\n${r.priority} ${r.title}`);
      console.log(`   ${r.detail}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log('💡 RECOMMANDATIONS GÉNÉRALES');
    console.log('═'.repeat(60));
    recommendations.general.forEach(r => {
      console.log(`\n${r.priority} ${r.title}`);
      console.log(`   ${r.detail}`);
    });
  }
  
  console.log('\n' + '█'.repeat(60));
  console.log('🚀 PLAN D\'ACTION PRIORITAIRE');
  console.log('█'.repeat(60));
  console.log(`
1. 🎬 REELS FIRST: Passe à 50% de Reels minimum
   - Utilise des audios trending
   - 15-30 secondes max pour les débutants
   - Hook dans les 3 premières secondes

2. 📅 FRÉQUENCE: 1-2 posts par jour
   - Matin (7-9h) et soir (18-21h)
   - Stories tout au long de la journée

3. 💬 ENGAGEMENT: Réponds à tout
   - Réponds aux commentaires dans l'heure
   - Va commenter sur 10+ comptes similaires/jour
   - Utilise les DMs pour créer des relations

4. #️⃣ HASHTAGS: 10-15 par post
   - Mix: 3-5 gros + 5-10 niches
   - Fitness: #fitnessmotivation #gymlife #fitgirls
   - Fashion: #parisfashion #ootd #instafashion

5. ✍️ CAPTIONS: Storytelling
   - Pose une question à la fin
   - Partage une mini-histoire
   - CTA discret ("Double tap si...")

6. 👯‍♀️ COLLABS: Mila x Elena
   - Posts duo
   - Stories tagging
   - Lives ensemble
`);
  
  console.log('\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});


