/**
 * Relationship Layer — Track the unspoken romance
 * 
 * THE SECRET: Mila & Elena are together, but it's NEVER said.
 * We only hint through content patterns.
 * 
 * This creates:
 * - Long-term mystery/speculation that keeps people engaged
 * - LGBTQ+ audience attraction (who will "know" without being told)
 * - Plausible deniability (just "best friends")
 * - Endless teasing content opportunities
 */

// Teasing levels - subtle progression over months
const TEASING_LEVELS = {
  1: { name: 'parallel_lives', description: 'Same locations, same day (unspoken)' },
  2: { name: 'best_friends', description: 'Together, tagging, obvious friendship' },
  3: { name: 'intimate_hints', description: 'Coffee for two, hand almost touching, shared items' },
  4: { name: 'couple_energy', description: 'Valentine\'s "solo", matching outfits, same hotel' },
  5: { name: 'undeniable', description: 'Almost caught moments, fans piece it together' },
};

// Types of hints (never explicit) - with frequency guidelines
const HINT_CATALOG = {
  // === Level 1-2: Friendship visible ===
  tag_each_other: {
    level: 2,
    frequency: { perWeek: 2 },
    description: 'Tag @other in caption or comment',
    examples: ['Miss you @elenav.paris 💕', 'Cette vue avec @mila_verne ✨'],
  },
  duo_content: {
    level: 2,
    frequency: { perWeek: 1 },
    description: 'Both visible in same content',
    examples: ['Brunch avec ma best', 'Shooting day together'],
  },
  
  // === Level 3: "Best friends" with subtext ===
  matching_outfits: {
    level: 3,
    frequency: { perMonth: 2 },
    note: 'Never same day - fans notice later',
    description: 'Wear similar outfit days apart',
    examples: ['Same beige blazer style', 'Both in cream knit'],
  },
  same_location_same_day: {
    level: 3,
    frequency: { perWeek: 1 },
    note: 'Never in same frame',
    description: 'Both post from same/similar location same day',
    examples: ['Both at Montmartre', 'Both in "morning coffee" aesthetic'],
  },
  morning_same_place: {
    level: 3,
    frequency: { perMonth: 1 },
    note: 'Both post "morning" from similar room aesthetic',
    description: 'Morning posts that suggest same location',
    examples: ['Similar bed sheets visible', 'Same morning light quality'],
  },
  tender_caption: {
    level: 3,
    frequency: { perWeek: 1 },
    note: 'Subtly romantic language about "best friend"',
    description: 'Caption with romantic undertone',
    examples: ['Ma personne préférée 💕', 'She makes everything better'],
  },
  
  // === Level 4: Couple energy (fans will notice) ===
  two_cups: {
    level: 4,
    frequency: { perMonth: 2 },
    note: 'Never say who the second is for',
    description: '2 coffee cups, 2 wine glasses, etc visible',
    examples: ['Morning coffee (2 cups on table)', 'Cozy night (2 glasses)'],
  },
  hand_in_frame: {
    level: 4,
    frequency: { perMonth: 1 },
    note: 'Feminine hand visible, never say whose',
    description: 'Another hand visible in frame',
    examples: ['Hand passing coffee', 'Hand on shoulder from behind'],
  },
  shared_item: {
    level: 4,
    frequency: { perMonth: 1 },
    note: 'Elena wears Mila\'s necklace, Mila wears Elena\'s bracelet',
    description: 'Wear something recognizable as the other\'s',
    examples: ['Mila wearing gold chunky bracelet', 'Elena with star necklace'],
  },
  valentines_parallel: {
    level: 4,
    frequency: { perYear: 1 },
    note: 'Both post "solo" but suspiciously happy',
    description: 'Valentine\'s Day - both single but glowing',
    examples: ['Self-love day 💕', 'My favorite person (selfie)'],
  },
  
  // === Level 5: Almost explicit (rare, high engagement) ===
  same_hotel_room: {
    level: 5,
    frequency: { perYear: 2 },
    note: 'Different angles, fans piece together same room',
    description: 'Travel posts reveal same hotel room',
    examples: ['Same view from window', 'Same distinctive furniture'],
  },
  caption_slip: {
    level: 5,
    frequency: { perYear: 2 },
    note: '"We" instead of "I", maybe "correct" in comments',
    description: 'Accidental romantic language',
    examples: ['Our favorite spot... I mean my*', 'Home with- home alone vibes'],
  },
  caught_moment: {
    level: 5,
    frequency: { perYear: 1 },
    note: 'Photo that looks like intimate moment interrupted',
    description: 'Almost caught together',
    examples: ['Messy bed + 2 coffee cups', 'Quick selfie, other person blurred out'],
  },
};

/**
 * Get current teasing level based on account age and follower count
 */
function getCurrentTeasingLevel(accountData = {}) {
  const { followerCount = 0, accountAgeMonths = 1 } = accountData;
  
  // Start slow, build up over time
  if (accountAgeMonths < 1) return 1;
  if (accountAgeMonths < 2) return 2;
  if (accountAgeMonths < 4 || followerCount < 5000) return 3;
  if (accountAgeMonths < 8 || followerCount < 20000) return 4;
  return 5;
}

/**
 * Check if a hint type is due based on last usage
 */
function isHintDue(hintType, lastUsedDate, frequency) {
  if (!lastUsedDate) return true;
  
  const daysSinceUsed = Math.floor((Date.now() - new Date(lastUsedDate).getTime()) / (1000 * 60 * 60 * 24));
  
  if (frequency.perWeek) {
    return daysSinceUsed >= Math.floor(7 / frequency.perWeek);
  }
  if (frequency.perMonth) {
    return daysSinceUsed >= Math.floor(30 / frequency.perMonth);
  }
  if (frequency.perYear) {
    return daysSinceUsed >= Math.floor(365 / frequency.perYear);
  }
  
  return daysSinceUsed >= 7; // Default: weekly
}

/**
 * Get suggested hint for today
 */
function getSuggestedHint(currentLevel, recentHints = [], otherCharacterLastPost = null) {
  const availableHints = Object.entries(HINT_CATALOG)
    .filter(([_, hint]) => hint.level <= currentLevel)
    .filter(([type, _]) => !recentHints.slice(0, 3).includes(type)) // Avoid last 3 hints
    .map(([type, hint]) => ({ type, ...hint }));
  
  if (availableHints.length === 0) return null;
  
  // Prioritize hints based on context
  const prioritized = availableHints.sort((a, b) => {
    // If other character posted from specific location, suggest same_location_same_day
    if (otherCharacterLastPost?.location && a.type === 'same_location_same_day') return -1;
    
    // Prefer higher level hints (more engagement) but not too often
    return b.level - a.level;
  });
  
  // Random selection with bias towards top priorities
  const weights = prioritized.map((_, i) => Math.max(1, prioritized.length - i));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < prioritized.length; i++) {
    random -= weights[i];
    if (random <= 0) return prioritized[i];
  }
  
  return prioritized[0];
}

/**
 * Main function: Fetch relationship context for scheduler
 */
export async function fetchRelationship(supabase, character) {
  const otherCharacter = character === 'mila' ? 'elena' : 'mila';
  
  try {
    // Get recent hints used (from daily_schedules metadata)
    const { data: recentSchedules } = await supabase
      .from('daily_schedules')
      .select('generation_reasoning')
      .eq('character', character)
      .order('schedule_date', { ascending: false })
      .limit(14);
    
    // Extract hints from recent schedules
    const recentHints = recentSchedules
      ?.map(s => {
        try {
          const reasoning = JSON.parse(s.generation_reasoning || '{}');
          return reasoning.relationship_hint;
        } catch { return null; }
      })
      .filter(Boolean) || [];
    
    // Get other character's last post location
    const { data: otherLastSchedule } = await supabase
      .from('daily_schedules')
      .select('scheduled_posts')
      .eq('character', otherCharacter)
      .order('schedule_date', { ascending: false })
      .limit(1)
      .single();
    
    const otherLastPost = otherLastSchedule?.scheduled_posts?.[0] || null;
    
    // Calculate current teasing level (for now, fixed at 3 - intimate hints)
    const currentLevel = 3; // Will be dynamic based on account metrics later
    
    // Get suggested hint
    const suggestedHint = getSuggestedHint(currentLevel, recentHints, otherLastPost);
    
    return {
      currentLevel,
      levelName: TEASING_LEVELS[currentLevel]?.name || 'unknown',
      suggestedHint,
      recentHints: recentHints.slice(0, 5),
      otherCharacter,
      otherLastPost: otherLastPost ? {
        location: otherLastPost.location_name,
        mood: otherLastPost.mood,
        date: otherLastSchedule?.schedule_date,
      } : null,
      rules: [
        'NEVER explicitly confirm the relationship',
        'Let comments speculate — never deny, never confirm',
        'If asked directly, deflect with "she\'s my best friend 💕"',
        'Subtext > text — show, don\'t tell',
        'Fans piecing it together = engagement gold',
      ],
    };
  } catch (error) {
    console.error('⚠️ Relationship layer error:', error.message);
    return {
      currentLevel: 3,
      levelName: 'intimate_hints',
      suggestedHint: { type: 'tender_caption', level: 3 },
      recentHints: [],
      otherCharacter,
      otherLastPost: null,
      rules: ['NEVER explicitly confirm the relationship'],
    };
  }
}

/**
 * Format relationship data for Claude prompt
 */
export function formatRelationshipForPrompt(relationshipData, character) {
  const other = character === 'mila' ? 'Elena (@elenav.paris)' : 'Mila (@mila_verne)';
  const otherShort = character === 'mila' ? 'Elena' : 'Mila';
  
  const hintSection = relationshipData.suggestedHint 
    ? `**💡 Hint suggéré**: ${relationshipData.suggestedHint.type}
   Description: ${relationshipData.suggestedHint.description}
   ${relationshipData.suggestedHint.note ? `⚠️ Note: ${relationshipData.suggestedHint.note}` : ''}
   Exemples: ${relationshipData.suggestedHint.examples?.slice(0, 2).join(', ') || 'N/A'}`
    : '**💡 Hint suggéré**: Aucun spécifique — contenu normal';

  const otherPostSection = relationshipData.otherLastPost
    ? `**📍 Dernier post de ${otherShort}**: ${relationshipData.otherLastPost.location} (${relationshipData.otherLastPost.mood})
   → Opportunité: poster depuis un lieu similaire ou mentionner ${otherShort}`
    : `**📍 Dernier post de ${otherShort}**: Non disponible`;

  return `### 💕 THE SECRET — Relation avec ${other}

**Ce que le public voit**: Deux meilleures amies inséparables
**Ce qu'on suggère subtilement**: Plus que ça, peut-être? 👀

**Niveau de teasing actuel**: ${relationshipData.currentLevel}/5 (${relationshipData.levelName})

${hintSection}

${otherPostSection}

**Hints récents** (éviter répétition): ${relationshipData.recentHints.join(', ') || 'Aucun'}

**🚨 RÈGLES D'OR**:
${relationshipData.rules.map(r => `- ${r}`).join('\n')}

**Comment intégrer un hint**:
- Dans la CAPTION: tendresse, "ma personne", emoji 💕
- Dans l'IMAGE: 2 tasses, main visible, item de l'autre
- Dans le TIMING: poster depuis même lieu que ${otherShort}
- JAMAIS: dire "couple", "ensemble", "relationship"`;
}

export { HINT_CATALOG, TEASING_LEVELS };

