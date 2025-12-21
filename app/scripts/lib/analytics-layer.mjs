/**
 * Analytics Layer — Extract performance patterns from post history
 * 
 * Analyzes what content performs best to guide Content Brain decisions
 */

/**
 * Analyze performance patterns for a character
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase 
 * @param {string} character - 'mila' | 'elena'
 * @returns {Promise<AnalyticsData>}
 */
export async function analyzePerformance(supabase, character) {
  console.log(`   📊 Analyzing performance for ${character}...`);

  // Get posts with engagement data (last 60 days)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('character_name', character)
    .gte('posted_at', sixtyDaysAgo.toISOString())
    .order('posted_at', { ascending: false });

  if (error || !posts || posts.length === 0) {
    console.log(`      ⚠️  No posts found for analysis`);
    return getDefaultAnalytics();
  }

  console.log(`      Found ${posts.length} posts to analyze`);

  // Calculate engagement score for each post
  const postsWithScore = posts.map(post => ({
    ...post,
    engagementScore: calculateEngagementScore(post),
  }));

  // Sort by engagement
  const topPerformers = [...postsWithScore]
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, 10);

  // Analyze patterns
  const patterns = analyzePatterns(postsWithScore);
  
  // Generate recommendations
  const recommendations = generateRecommendations(patterns, postsWithScore);

  const result = {
    totalPostsAnalyzed: posts.length,
    topPerformers: topPerformers.map(p => ({
      id: p.id,
      type: p.post_type,
      location: p.location_key,
      mood: p.mood,
      likes: p.likes_count,
      comments: p.comments_count,
      engagementScore: p.engagementScore,
      postedAt: p.posted_at,
    })),
    patterns,
    recommendations,
  };

  console.log(`      ✅ Analysis complete`);
  console.log(`      Best location type: ${patterns.bestLocationType || 'N/A'}`);
  console.log(`      Best mood: ${patterns.bestMood || 'N/A'}`);

  return result;
}

/**
 * Calculate engagement score (weighted)
 */
function calculateEngagementScore(post) {
  const likes = post.likes_count || 0;
  const comments = post.comments_count || 0;
  const saves = post.saves_count || 0;
  const shares = post.shares_count || 0;

  // Weighted score: saves and comments are more valuable
  return likes + (comments * 3) + (saves * 5) + (shares * 2);
}

/**
 * Analyze patterns in the data
 */
function analyzePatterns(posts) {
  if (posts.length === 0) {
    return getDefaultPatterns();
  }

  // Group by location type (travel vs home)
  const travelLocations = ['bali', 'milan', 'courchevel', 'yacht', 'airport', 'spa_luxe', 'beach'];
  const homeLocations = ['loft', 'home', 'bedroom', 'living', 'bathroom', 'cafe'];

  const travelPosts = posts.filter(p => 
    travelLocations.some(loc => (p.location_key || '').toLowerCase().includes(loc))
  );
  const homePosts = posts.filter(p => 
    homeLocations.some(loc => (p.location_key || '').toLowerCase().includes(loc))
  );

  const avgTravelEngagement = average(travelPosts.map(p => p.engagementScore));
  const avgHomeEngagement = average(homePosts.map(p => p.engagementScore));

  // Group by post type
  const reels = posts.filter(p => p.post_type === 'reel');
  const carousels = posts.filter(p => p.post_type === 'carousel');
  const photos = posts.filter(p => p.post_type === 'photo');

  const avgReelEngagement = average(reels.map(p => p.engagementScore));
  const avgCarouselEngagement = average(carousels.map(p => p.engagementScore));
  const avgPhotoEngagement = average(photos.map(p => p.engagementScore));

  // Group by mood
  const moodGroups = groupBy(posts, 'mood');
  const moodEngagement = Object.entries(moodGroups).map(([mood, moodPosts]) => ({
    mood,
    avgEngagement: average(moodPosts.map(p => p.engagementScore)),
    count: moodPosts.length,
  }));
  const bestMoodData = moodEngagement.sort((a, b) => b.avgEngagement - a.avgEngagement)[0];

  // Group by posting hour
  const hourGroups = groupBy(posts, p => {
    if (!p.posted_at) return 'unknown';
    const hour = new Date(p.posted_at).getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  });
  const timeEngagement = Object.entries(hourGroups).map(([slot, slotPosts]) => ({
    slot,
    avgEngagement: average(slotPosts.map(p => p.engagementScore)),
    count: slotPosts.length,
  }));
  const bestTimeData = timeEngagement.sort((a, b) => b.avgEngagement - a.avgEngagement)[0];

  // Calculate percentage differences
  const travelVsHomePercent = avgHomeEngagement > 0 
    ? Math.round(((avgTravelEngagement - avgHomeEngagement) / avgHomeEngagement) * 100)
    : 0;

  return {
    bestLocationType: avgTravelEngagement > avgHomeEngagement ? 'travel' : 'home',
    locationTypeAdvantage: `${travelVsHomePercent > 0 ? '+' : ''}${travelVsHomePercent}%`,
    travelAvgEngagement: Math.round(avgTravelEngagement),
    homeAvgEngagement: Math.round(avgHomeEngagement),

    bestFormat: getBestFormat(avgReelEngagement, avgCarouselEngagement, avgPhotoEngagement),
    reelAvgEngagement: Math.round(avgReelEngagement),
    carouselAvgEngagement: Math.round(avgCarouselEngagement),
    photoAvgEngagement: Math.round(avgPhotoEngagement),

    bestMood: bestMoodData?.mood || 'cozy',
    moodStats: moodEngagement.slice(0, 5),

    bestTimeSlot: bestTimeData?.slot || 'afternoon',
    timeStats: timeEngagement,
  };
}

function getBestFormat(reel, carousel, photo) {
  const max = Math.max(reel || 0, carousel || 0, photo || 0);
  if (max === reel) return 'reel';
  if (max === carousel) return 'carousel';
  return 'photo';
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(patterns, posts) {
  const recommendations = [];

  // Location recommendation
  if (patterns.bestLocationType === 'travel' && parseInt(patterns.locationTypeAdvantage) > 20) {
    recommendations.push(`Travel content performe ${patterns.locationTypeAdvantage} mieux que home content`);
  } else if (patterns.bestLocationType === 'home') {
    recommendations.push(`Home/cozy content performe mieux — audience apprécie l'authenticité`);
  }

  // Format recommendation
  if (patterns.bestFormat === 'reel' && patterns.reelAvgEngagement > patterns.carouselAvgEngagement * 1.2) {
    recommendations.push(`Les Reels ont ${Math.round((patterns.reelAvgEngagement / patterns.carouselAvgEngagement - 1) * 100)}% plus d'engagement`);
  } else if (patterns.bestFormat === 'carousel') {
    recommendations.push(`Les carousels performent le mieux — privilégier ce format`);
  }

  // Mood recommendation
  if (patterns.bestMood) {
    recommendations.push(`Mood "${patterns.bestMood}" génère le plus d'engagement`);
  }

  // Time recommendation
  if (patterns.bestTimeSlot) {
    const slotNames = {
      morning: '6h-12h',
      afternoon: '12h-18h',
      evening: '18h-22h',
      night: '22h-6h',
    };
    recommendations.push(`Meilleur créneau : ${slotNames[patterns.bestTimeSlot] || patterns.bestTimeSlot}`);
  }

  // Duo recommendation (check for with_character posts)
  const duoPosts = posts.filter(p => p.with_character);
  if (duoPosts.length > 0) {
    const duoAvg = average(duoPosts.map(p => p.engagementScore));
    const soloAvg = average(posts.filter(p => !p.with_character).map(p => p.engagementScore));
    if (duoAvg > soloAvg * 1.3) {
      const boost = Math.round((duoAvg / soloAvg - 1) * 100);
      recommendations.push(`Duo posts ont +${boost}% d'engagement vs solo`);
    }
  }

  return recommendations.length > 0 ? recommendations : ['Pas assez de données pour des recommandations précises'];
}

/**
 * Default analytics when no data available
 */
function getDefaultAnalytics() {
  return {
    totalPostsAnalyzed: 0,
    topPerformers: [],
    patterns: getDefaultPatterns(),
    recommendations: ['Pas assez de données — continuer à poster pour collecter des insights'],
  };
}

function getDefaultPatterns() {
  return {
    bestLocationType: 'unknown',
    locationTypeAdvantage: '0%',
    travelAvgEngagement: 0,
    homeAvgEngagement: 0,
    bestFormat: 'carousel',
    reelAvgEngagement: 0,
    carouselAvgEngagement: 0,
    photoAvgEngagement: 0,
    bestMood: 'cozy',
    moodStats: [],
    bestTimeSlot: 'afternoon',
    timeStats: [],
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function average(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function groupBy(arr, keyOrFn) {
  return arr.reduce((acc, item) => {
    const key = typeof keyOrFn === 'function' ? keyOrFn(item) : item[keyOrFn];
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

/**
 * Format analytics for prompt inclusion
 */
export function formatAnalyticsForPrompt(analytics) {
  if (!analytics || analytics.totalPostsAnalyzed === 0) {
    return `Pas de données analytics disponibles.`;
  }

  const { patterns, recommendations, topPerformers } = analytics;

  let output = `Posts analysés: ${analytics.totalPostsAnalyzed}\n\n`;

  output += `### Top 5 posts:\n`;
  topPerformers.slice(0, 5).forEach((p, i) => {
    output += `${i + 1}. ${p.type} @ ${p.location || 'unknown'} (${p.mood}) — ${p.likes} likes\n`;
  });

  output += `\n### Patterns détectés:\n`;
  output += `- Location: ${patterns.bestLocationType} performe ${patterns.locationTypeAdvantage} mieux\n`;
  output += `- Format: ${patterns.bestFormat} = meilleur engagement\n`;
  output += `- Mood: "${patterns.bestMood}" = le plus engageant\n`;
  output += `- Créneau: ${patterns.bestTimeSlot} = meilleur reach\n`;

  output += `\n### Recommandations:\n`;
  recommendations.forEach(r => {
    output += `→ ${r}\n`;
  });

  return output;
}

