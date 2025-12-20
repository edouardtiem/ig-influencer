/**
 * Hashtag Pools Configuration
 * Optimized hashtags by category/niche for better reach
 */

export const HASHTAG_POOLS = {
  // ═══════════════════════════════════════════════════════════════
  // MILA — Fitness & Photography
  // ═══════════════════════════════════════════════════════════════
  fitness_mila: [
    '#fitnessmotivation', '#gymlife', '#fitgirl', '#workoutmotivation',
    '#personaltrainer', '#fitnessjourney', '#strongwomen', '#fitfam',
    '#pilates', '#yogalife', '#healthylifestyle', '#fitnessgirl',
    '#workout', '#gymgirl', '#fitnessmodel', '#fitspiration',
  ],

  photography_mila: [
    '#photographylovers', '#portraitphotography', '#filmisnotdead',
    '#35mm', '#analogphotography', '#shootfilm', '#createcommune',
    '#makeportraits', '#visualsoflife', '#creativephotography',
  ],

  // ═══════════════════════════════════════════════════════════════
  // ELENA — Fashion & Model
  // ═══════════════════════════════════════════════════════════════
  fashion_elena: [
    '#parisfashion', '#ootd', '#fashionista', '#modellife',
    '#streetstyle', '#frenchstyle', '#luxurylifestyle', '#instafashion',
    '#fashionweek', '#parisianstyle', '#styleinspo', '#fashionmodel',
    '#chic', '#fashionblogger', '#highfashion', '#lookoftheday',
  ],

  model_elena: [
    '#modellife', '#fashionmodel', '#modelwork', '#shootingday',
    '#backstage', '#behindthescenes', '#modelmoment', '#modelposes',
    '#fashionshoot', '#editorialmodel', '#runway', '#castingcall',
  ],

  // ═══════════════════════════════════════════════════════════════
  // SHARED — Lifestyle & Travel
  // ═══════════════════════════════════════════════════════════════
  lifestyle: [
    '#lifestyle', '#dailylife', '#instadaily', '#parisienne',
    '#frenchgirl', '#weekendvibes', '#goodvibes', '#lifestyleblogger',
    '#morningroutine', '#selfcare', '#aesthetic', '#vibes',
    '#livingmybestlife', '#happylife', '#positivevibes', '#moodygrams',
  ],

  paris: [
    '#paris', '#parisianlife', '#parisiangirl', '#parisjetaime',
    '#igersparis', '#topparisphoto', '#pariscity', '#parismaville',
    '#montmartre', '#parisian', '#iloveparis', '#visitparis',
  ],

  travel: [
    '#travelgram', '#wanderlust', '#luxurytravel', '#travelphotography',
    '#europetravel', '#travellife', '#vacation', '#explore',
    '#travelblogger', '#instatravel', '#traveladdict', '#globetrotter',
    '#beautifuldestinations', '#travelholic', '#traveltheworld', '#jetset',
  ],

  spa_wellness: [
    '#spaday', '#wellness', '#relax', '#selfcaresunday',
    '#luxuryspa', '#wellnessretreat', '#treatyourself', '#pampertime',
    '#relaxation', '#spavibes', '#skincare', '#healthylifestyle',
  ],

  beach: [
    '#beachlife', '#summervibes', '#oceanlove', '#beachday',
    '#sunkissed', '#seaside', '#bikinilife', '#beachbabe',
    '#tropicalvibes', '#islandlife', '#sandytoes', '#saltyhair',
  ],

  // ═══════════════════════════════════════════════════════════════
  // DUO — Mila × Elena
  // ═══════════════════════════════════════════════════════════════
  duo: [
    '#bestfriends', '#bff', '#girlgang', '#friendshipgoals',
    '#squadgoals', '#girlsquad', '#besties', '#friendsforever',
    '#girlpower', '#womensupportingwomen', '#sisterhood', '#galpal',
  ],

  // ═══════════════════════════════════════════════════════════════
  // CONTENT TYPE — Reels, Carousel, etc.
  // ═══════════════════════════════════════════════════════════════
  reels: [
    '#reels', '#reelsinstagram', '#reelsvideo', '#instareels',
    '#reelstrending', '#viralreels', '#explorepage', '#fyp',
  ],

  carousel: [
    '#photooftheday', '#photodump', '#instaphoto', '#picoftheday',
    '#instagood', '#photography', '#photocarousel', '#slideshow',
  ],
} as const;

export type HashtagCategory = keyof typeof HASHTAG_POOLS;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get random hashtags from a single category
 */
export function getHashtags(category: HashtagCategory, count: number = 6): string[] {
  const pool = HASHTAG_POOLS[category];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Get random hashtags from multiple categories
 */
export function getMixedHashtags(
  categories: HashtagCategory[],
  countPerCategory: number = 3
): string[] {
  const hashtags: string[] = [];
  for (const category of categories) {
    hashtags.push(...getHashtags(category, countPerCategory));
  }
  // Shuffle and dedupe
  const unique = [...new Set(hashtags)];
  return unique.sort(() => Math.random() - 0.5);
}

/**
 * Format hashtags as a string for caption
 */
export function formatHashtags(hashtags: string[]): string {
  return hashtags.join(' ');
}

/**
 * Get optimized hashtag set for Mila posts
 */
export function getMilaHashtags(
  context: 'home' | 'cafe' | 'street' | 'gym' | 'travel'
): string[] {
  const baseCategories: HashtagCategory[] = ['lifestyle', 'paris'];
  
  switch (context) {
    case 'home':
      return getMixedHashtags([...baseCategories, 'lifestyle'], 3);
    case 'cafe':
      return getMixedHashtags([...baseCategories, 'paris'], 3);
    case 'street':
      return getMixedHashtags([...baseCategories, 'paris'], 3);
    case 'gym':
      return getMixedHashtags(['fitness_mila', 'lifestyle'], 4);
    case 'travel':
      return getMixedHashtags(['travel', 'lifestyle'], 4);
    default:
      return getMixedHashtags(baseCategories, 4);
  }
}

/**
 * Get optimized hashtag set for Elena posts
 */
export function getElenaHashtags(
  context: 'home' | 'cafe' | 'fashion' | 'model' | 'travel' | 'spa'
): string[] {
  const baseCategories: HashtagCategory[] = ['lifestyle', 'fashion_elena'];
  
  switch (context) {
    case 'home':
      return getMixedHashtags([...baseCategories, 'lifestyle'], 3);
    case 'cafe':
      return getMixedHashtags([...baseCategories, 'paris'], 3);
    case 'fashion':
      return getMixedHashtags(['fashion_elena', 'paris'], 4);
    case 'model':
      return getMixedHashtags(['model_elena', 'fashion_elena'], 4);
    case 'travel':
      return getMixedHashtags(['travel', 'lifestyle', 'fashion_elena'], 3);
    case 'spa':
      return getMixedHashtags(['spa_wellness', 'travel', 'lifestyle'], 3);
    default:
      return getMixedHashtags(baseCategories, 4);
  }
}

/**
 * Get hashtags for duo posts (Mila × Elena)
 */
export function getDuoHashtags(): string[] {
  return getMixedHashtags(['duo', 'lifestyle', 'paris'], 3);
}

