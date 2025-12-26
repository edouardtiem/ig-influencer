/**
 * Character Configuration — Elena Visconti
 * Model & Fashion Stylist — Paris Street-Luxe
 * VERSION 3 — Photos de référence validées
 */

export const CHARACTER_ELENA = {
  name: 'Elena',
  fullName: 'Elena Visconti',
  age: 24,
  origin: 'Milan, Italy',
  location: 'Paris 8e arrondissement',
  occupation: 'Model + Fashion Stylist',
  
  // Best friend
  bestFriend: {
    name: 'Mila Verne',
    instagram: '@mila_verne',
    howTheyMet: 'On a photo shoot in Paris. Mila noticed Elena\'s vintage Blondie t-shirt under her oversized blazer.',
  },
  
  // Tech
  phone: {
    model: 'iPhone 17 Pro',
    color: 'Bleu',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // PHYSICAL DESCRIPTION — Validé avec photos de référence
  // ═══════════════════════════════════════════════════════════════
  
  physical: {
    // Base
    base: '24 year old woman, Italian origin living in Paris, successful model',
    height: '170-172cm',
    
    // Face Details - SOFT, NOT ANGULAR
    face: 'soft round pleasant face not angular, warm approachable features',
    eyes: 'honey brown warm eyes, inviting gaze',
    nose: 'small refined nose with soft tip',
    lips: 'naturally full lips nude-pink color',
    eyebrows: 'soft natural brows, not overdone',
    skin: 'glowing sun-kissed skin with warm undertones',
    beautyMark: 'small beauty mark on right cheekbone',
    
    // Hair — Critical for consistency
    hair: 'bronde hair (dark roots with golden blonde balayage) long voluminous beach waves',
    
    // Body Proportions - Shapely with large bust
    body: 'feminine shapely figure not skinny, very large natural F-cup breasts prominent emphasized visible cleavage, soft feminine curves, narrow waist, wide hips, healthy fit body',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // SIGNATURE ELEMENTS — Always include
  // ═══════════════════════════════════════════════════════════════
  
  signature: {
    bracelet: 'gold chunky chain bracelet on wrist',
    necklaces: 'layered gold necklaces with medallion pendant',
    beautyMark: 'small beauty mark on right cheekbone',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // STYLE — Paris Street-Luxe 2025
  // ═══════════════════════════════════════════════════════════════
  
  style: {
    aesthetic: '2026 instagram style picture, Instagram model aesthetic, street-luxe Paris, revealing but tasteful',
    colors: ['beige', 'cream', 'nude', 'white', 'black', 'plaid'],
    jewelry: 'gold only, chunky chain bracelet, layered necklaces',
    
    // Signature outfits
    outfits: {
      hero: 'oversized plaid blazer open + beige crop top tight + beige leggings',
      mirrorSelfie: 'white ribbed tank top showing cleavage + black leggings',
      cozyHome: 'cream oversized knit sweater off-shoulder + tiny black shorts',
      gettingReady: 'white shirt unbuttoned open + black lace bralette + black pants',
      cafeParis: 'beige cropped cardigan unbuttoned showing cleavage + cream trousers',
      spaVacation: 'cream one-piece swimsuit plunging neckline',
    },
  },
  
  // ═══════════════════════════════════════════════════════════════
  // SETTINGS — Primary locations
  // ═══════════════════════════════════════════════════════════════
  
  settings: {
    loft: {
      description: 'luxurious bright Parisian loft apartment 8th arrondissement',
      features: 'huge windows with natural daylight, Paris rooftops view, high ceilings, white walls, parquet floor, velvet mauve sofa, plants',
    },
    bathroom: {
      description: 'luxurious Parisian bathroom',
      features: 'white marble walls with grey veins, gold fixtures and faucets, large window with Paris view',
    },
    bedroom: {
      description: 'elegant Parisian apartment bedroom',
      features: 'vanity table with Hollywood mirror lights, neutral tones beige and white, Haussmann windows',
    },
    cafeParis: {
      description: 'classic Parisian cafe terrace',
      features: 'rattan bistro chairs, marble table, Haussmann buildings background, cobblestone street',
    },
    spaSki: {
      description: 'luxury ski resort spa in the Alps',
      features: 'outdoor heated infinity pool, steam rising, snowy mountain panorama, pine trees, clear blue winter sky',
    },
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEGATIVE PROMPTS — What to avoid
  // ═══════════════════════════════════════════════════════════════
  
  negative: {
    global: [
      'different face', 'different person',
      'angular face', 'sharp jawline', 'square face', 'classic model face',
      'skinny thin body', 'flat chest', 'small breasts', 'medium breasts',
      'A-cup', 'B-cup', 'C-cup', 'D-cup', 'average bust',
      'conservative outfit', 'covered up', 'modest clothing',
      'dark room', 'cheap decor',
      'stiff pose', 'cold expression',
      'airbrushed skin', 'fake looking', 'oversaturated', 'plastic skin',
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Build the base character prompt (to use with reference image)
 */
export function buildElenaBasePrompt(): string {
  const { physical, signature } = CHARACTER_ELENA;
  
  return `Based on the provided reference image, same woman same face same features,

Instagram photo, young woman ${physical.base},

FACE: exactly like reference image, ${physical.face}, ${physical.hair}, ${physical.eyes}, ${physical.lips}, ${physical.skin}, ${physical.beautyMark},

BODY: exactly like reference image, ${physical.body},

ACCESSORIES: ${signature.bracelet}, ${signature.necklaces}`;
}

/**
 * Build full prompt with outfit and setting
 */
export function buildFullElenaPrompt(
  outfit: string, 
  setting: string, 
  expression: string = 'confident relaxed smile, effortlessly sexy'
): string {
  const base = buildElenaBasePrompt();
  const { style } = CHARACTER_ELENA;
  
  return `${base},

OUTFIT: ${outfit},

SETTING: ${setting},

EXPRESSION: ${expression},

STYLE: ${style.aesthetic},

QUALITY: high resolution, natural lighting, realistic skin texture, lifestyle photography`;
}

/**
 * Get negative prompt string
 */
export function getElenaNegativePrompt(): string {
  return CHARACTER_ELENA.negative.global.join(', ');
}

/**
 * Get a predefined outfit
 */
export function getElenaOutfit(type: keyof typeof CHARACTER_ELENA.style.outfits): string {
  return CHARACTER_ELENA.style.outfits[type];
}

/**
 * Get a predefined setting
 */
export function getElenaSetting(type: keyof typeof CHARACTER_ELENA.settings): string {
  const setting = CHARACTER_ELENA.settings[type];
  return `${setting.description}, ${setting.features}`;
}
