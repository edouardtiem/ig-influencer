/**
 * History Layer — Analyze recent posts to understand narrative context
 * 
 * Infers where the character "is" in their story and what makes sense next
 * Now includes NARRATIVE ARCS for coherent storytelling over multiple days
 */

// ===========================================
// NARRATIVE ARCS — Multi-day storytelling
// ===========================================

const NARRATIVE_ARCS = {
  fashion_week: {
    id: 'fashion_week',
    name: 'Fashion Week',
    trigger: 'Fashion Week event detected in context',
    duration: '5-7 days',
    locations: ['milan_fashion', 'london_mayfair', 'nyc_soho', 'paris', 'opera_garnier'],
    story: 'Elena couvre la Fashion Week — backstage, shows, parties',
    moods: ['fashion', 'work', 'adventure'],
    outfitStyle: 'designer, editorial, street-style chic',
  },
  vacation_trip: {
    id: 'vacation_trip',
    name: 'Escapade Vacances',
    trigger: 'Recent travel to vacation destination',
    duration: '3-5 days',
    locations: ['maldives', 'bali', 'ibiza', 'mykonos', 'yacht', 'st_tropez'],
    story: 'Elena en vacances — détente, plage, pool, sunset',
    moods: ['travel', 'relax', 'adventure'],
    outfitStyle: 'bikini, resort wear, sundress',
  },
  paris_life: {
    id: 'paris_life',
    name: 'Vie Parisienne',
    trigger: 'Default when at home or returned from travel > 2 days',
    duration: '3-4 days',
    locations: ['loft_living', 'loft_bedroom', 'cafe_paris', 'tuileries', 'spa_paris'],
    story: 'Vie quotidienne parisienne — routine, cozy, lifestyle',
    moods: ['cozy', 'relax', 'fashion'],
    outfitStyle: 'casual chic, loungewear, lingerie at home',
  },
  recovery_mode: {
    id: 'recovery_mode',
    name: 'Recovery Mode',
    trigger: 'Just returned from travel (< 2 days)',
    duration: '2-3 days',
    locations: ['loft_bedroom', 'spa_paris', 'bathroom_luxe', 'cafe_paris'],
    story: 'Récupération post-voyage — repos, self-care, cozy',
    moods: ['cozy', 'relax'],
    outfitStyle: 'robe, peignoir, loungewear, lingerie cozy',
  },
  work_mode: {
    id: 'work_mode',
    name: 'Mode Travail',
    trigger: 'Multiple fitness/work moods recently',
    duration: '2-3 days',
    locations: ['loft_living', 'studio_photo', 'spa_paris'],
    story: 'Elena en mode travail — shootings, sport, productivité',
    moods: ['work', 'fitness'],
    outfitStyle: 'sport luxe, athleisure, professional',
  },
};

/**
 * Fetch history and infer narrative context
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase 
 * @param {string} character - 'mila' | 'elena'
 * @returns {Promise<HistoryData>}
 */
export async function fetchHistory(supabase, character) {
  console.log(`   📜 Fetching history for ${character}...`);

  // Get posts from the last 7 days from scheduled_posts (has complete location data)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoDate = sevenDaysAgo.toISOString().split('T')[0];

  const { data: recentPosts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('character', character)
    .eq('status', 'posted')
    .gte('scheduled_date', sevenDaysAgoDate)
    .order('scheduled_date', { ascending: false })
    .order('scheduled_time', { ascending: false });

  if (error) {
    console.log(`      ⚠️  Error fetching posts: ${error.message}`);
    return getDefaultHistory();
  }

  // Map scheduled_posts fields to expected format
  const posts = (recentPosts || []).map(p => ({
    id: p.id,
    character_name: p.character,
    post_type: p.post_type,
    location_key: p.location_key,
    location_name: p.location_name,
    mood: p.mood,
    caption: p.caption,
    with_character: null, // scheduled_posts doesn't track this yet
    posted_at: `${p.scheduled_date}T${p.scheduled_time}`,
  }));
  
  console.log(`      Found ${posts.length} posts in last 7 days`);

  // Infer narrative from posts
  const narrative = inferNarrative(posts);
  
  // Get locations to avoid (last 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const recentLocations = posts
    .filter(p => {
      const postDate = new Date(p.posted_at);
      return postDate >= threeDaysAgo;
    })
    .map(p => p.location_key)
    .filter(Boolean);
  const avoidList = [...new Set(recentLocations)];
  
  if (avoidList.length > 0) {
    console.log(`      🚫 Avoid locations: ${avoidList.join(', ')}`);
  }

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
    'spa_mountains': 'spa Alpes',
    'beach': 'plage',
    'paris': 'Paris',
    'loft': 'Paris',
    'home': 'Paris',
    'maldives': 'Maldives',
    'dubai': 'Dubai',
    'mykonos': 'Mykonos',
    'ibiza': 'Ibiza',
    'nyc': 'New York',
    'london': 'Londres',
    'st_tropez': 'St Tropez',
  };

  for (const [key, value] of Object.entries(locationMap)) {
    if (locationKey.toLowerCase().includes(key)) {
      return value;
    }
  }

  return locationKey;
}

/**
 * Suggest a narrative arc based on history and context
 * @param {object} narrative - The inferred narrative from posts
 * @param {object} context - Real-time context (from Perplexity)
 * @returns {object} The suggested narrative arc
 */
export function suggestNarrativeArc(narrative, context = null) {
  const { locationType, daysSinceTravel, recentMoods } = narrative;
  
  // Check for Fashion Week (detected by Perplexity context)
  if (context?.fashionEvents?.some(e => 
    e.toLowerCase().includes('fashion week') || 
    e.toLowerCase().includes('fw')
  )) {
    return NARRATIVE_ARCS.fashion_week;
  }
  
  // Just returned from travel (< 2 days) → Recovery mode
  if (locationType === 'home' && daysSinceTravel !== null && daysSinceTravel <= 2) {
    return NARRATIVE_ARCS.recovery_mode;
  }
  
  // Currently traveling → Vacation trip
  if (locationType === 'travel') {
    return NARRATIVE_ARCS.vacation_trip;
  }
  
  // Heavy work/fitness moods recently → Work mode
  const workMoodCount = recentMoods.filter(m => m === 'work' || m === 'fitness').length;
  if (workMoodCount >= 2) {
    return NARRATIVE_ARCS.work_mode;
  }
  
  // Default: Paris life
  return NARRATIVE_ARCS.paris_life;
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
 * @param {object} history - History data
 * @param {object} narrativeArc - Optional narrative arc (from suggestNarrativeArc)
 */
export function formatHistoryForPrompt(history, narrativeArc = null) {
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

  // Add narrative arc if provided
  if (narrativeArc) {
    output += `\n### 📚 ARC NARRATIF ACTUEL:\n`;
    output += `**${narrativeArc.name}** — "${narrativeArc.story}"\n`;
    output += `→ Durée suggérée: ${narrativeArc.duration}\n`;
    output += `→ Lieux recommandés: ${narrativeArc.locations.slice(0, 5).join(', ')}\n`;
    output += `→ Moods: ${narrativeArc.moods.join(', ')}\n`;
    output += `→ Style tenues: ${narrativeArc.outfitStyle}\n`;
    output += `⚠️ IMPORTANT: Rester cohérent avec cet arc pour les prochains posts\n`;
  }

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

