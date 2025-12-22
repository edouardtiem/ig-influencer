/**
 * Character Configuration — Mila Verne
 * Personal Trainer & Lifestyle Photographer
 * VERSION 2 — Ultra-Detailed for AI Generation
 */

export const CHARACTER = {
  name: 'Mila',
  fullName: 'Mila Verne',
  age: 22,
  origin: 'Nice, France',
  location: 'Paris 18e (Montmartre)',
  occupation: 'Personal Trainer + Photographer',
  
  // ═══════════════════════════════════════════════════════════════
  // PHYSICAL DESCRIPTION — Ultra-Detailed for AI
  // ═══════════════════════════════════════════════════════════════
  
  physical: {
    // Base
    base: '22 year old French woman, Mediterranean European features, personal trainer physique',
    height: '168cm (5\'6")',
    weight: '56-58kg',
    
    // Face Details
    face: 'oval elongated face shape with high defined cheekbones',
    eyes: 'almond-shaped hazel-green eyes with golden flecks',
    nose: 'straight nose with slightly upturned tip',
    lips: 'naturally full lips medium thickness, subtle asymmetry, rose-nude color',
    eyebrows: 'natural full eyebrows slightly arched',
    skin: 'light tan Mediterranean skin tone, healthy glow, natural skin texture with subtle pores visible',
    
    // Hair — Critical for consistency
    hair: 'copper auburn hair type 3A loose curls, shoulder-length, natural volume, slightly messy texture',
    
    // Body Proportions
    body: 'slim athletic physique, natural full DD-cup/E-cup breasts (generous voluptuous but natural proportions), defined waist 66cm with subtle visible upper abs, slight hourglass curve 88cm hips (not wide), toned shoulders 38cm (Pilates-sculpted, feminine), long lean legs with defined quads and calves, toned arms with subtle muscle definition, straight confident posture',
  },
  
  // ═══════════════════════════════════════════════════════════════
  // DISTINCTIVE MARKS — Critical for consistency
  // ═══════════════════════════════════════════════════════════════
  
  distinctiveMarks: {
    beautyMark1: 'small dark brown beauty mark (2mm) exactly 2mm above left lip corner',
    beautyMark2: 'medium brown beauty mark (2.5mm) center of right cheekbone',
    beautyMark3: 'small brown beauty mark (2mm) on right shoulder near clavicle',
    freckles: '20-25 light golden-brown freckles concentrated on nose bridge and cheekbones, few scattered on shoulders',
  },
  
  // Signature elements (ALWAYS include)
  signature: {
    necklace: 'thin gold necklace with minimalist star pendant (always visible)',
  },
  
  // Style keywords — Safe sexy vocabulary per docs/19-QUALITY-SEXY-STRATEGY.md
  style: '2026 instagram style picture, athleisure chic, Parisian elegant, captivating allure, magnetic confidence, Instagram aesthetic, effortless French girl vibe, feminine power',
  
  // Quality settings
  quality: {
    resolution: 'high resolution 4K',
    focus: 'sharp focus on face',
    skin: 'natural skin texture',
    hair: 'realistic hair rendering',
    colors: 'professional color grading, Instagram-ready',
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
      'wrong hair color', 'different hair color', 'straight hair',
      'tattoos', 'extra piercings', 'nose ring', 'eyebrow piercing', 'glasses', 'sunglasses indoors',
      'heavy eye makeup', 'false lashes', 'too much makeup',
      'artificial studio lighting', 'white backdrop', 'green screen',
      'posed stiff', 'unnatural pose', 'distorted proportions',
    ],
    fitness: [
      'bulky muscles', 'bodybuilder physique', 'veiny arms', 'excessive muscle definition',
      'shiny oiled skin', 'competition tan', 'gym bro aesthetic', 'protein shaker visible', 'overly posed flexing',
    ],
    lifestyle: [
      'overly glamorous', 'red carpet look', 'evening gown', 'high heels', 'clutch bag',
      'formal attire', 'obvious staging', 'catalog pose', 'advertisement feel',
    ],
    beach: [
      'fake breasts', 'implants', 'thong bikini', 'explicit', 'nudity', 'nipples visible',
      'bottom too revealing', 'provocative pose', 'adult content aesthetic', 'beach club promotional',
    ],
    intimate: [
      'explicit nudity', 'lingerie too revealing', 'adult content', 'provocative explicit pose',
      'bedroom eyes excessive', 'obviously staged boudoir', 'professional boudoir lighting',
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═══════════════════════════════════════════════════════════════

/**
 * Build the complete CHARACTER section of the prompt (V2 Ultra-Detailed)
 * Enhanced for natural sex appeal
 */
export function buildCharacterPrompt(): string {
  const { physical, distinctiveMarks, signature, quality } = CHARACTER;
  
  return `[CHARACTER - BASE] ${physical.base}, naturally attractive, confident feminine energy,

[FACE DETAILS] 
- ${physical.face}
- ${physical.hair}
- ${physical.eyes}, captivating gaze
- ${physical.nose}
- ${physical.lips}, naturally kissable
- ${physical.eyebrows}
- ${physical.skin}, healthy glow

[DISTINCTIVE MARKS - CRITICAL]
- ${distinctiveMarks.beautyMark1}
- ${distinctiveMarks.beautyMark2}
- ${distinctiveMarks.beautyMark3}
- ${distinctiveMarks.freckles}
- ${signature.necklace}

[BODY - PROPORTIONS] 
- ${physical.body}
- natural curves accentuated, feminine silhouette, attractive proportions

[VIBE] Effortlessly sexy, confident but approachable, alluring without being explicit, French girl sensuality, magnetic presence

[QUALITY] ${Object.values(quality).join(', ')}`;
}

/**
 * Build a compact character description (for shorter prompts)
 */
export function buildCompactCharacterPrompt(): string {
  const { physical, distinctiveMarks, signature } = CHARACTER;
  
  return `${physical.base}, ${physical.hair}, ${physical.eyes}, ${physical.face}, ${physical.skin}, ${physical.body}, ${distinctiveMarks.beautyMark1}, ${distinctiveMarks.freckles}, ${signature.necklace}`;
}

/**
 * Get negative prompt string for a specific content type
 */
export function getNegativePrompt(contentType?: 'fitness' | 'lifestyle' | 'beach' | 'intimate'): string {
  const { negative } = CHARACTER;
  const globalNegative = negative.global.join(', ');
  
  if (contentType && negative[contentType]) {
    return `${globalNegative}, ${negative[contentType].join(', ')}`;
  }
  
  return globalNegative;
}

/**
 * Build the style/mood section — Enhanced for sex appeal
 */
export function buildStylePrompt(): string {
  return `[MOOD] confident, alluring, naturally sensual, magnetic feminine energy, subtle sex appeal, Instagram aesthetic, effortless French girl vibe, attractive without being explicit`;
}
