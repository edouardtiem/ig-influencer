/**
 * History Layer — Analyze recent posts to understand narrative context
 * 
 * Infers where the character "is" in their story and what makes sense next
 */

/**
 * Fetch history and infer narrative context
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase 
 * @param {string} character - 'mila' | 'elena'
 * @returns {Promise<HistoryData>}
 */
export async function fetchHistory(supabase, character) {
  console.log(`   📜 Fetching history for ${character}...`);

  // Get posts from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentPosts, error } = await supabase
    .from('posts')
    .select('*')
    .eq('character_name', character)
    .gte('posted_at', sevenDaysAgo.toISOString())
    .order('posted_at', { ascending: false });

  if (error) {
    console.log(`      ⚠️  Error fetching posts: ${error.message}`);
    return getDefaultHistory();
  }

  const posts = recentPosts || [];
  console.log(`      Found ${posts.length} posts in last 7 days`);

  // Infer narrative from posts
  const narrative = inferNarrative(posts);
  
  // Get locations to avoid (last 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentLocations = posts
    .filter(p => new Date(p.posted_at) >= threeDaysAgo)
    .map(p => p.location_key)
    .filter(Boolean);
  const avoidList = [...new Set(recentLocations)];

  // Get last duo post
  const lastDuoPost = posts.find(p => p.with_character);
  const daysSinceLastDuo = lastDuoPost
    ? Math.floor((Date.now() - new Date(lastDuoPost.posted_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const result = {
    recentPosts: posts.slice(0, 10).map(p => ({
      id: p.id,
      type: p.post_type,
      location: p.location_key,
      locationName: p.location_name,
      mood: p.mood,
      caption: p.caption,
      withCharacter: p.with_character,
      postedAt: p.posted_at,
      daysAgo: Math.floor((Date.now() - new Date(p.posted_at).getTime()) / (1000 * 60 * 60 * 24)),
    })),
    narrative,
    avoidList,
    lastDuoPost: lastDuoPost ? {
      withCharacter: lastDuoPost.with_character,
      daysAgo: daysSinceLastDuo,
    } : null,
  };

  console.log(`      ✅ Narrative: ${narrative.storyContext}`);
  console.log(`      Avoid list: ${avoidList.join(', ') || 'none'}`);

  return result;
}

/**
 * Infer narrative from post history
 */
function inferNarrative(posts) {
  if (!posts || posts.length === 0) {
    return {
      currentLocation: 'paris',
      locationType: 'home',
      daysSinceTravel: null,
      lastTripDestination: null,
      recentMoods: [],
      storyContext: 'Pas d\'historique — libre de commencer n\'importe où',
    };
  }

  // Categorize locations
  const travelKeywords = ['bali', 'milan', 'courchevel', 'yacht', 'airport', 'spa_luxe', 'beach', 'mountains', 'hotel'];
  const homeKeywords = ['loft', 'home', 'bedroom', 'living', 'bathroom', 'cafe', 'gym', 'paris'];

  // Analyze recent posts to determine current "location"
  const recentPosts = posts.slice(0, 5);
  
  // Check if currently traveling or at home
  let currentLocation = 'paris';
  let locationType = 'home';
  let lastTripDestination = null;
  let daysSinceTravel = null;

  // Find the most recent travel post
  const travelPost = posts.find(p => 
    travelKeywords.some(kw => (p.location_key || '').toLowerCase().includes(kw))
  );

  // Find the most recent home post
  const homePost = posts.find(p => 
    homeKeywords.some(kw => (p.location_key || '').toLowerCase().includes(kw))
  );

  if (travelPost && homePost) {
    const travelDate = new Date(travelPost.posted_at);
    const homeDate = new Date(homePost.posted_at);

    if (travelDate > homeDate) {
      // Most recent is travel — character is traveling
      locationType = 'travel';
      currentLocation = extractLocation(travelPost.location_key);
      daysSinceTravel = 0;
    } else {
      // Most recent is home — character has returned
      locationType = 'home';
      currentLocation = 'paris';
      lastTripDestination = extractLocation(travelPost.location_key);
      daysSinceTravel = Math.floor((Date.now() - travelDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  } else if (travelPost && !homePost) {
    locationType = 'travel';
    currentLocation = extractLocation(travelPost.location_key);
    daysSinceTravel = 0;
  } else {
    locationType = 'home';
    currentLocation = 'paris';
  }

  // Get recent moods
  const recentMoods = [...new Set(recentPosts.map(p => p.mood).filter(Boolean))].slice(0, 3);

  // Build story context
  let storyContext = '';
  if (locationType === 'travel') {
    storyContext = `${capitalize(character(posts[0]))} est actuellement en voyage à ${currentLocation}`;
  } else if (lastTripDestination && daysSinceTravel !== null && daysSinceTravel <= 7) {
    storyContext = `${capitalize(character(posts[0]))} est rentrée de ${lastTripDestination} il y a ${daysSinceTravel} jour(s) — repos à Paris`;
  } else if (lastTripDestination && daysSinceTravel !== null) {
    storyContext = `${capitalize(character(posts[0]))} est à Paris depuis ${daysSinceTravel} jours (dernier voyage: ${lastTripDestination})`;
  } else {
    storyContext = `${capitalize(character(posts[0]))} est à Paris — vie quotidienne`;
  }

  // Check for patterns that suggest what's next
  const lastThreeMoods = recentPosts.slice(0, 3).map(p => p.mood);
  if (lastThreeMoods.every(m => m === 'cozy' || m === 'relax')) {
    storyContext += ' — peut-être temps pour du contenu plus dynamique';
  } else if (lastThreeMoods.every(m => m === 'fitness' || m === 'work')) {
    storyContext += ' — peut-être temps pour du contenu détente';
  }

  return {
    currentLocation,
    locationType,
    daysSinceTravel,
    lastTripDestination,
    recentMoods,
    storyContext,
  };
}

function extractLocation(locationKey) {
  if (!locationKey) return 'unknown';
  
  const locationMap = {
    'bali': 'Bali',
    'milan': 'Milan',
    'courchevel': 'Courchevel',
    'yacht': 'Méditerranée',
    'airport': 'en transit',
    'spa_luxe': 'spa montagne',
    'beach': 'plage',
    'paris': 'Paris',
    'loft': 'Paris',
    'home': 'Paris',
  };

  for (const [key, value] of Object.entries(locationMap)) {
    if (locationKey.toLowerCase().includes(key)) {
      return value;
    }
  }

  return locationKey;
}

function character(post) {
  return post?.character_name || 'elle';
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getDefaultHistory() {
  return {
    recentPosts: [],
    narrative: {
      currentLocation: 'paris',
      locationType: 'home',
      daysSinceTravel: null,
      lastTripDestination: null,
      recentMoods: [],
      storyContext: 'Pas d\'historique — libre de commencer n\'importe où',
    },
    avoidList: [],
    lastDuoPost: null,
  };
}

/**
 * Format history for prompt inclusion
 */
export function formatHistoryForPrompt(history) {
  if (!history || history.recentPosts.length === 0) {
    return `Pas d'historique récent.\nNarrative: Libre de commencer n'importe où.`;
  }

  let output = `### 5 derniers posts:\n`;
  history.recentPosts.slice(0, 5).forEach((p, i) => {
    const daysAgo = p.daysAgo === 0 ? 'Aujourd\'hui' : p.daysAgo === 1 ? 'Hier' : `Il y a ${p.daysAgo}j`;
    const duo = p.withCharacter ? ` (avec ${p.withCharacter})` : '';
    output += `${i + 1}. ${daysAgo}: ${p.type} @ ${p.locationName || p.location}${duo}\n`;
    if (p.caption) {
      output += `   "${p.caption.substring(0, 50)}..."\n`;
    }
  });

  output += `\n### Narrative actuelle:\n`;
  output += `→ ${history.narrative.storyContext}\n`;
  output += `→ Location type: ${history.narrative.locationType}\n`;
  output += `→ Moods récents: ${history.narrative.recentMoods.join(', ') || 'variés'}\n`;

  if (history.avoidList.length > 0) {
    output += `\n### Lieux à éviter (postés récemment):\n`;
    output += history.avoidList.join(', ');
  }

  if (history.lastDuoPost) {
    output += `\n\n### Dernier duo:\n`;
    output += `Avec ${history.lastDuoPost.withCharacter}, il y a ${history.lastDuoPost.daysAgo} jours`;
  }

  return output;
}

