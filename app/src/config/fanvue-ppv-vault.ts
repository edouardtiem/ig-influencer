/**
 * Fanvue PPV Content Vault Configuration
 * 
 * Defines available PPV content for the DM automation system.
 * Content is stored in Cloudinary and referenced here.
 * 
 * Categories:
 * - teaser: Free preview content (low price, high conversion)
 * - soft: Lingerie, bikini, suggestive (2-4€)
 * - spicy: More revealing, sensual (5-8€)
 * - explicit: Full explicit content (10€+)
 * 
 * To add content:
 * 1. Upload to Cloudinary (elena-fanvue-ppv folder)
 * 2. Add entry here with all metadata
 * 3. Run seed script to populate database
 */

export interface PPVContentConfig {
  name: string;
  description: string;
  price: number;  // Price in cents (299 = 2.99€)
  category: 'teaser' | 'soft' | 'spicy' | 'explicit';
  cloudinaryUrl: string;
  teaserUrl?: string;  // Blurred/cropped preview
  tags: string[];
  targetTone: string[];  // Which tone_preference this appeals to
}

// ===========================================
// PPV CONTENT CATALOG
// ===========================================

export const PPV_CONTENT_CATALOG: PPVContentConfig[] = [
  // ============ TEASER (1-2€) ============
  // Low barrier entry, high conversion
  {
    name: 'elena-teaser-lingerie-1',
    description: 'Elena in black lace lingerie, bedroom setting',
    price: 199,  // 1.99€
    category: 'teaser',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/teaser-lingerie-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:1000/v1/elena-fanvue-ppv/teaser-lingerie-1.jpg',
    tags: ['lingerie', 'bedroom', 'black', 'lace'],
    targetTone: ['playful', 'sweet', 'mysterious'],
  },
  {
    name: 'elena-teaser-bikini-1',
    description: 'Elena in red bikini, pool setting',
    price: 199,  // 1.99€
    category: 'teaser',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/teaser-bikini-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:1000/v1/elena-fanvue-ppv/teaser-bikini-1.jpg',
    tags: ['bikini', 'pool', 'red', 'summer'],
    targetTone: ['playful', 'bratty'],
  },

  // ============ SOFT (3-5€) ============
  // More revealing, still tasteful
  {
    name: 'elena-soft-silk-robe-1',
    description: 'Elena in silk robe, morning light',
    price: 399,  // 3.99€
    category: 'soft',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/soft-silk-robe-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:800/v1/elena-fanvue-ppv/soft-silk-robe-1.jpg',
    tags: ['silk', 'robe', 'morning', 'intimate'],
    targetTone: ['sweet', 'mysterious', 'romantic'],
  },
  {
    name: 'elena-soft-white-lingerie-1',
    description: 'Elena in white bridal lingerie',
    price: 499,  // 4.99€
    category: 'soft',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/soft-white-lingerie-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:800/v1/elena-fanvue-ppv/soft-white-lingerie-1.jpg',
    tags: ['lingerie', 'white', 'bridal', 'innocent'],
    targetTone: ['sweet', 'romantic'],
  },
  {
    name: 'elena-soft-sports-bra-1',
    description: 'Elena in sports bra after workout',
    price: 399,  // 3.99€
    category: 'soft',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/soft-sports-bra-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:800/v1/elena-fanvue-ppv/soft-sports-bra-1.jpg',
    tags: ['sports', 'fitness', 'athletic', 'casual'],
    targetTone: ['playful', 'bratty'],
  },

  // ============ SPICY (6-9€) ============
  // More revealing, sensual
  {
    name: 'elena-spicy-shower-1',
    description: 'Elena in shower, wet and steamy',
    price: 699,  // 6.99€
    category: 'spicy',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/spicy-shower-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:600/v1/elena-fanvue-ppv/spicy-shower-1.jpg',
    tags: ['shower', 'wet', 'steamy', 'bathroom'],
    targetTone: ['dominant', 'mysterious'],
  },
  {
    name: 'elena-spicy-bed-1',
    description: 'Elena on bed, barely covered',
    price: 799,  // 7.99€
    category: 'spicy',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/spicy-bed-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:600/v1/elena-fanvue-ppv/spicy-bed-1.jpg',
    tags: ['bed', 'sheets', 'intimate', 'sensual'],
    targetTone: ['sweet', 'romantic', 'mysterious'],
  },
  {
    name: 'elena-spicy-mirror-1',
    description: 'Elena mirror selfie, revealing outfit',
    price: 699,  // 6.99€
    category: 'spicy',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/spicy-mirror-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:600/v1/elena-fanvue-ppv/spicy-mirror-1.jpg',
    tags: ['mirror', 'selfie', 'revealing', 'casual'],
    targetTone: ['bratty', 'playful'],
  },

  // ============ EXPLICIT (10€+) ============
  // Full explicit content
  {
    name: 'elena-explicit-set-1',
    description: 'Elena explicit photo set (5 photos)',
    price: 1299,  // 12.99€
    category: 'explicit',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/explicit-set-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:500/v1/elena-fanvue-ppv/explicit-set-1.jpg',
    tags: ['explicit', 'set', 'premium', 'full'],
    targetTone: ['dominant', 'bratty'],
  },
  {
    name: 'elena-explicit-video-preview-1',
    description: 'Elena video preview (30s)',
    price: 1499,  // 14.99€
    category: 'explicit',
    cloudinaryUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/v1/elena-fanvue-ppv/explicit-video-preview-1.jpg',
    teaserUrl: 'https://res.cloudinary.com/dily60mr0/image/upload/e_blur:500/v1/elena-fanvue-ppv/explicit-video-preview-1.jpg',
    tags: ['video', 'preview', 'premium', 'motion'],
    targetTone: ['dominant', 'mysterious'],
  },
];

// ===========================================
// PRICING TIERS
// ===========================================

export const PRICING_TIERS = {
  teaser: { min: 99, max: 299, label: 'Teaser' },
  soft: { min: 299, max: 599, label: 'Soft' },
  spicy: { min: 599, max: 999, label: 'Spicy' },
  explicit: { min: 999, max: 2999, label: 'Explicit' },
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get content by category
 */
export function getContentByCategory(category: string): PPVContentConfig[] {
  return PPV_CONTENT_CATALOG.filter(c => c.category === category);
}

/**
 * Get content by price range
 */
export function getContentByPriceRange(minPrice: number, maxPrice: number): PPVContentConfig[] {
  return PPV_CONTENT_CATALOG.filter(c => c.price >= minPrice && c.price <= maxPrice);
}

/**
 * Get content matching user preferences
 */
export function getContentForUser(
  preferences: {
    contentPreferences?: string[];
    tonePreference?: string;
    priceRange?: 'low' | 'medium' | 'high';
  }
): PPVContentConfig[] {
  let results = [...PPV_CONTENT_CATALOG];
  
  // Filter by price range
  if (preferences.priceRange) {
    switch (preferences.priceRange) {
      case 'low':
        results = results.filter(c => c.price <= 399);
        break;
      case 'medium':
        results = results.filter(c => c.price >= 399 && c.price <= 799);
        break;
      case 'high':
        results = results.filter(c => c.price >= 799);
        break;
    }
  }
  
  // Score by preferences
  if (preferences.contentPreferences || preferences.tonePreference) {
    results = results.map(content => {
      let score = 0;
      
      // Match content preferences
      if (preferences.contentPreferences) {
        score += content.tags.filter(t => 
          preferences.contentPreferences!.includes(t)
        ).length * 2;
      }
      
      // Match tone preference
      if (preferences.tonePreference) {
        if (content.targetTone.includes(preferences.tonePreference)) {
          score += 3;
        }
      }
      
      return { ...content, score };
    }).sort((a, b) => (b as { score: number }).score - (a as { score: number }).score);
  }
  
  return results;
}

/**
 * Get recommended first PPV for a new user
 * (Low price, high conversion teaser)
 */
export function getFirstPPVRecommendation(): PPVContentConfig {
  const teasers = getContentByCategory('teaser');
  return teasers[0] || PPV_CONTENT_CATALOG[0];
}

/**
 * Get upsell recommendation after purchase
 */
export function getUpsellRecommendation(
  lastPurchaseCategory: string,
  lastPurchasePrice: number
): PPVContentConfig | null {
  // Recommend next tier up
  const categoryOrder = ['teaser', 'soft', 'spicy', 'explicit'];
  const currentIndex = categoryOrder.indexOf(lastPurchaseCategory);
  
  if (currentIndex < categoryOrder.length - 1) {
    const nextCategory = categoryOrder[currentIndex + 1];
    const nextTierContent = getContentByCategory(nextCategory);
    return nextTierContent[0] || null;
  }
  
  // Already at highest tier, recommend more expensive in same tier
  const sameCategory = getContentByCategory(lastPurchaseCategory);
  const moreExpensive = sameCategory.filter(c => c.price > lastPurchasePrice);
  return moreExpensive[0] || null;
}
