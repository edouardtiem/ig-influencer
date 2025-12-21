/**
 * Memories Layer — Shared memories, throwbacks, and duo opportunities
 * 
 * Manages the narrative arcs and cross-account content opportunities
 */

/**
 * Fetch memories and duo opportunities
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase 
 * @param {string} character - 'mila' | 'elena'
 * @returns {Promise<MemoriesData>}
 */
export async function fetchMemories(supabase, character) {
  console.log(`   🤝 Fetching memories for ${character}...`);

  const otherCharacter = character === 'mila' ? 'elena' : 'mila';

  // Fetch timeline events (shared memories/arcs)
  const { data: timelineEvents, error: timelineError } = await supabase
    .from('timeline_events')
    .select('*')
    .contains('characters', [character])
    .eq('shareable', true)
    .order('event_date', { ascending: false });

  if (timelineError) {
    console.log(`      ⚠️  Error fetching timeline: ${timelineError.message}`);
  }

  // Fetch narrative arcs
  const { data: arcs, error: arcsError } = await supabase
    .from('narrative_arcs')
    .select('*')
    .contains('characters', [character])
    .order('end_date', { ascending: false });

  if (arcsError) {
    console.log(`      ⚠️  Error fetching arcs: ${arcsError.message}`);
  }

  // Fetch recent posts from the other character
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const { data: otherPosts, error: otherError } = await supabase
    .from('posts')
    .select('*')
    .eq('character_name', otherCharacter)
    .gte('posted_at', twoDaysAgo.toISOString())
    .order('posted_at', { ascending: false })
    .limit(5);

  if (otherError) {
    console.log(`      ⚠️  Error fetching other character posts: ${otherError.message}`);
  }

  // Fetch duo posts to calculate stats
  const { data: duoPosts, error: duoError } = await supabase
    .from('posts')
    .select('*')
    .eq('character_name', character)
    .not('with_character', 'is', null)
    .order('posted_at', { ascending: false })
    .limit(10);

  // Fetch relationship details
  const { data: relationship } = await supabase
    .from('relationships')
    .select('*')
    .or(`character_1.eq.${character},character_2.eq.${character}`)
    .single();

  // Process available arcs for throwbacks
  const availableArcs = processArcs(timelineEvents || [], arcs || [], character);

  // Process other character's activity
  const otherCharacterActivity = processOtherActivity(otherPosts || [], otherCharacter);

  // Calculate duo stats
  const duoStats = calculateDuoStats(duoPosts || []);

  // Generate suggestions
  const suggestions = generateSuggestions(
    availableArcs,
    otherCharacterActivity,
    duoStats,
    relationship
  );

  const result = {
    availableArcs,
    otherCharacterActivity,
    duoStats,
    relationship: relationship ? {
      type: relationship.relationship_type,
      insideJokes: relationship.inside_jokes || [],
      sharedMemories: relationship.shared_memories || [],
    } : null,
    suggestions,
  };

  console.log(`      ✅ Found ${availableArcs.length} throwback opportunities`);
  console.log(`      ${otherCharacterActivity ? `${otherCharacter} posted recently` : 'No recent activity from other'}`);

  return result;
}

/**
 * Process timeline events into usable arc data
 */
function processArcs(timelineEvents, narrativeArcs, character) {
  const arcs = [];

  // Process timeline events as throwback opportunities
  timelineEvents.forEach(event => {
    // Check if it's a trip or significant event
    const isTrip = event.event_type === 'trip' || event.event_type === 'vacation';
    const isShared = event.characters?.includes('mila') && event.characters?.includes('elena');

    // Calculate days since event
    const eventDate = new Date(event.event_date);
    const daysSince = Math.floor((Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24));

    // Only include events older than 2 weeks (good for throwbacks)
    if (daysSince < 14) return;

    arcs.push({
      id: event.id,
      type: isTrip ? 'trip' : event.event_type,
      name: event.title,
      description: event.description,
      date: event.event_date,
      location: event.location,
      isShared,
      emotionalTone: event.emotional_tone,
      daysSince,
      // Estimate content remaining (could be stored in DB)
      contentRemaining: estimateContentRemaining(event, daysSince),
      lastPosted: event.last_posted_at || null,
    });
  });

  // Sort by relevance (recent trips with content remaining)
  return arcs.sort((a, b) => {
    // Prioritize trips
    if (a.type === 'trip' && b.type !== 'trip') return -1;
    if (b.type === 'trip' && a.type !== 'trip') return 1;
    // Then by content remaining
    return b.contentRemaining - a.contentRemaining;
  }).slice(0, 5);
}

/**
 * Estimate content remaining for an arc
 */
function estimateContentRemaining(event, daysSince) {
  // Trips have more content potential
  if (event.event_type === 'trip') {
    // Older trips have been mined more
    if (daysSince > 180) return 3; // 6+ months old
    if (daysSince > 90) return 5;  // 3-6 months old
    if (daysSince > 30) return 8;  // 1-3 months old
    return 10; // Recent trip
  }
  // Other events have less content
  return 2;
}

/**
 * Process other character's recent posts
 */
function processOtherActivity(posts, otherCharacter) {
  if (!posts || posts.length === 0) {
    return null;
  }

  const lastPost = posts[0];
  const daysAgo = Math.floor((Date.now() - new Date(lastPost.posted_at).getTime()) / (1000 * 60 * 60 * 24));

  // Analyze if the post is relevant for a response
  const isAboutTravel = lastPost.mood === 'travel' || lastPost.mood === 'adventure' ||
    (lastPost.caption && /travel|vacation|miss|remember|throwback/i.test(lastPost.caption));
  
  const isAboutFriend = lastPost.with_character || 
    (lastPost.caption && /bestie|bff|friend|together|us|nous/i.test(lastPost.caption));

  return {
    character: otherCharacter,
    lastPost: {
      caption: lastPost.caption,
      mood: lastPost.mood,
      location: lastPost.location_key,
      postedAt: lastPost.posted_at,
    },
    daysAgo,
    isAboutTravel,
    isAboutFriend,
    respondOpportunity: (isAboutTravel || isAboutFriend) && daysAgo <= 2,
  };
}

/**
 * Calculate duo post statistics
 */
function calculateDuoStats(duoPosts) {
  if (!duoPosts || duoPosts.length === 0) {
    return {
      lastDuoPost: null,
      daysSinceLastDuo: null,
      totalDuoPosts: 0,
      avgEngagement: 0,
    };
  }

  const lastDuo = duoPosts[0];
  const daysSinceLastDuo = Math.floor(
    (Date.now() - new Date(lastDuo.posted_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate average engagement of duo posts
  const avgEngagement = duoPosts.reduce((sum, p) => 
    sum + (p.likes_count || 0) + (p.comments_count || 0) * 3, 0
  ) / duoPosts.length;

  return {
    lastDuoPost: {
      withCharacter: lastDuo.with_character,
      postedAt: lastDuo.posted_at,
      location: lastDuo.location_key,
    },
    daysSinceLastDuo,
    totalDuoPosts: duoPosts.length,
    avgEngagement: Math.round(avgEngagement),
  };
}

/**
 * Generate actionable suggestions
 */
function generateSuggestions(arcs, otherActivity, duoStats, relationship) {
  const suggestions = [];

  // Check if duo is overdue (more than 10 days)
  if (duoStats.daysSinceLastDuo && duoStats.daysSinceLastDuo > 10) {
    suggestions.push({
      type: 'duo',
      priority: 'high',
      message: `Duo content overdue (${duoStats.daysSinceLastDuo} jours) — boost engagement`,
    });
  }

  // Check if other character posted something relevant
  if (otherActivity?.respondOpportunity) {
    suggestions.push({
      type: 'respond',
      priority: 'high',
      message: `${otherActivity.character} a posté du contenu travel/nostalgie — opportunité de réponse`,
      context: otherActivity.lastPost.caption?.substring(0, 50),
    });
  }

  // Check for good throwback opportunities
  const bestThrowback = arcs.find(a => a.type === 'trip' && a.contentRemaining > 3);
  if (bestThrowback) {
    suggestions.push({
      type: 'throwback',
      priority: 'medium',
      message: `Throwback ${bestThrowback.name} possible (${bestThrowback.contentRemaining} posts restants)`,
      arcId: bestThrowback.id,
    });
  }

  // Suggest using inside jokes occasionally
  if (relationship?.insideJokes?.length > 0 && Math.random() > 0.7) {
    const joke = relationship.insideJokes[Math.floor(Math.random() * relationship.insideJokes.length)];
    suggestions.push({
      type: 'inside_joke',
      priority: 'low',
      message: `Possible référence à: "${joke}"`,
    });
  }

  return suggestions;
}

/**
 * Format memories for prompt inclusion
 */
export function formatMemoriesForPrompt(memories, character) {
  if (!memories) {
    return `Pas de données mémoires disponibles.`;
  }

  const otherCharacter = character === 'mila' ? 'Elena' : 'Mila';
  let output = '';

  // Available arcs for throwbacks
  if (memories.availableArcs.length > 0) {
    output += `### Arcs disponibles pour throwbacks:\n`;
    memories.availableArcs.slice(0, 3).forEach(arc => {
      const shared = arc.isShared ? ' (avec ' + otherCharacter + ')' : '';
      output += `- **${arc.name}**${shared} — ${arc.location}, il y a ${arc.daysSince}j\n`;
      output += `  Contenu restant: ~${arc.contentRemaining} posts | Tone: ${arc.emotionalTone}\n`;
    });
  }

  // Other character activity
  if (memories.otherCharacterActivity) {
    const other = memories.otherCharacterActivity;
    output += `\n### Activité de ${otherCharacter} (dernières 48h):\n`;
    output += `Dernier post: "${other.lastPost.caption?.substring(0, 60) || 'N/A'}..."\n`;
    output += `Mood: ${other.lastPost.mood || 'N/A'} | Location: ${other.lastPost.location || 'N/A'}\n`;
    if (other.respondOpportunity) {
      output += `⚡ **OPPORTUNITÉ**: Répondre à ce post avec contenu lié\n`;
    }
  }

  // Duo stats
  if (memories.duoStats) {
    output += `\n### Stats duo:\n`;
    if (memories.duoStats.daysSinceLastDuo !== null) {
      output += `Dernier duo: il y a ${memories.duoStats.daysSinceLastDuo} jours\n`;
      if (memories.duoStats.daysSinceLastDuo > 10) {
        output += `⚠️ Duo overdue — les posts duo ont +65% engagement en moyenne\n`;
      }
    } else {
      output += `Pas de duo récent — opportunité!\n`;
    }
  }

  // Suggestions
  if (memories.suggestions.length > 0) {
    output += `\n### Suggestions:\n`;
    memories.suggestions.forEach(s => {
      const icon = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢';
      output += `${icon} ${s.message}\n`;
    });
  }

  return output || 'Pas de souvenirs partagés disponibles.';
}

