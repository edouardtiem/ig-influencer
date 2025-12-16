/**
 * Character Configuration — Elena Visconti
 * Model & Fashion Stylist — Paris Street-Luxe
 * VERSION 2 — Pivot Street-Luxe Parisien
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
  
  // ═══════════════════════════════════════════════════════════════
  // PHYSICAL DESCRIPTION — Ultra-Detailed for AI
  // ═══════════════════════════════════════════════════════════════
  
  physical: {
    // Base
    base: '24 year old woman, Italian origin living in Paris, successful model',
    height: '170-172cm',
    
    // Face Details - SOFT, NOT ANGULAR
    face: 'soft round pleasant face, not angular, warm approachable features',
    eyes: 'honey brown warm eyes, inviting gaze',
    nose: 'small refined nose with soft tip',
    lips: 'naturally full lips nude-pink color',
    eyebrows: 'soft natural brows, not overdone',
    skin: 'glowing sun-kissed skin with warm undertones',
    
    // Hair — Critical for consistency
    hair: 'bronde hair (dark roots with golden blonde balayage) long voluminous beach waves, natural texture',
    
    // Body Proportions - CURVY
    body: 'curvy voluptuous figure not skinny, very large natural F-cup breasts prominent and emphasized, visible cleavage, soft feminine curves, narrow waist, wide hips, thick thighs, healthy curvy body',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // DISTINCTIVE MARKS — Critical for consistency
  // ═══════════════════════════════════════════════════════════════
  
  distinctiveMarks: {
    beautyMark: 'small beauty mark on cheekbone',
  },
  
  // Signature elements (ALWAYS include)
  signature: {
    bracelet: 'gold chunky bracelet on wrist',
    necklaces: 'layered gold necklaces with pendant',
  },
  
  // Style keywords — Street-luxe Paris 2025
  style: 'Instagram model aesthetic 2025, street-luxe Paris, revealing but tasteful, young and trendy, oversized jackets with tiny tops, leggings, lots of skin showing',
  
  // Primary setting
  setting: {
    type: 'luxurious bright Parisian loft apartment',
    location: '8th arrondissement',
    features: 'huge windows with natural daylight flooding in, Paris rooftops view, high ceilings, minimalist expensive decor, white walls, velvet sofa, plants, parquet floor',
  },
  
  // Quality settings
  quality: {
    resolution: 'high resolution',
    lighting: 'natural lighting',
    skin: 'realistic skin texture',
    style: 'lifestyle photography',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEGATIVE PROMPTS — What to avoid
  // ═══════════════════════════════════════════════════════════════
  
  negative: {
    global: [
      // Face
      'angular face', 'sharp jawline', 'square face', 'classic model face', 'editorial model',
      // Body
      'skinny thin body', 'flat chest', 'small breasts', 'medium breasts', 
      'A-cup', 'B-cup', 'C-cup', 'D-cup', 'average bust',
      // Style
      'conservative outfit', 'covered up', 'modest clothing', 'old fashioned style', 'formal business attire',
      // Technical
      'studio lighting', 'dark apartment', 'small windows', 'cheap decor',
      'stiff pose', 'cold expression', 'unfriendly',
      'airbrushed skin', 'fake looking', 'oversaturated', 'HDR', 'too perfect', 'plastic skin',
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Build the complete CHARACTER section of the prompt
 */
export function buildElenaCharacterPrompt(): string {
  const { physical, distinctiveMarks, signature } = CHARACTER_ELENA;
  
  return `Instagram photo of young woman, ${physical.base},

FACE: ${physical.face}, ${physical.hair}, ${physical.eyes}, ${physical.lips}, ${physical.eyebrows}, ${physical.skin}, ${distinctiveMarks.beautyMark},

BODY: ${physical.body},

DISTINCTIVE: ${signature.bracelet}, ${signature.necklaces}`;
}

/**
 * Build the setting section
 */
export function buildElenaSettingPrompt(): string {
  const { setting } = CHARACTER_ELENA;
  return `SETTING: inside ${setting.type} ${setting.location}, ${setting.features}`;
}

/**
 * Get negative prompt string
 */
export function getElenaNegativePrompt(): string {
  return CHARACTER_ELENA.negative.global.join(', ');
}

/**
 * Build full prompt with outfit and setting
 */
export function buildFullElenaPrompt(outfit: string, setting: string, expression: string = 'confident relaxed smile, effortlessly sexy'): string {
  const character = buildElenaCharacterPrompt();
  const { style, quality } = CHARACTER_ELENA;
  
  return `${character},

OUTFIT: ${outfit},

SETTING: ${setting},

EXPRESSION: ${expression},

STYLE: ${style},

QUALITY: ${Object.values(quality).join(', ')}`;
}
