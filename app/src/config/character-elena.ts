/**
 * Character Configuration — Elena Visconti
 * Model & Fashion Stylist
 * VERSION 1 — Ultra-Detailed for AI Generation
 */

export const CHARACTER_ELENA = {
  name: 'Elena',
  fullName: 'Elena Visconti',
  age: 24,
  origin: 'Milan, Italy',
  location: 'Paris 6e (Saint-Germain)',
  occupation: 'Model + Fashion Stylist',
  
  // Best friend
  bestFriend: {
    name: 'Mila Verne',
    instagram: '@mila_verne',
    howTheyMet: 'On a photo shoot in Paris. Mila noticed Elena\'s vintage Blondie t-shirt under her Bottega blazer.',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // PHYSICAL DESCRIPTION — Ultra-Detailed for AI
  // ═══════════════════════════════════════════════════════════════
  
  physical: {
    // Base
    base: '24 year old Italian woman, Northern Italian Mediterranean features, high fashion model physique with generous curves',
    height: '175cm (5\'9")',
    weight: '62-64kg',
    
    // Face Details
    face: 'oval angular face shape with defined jawline and high sculpted cheekbones',
    eyes: 'elongated almond-shaped dark brown almost black eyes, piercing magnetic intense gaze',
    nose: 'straight refined nose with slight aquiline profile (classic Roman), elegant',
    lips: 'very full plump natural lips, perfect nude-rose color',
    eyebrows: 'thick well-defined naturally arched Italian eyebrows',
    skin: 'olive Mediterranean skin tone, flawless even complexion, luminous',
    
    // Hair — Critical for consistency
    hair: 'dark chocolate brown hair, straight and long reaching mid-back, silky shiny texture, center part',
    
    // Body Proportions
    body: 'tall elegant model physique 175cm with generous curves, natural full F-cup/G-cup breasts (very generous, natural, emphasized), round and full shape, very defined waist 64cm, pronounced hourglass silhouette, Italian classic curves 92cm hips, square elegant shoulders 40cm (perfect model posture), long slim elegant arms, graceful hands, very long lean model legs with slim thighs, round firm proportionate buttocks, olive uniform skin, no tattoos, flawless smooth texture',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // DISTINCTIVE MARKS — Critical for consistency
  // ═══════════════════════════════════════════════════════════════
  
  distinctiveMarks: {
    beautyMark1: 'small brown beauty mark (2mm) under left eye on cheekbone',
  },
  
  // Signature elements (ALWAYS include)
  signature: {
    bracelet: 'chunky sculptural gold cuff bracelet on left wrist (always visible)',
    lipstick: 'nude matte lipstick perfectly applied (always impeccable)',
    gaze: 'intense mysterious gaze, natural smolder',
  },
  
  // Style keywords — Luxe but secretly punk
  style: 'high fashion editorial, Italian elegance, mysterious sensual, luxe sophistication, magnetic presence, subtle rebel underneath, effortless glamour',
  
  // Quality settings
  quality: {
    resolution: 'high resolution 4K',
    focus: 'sharp focus on face',
    skin: 'natural skin texture',
    hair: 'realistic hair rendering',
    colors: 'professional color grading, editorial-ready',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NEGATIVE PROMPTS — What to avoid
  // ═══════════════════════════════════════════════════════════════
  
  negative: {
    global: [
      'cartoon', 'anime', 'illustration', '3D render', 'CGI', 'painting', 'drawing', 'sketch',
      'deformed face', 'deformed body', 'asymmetric eyes', 'lazy eye', 'blurry', 'out of focus',
      'bad anatomy', 'extra limbs', 'extra fingers', 'mutated hands', 'poorly drawn face', 'poorly drawn hands',
      'watermark', 'signature', 'text', 'logo', 'brand name', 'username', 'timestamp',
      'oversaturated', 'overexposed', 'underexposed', 'high contrast', 'washed out colors',
      'plastic doll skin', 'airbrushed skin', 'excessive smoothing', 'fake tan', 'orange skin',
      'wrong hair color', 'different hair color', 'curly hair', 'wavy hair',
      'tattoos', 'extra piercings', 'nose ring', 'eyebrow piercing',
      'missing bracelet', 'no bracelet',
      'casual makeup', 'unprofessional appearance', 'messy look',
      'artificial studio lighting', 'white backdrop', 'green screen',
      'posed stiff', 'unnatural pose', 'distorted proportions',
    ],
    fashion: [
      'cheap clothing', 'fast fashion look', 'wrinkled clothes', 'ill-fitting',
      'sporty casual', 'athleisure', 'sneakers with formal',
    ],
    editorial: [
      'overly smiley', 'too friendly expression', 'casual vibe',
      'instagram filter heavy', 'snapchat aesthetic',
    ],
    intimate: [
      'explicit nudity', 'lingerie too revealing', 'adult content', 'provocative explicit pose',
      'obviously staged boudoir', 'professional boudoir lighting', 'cheap lingerie',
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Build the complete CHARACTER section of the prompt (V1 Ultra-Detailed)
 * Enhanced for Italian luxury + sensuality
 */
export function buildElenaCharacterPrompt(): string {
  const { physical, distinctiveMarks, signature, quality } = CHARACTER_ELENA;
  
  return `[CHARACTER - BASE] ${physical.base}, naturally stunning, confident magnetic energy,

[FACE DETAILS] 
- ${physical.face}
- ${physical.hair}
- ${physical.eyes}
- ${physical.nose}
- ${physical.lips}
- ${physical.eyebrows}
- ${physical.skin}

[DISTINCTIVE MARKS - CRITICAL]
- ${distinctiveMarks.beautyMark1}
- ${signature.bracelet}
- ${signature.lipstick}
- ${signature.gaze}

[BODY - PROPORTIONS] 
- ${physical.body}
- Italian curves accentuated, model silhouette with generous bust, attractive proportions

[VIBE] Mysteriously sexy, confidently sophisticated, Italian elegance, magnetic presence, luxe but accessible when she wants to be

[QUALITY] ${Object.values(quality).join(', ')}`;
}

/**
 * Build a compact character description (for shorter prompts)
 */
export function buildCompactElenaCharacterPrompt(): string {
  const { physical, distinctiveMarks, signature } = CHARACTER_ELENA;
  
  return `${physical.base}, ${physical.hair}, ${physical.eyes}, ${physical.face}, ${physical.skin}, ${physical.body}, ${distinctiveMarks.beautyMark1}, ${signature.bracelet}, ${signature.lipstick}`;
}

/**
 * Get negative prompt string for a specific content type
 */
export function getElenaNegativePrompt(contentType?: 'fashion' | 'editorial' | 'intimate'): string {
  const { negative } = CHARACTER_ELENA;
  const globalNegative = negative.global.join(', ');
  
  if (contentType && negative[contentType]) {
    return `${globalNegative}, ${negative[contentType].join(', ')}`;
  }
  
  return globalNegative;
}

/**
 * Build the style/mood section — Enhanced for Italian luxury
 */
export function buildElenaStylePrompt(): string {
  return `[MOOD] mysterious, confidently sophisticated, Italian sensuality, magnetic feminine power, luxe editorial aesthetic, effortless glamour, alluring without being explicit`;
}

