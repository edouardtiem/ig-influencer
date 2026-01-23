/**
 * Nano Banana Pro Blocklist — Centralized list of blocked terms
 * 
 * Based on audit 2026-01-20 (docs/ELENA-PROMPT-AUDIT.md)
 * 
 * Google's Nano Banana Pro blocks certain terms/combinations.
 * This file centralizes all blocked terms and safe replacements.
 */

// ═══════════════════════════════════════════════════════════════
// BLOCKED TERMS — These will cause image generation to fail
// ═══════════════════════════════════════════════════════════════

export const BLOCKED_TERMS = {
  // Expressions that trigger safety filters
  expressions: [
    'sensual',
    'alluring', 
    'sultry',
    'seductive',
    'smoldering',
    'lips parted',
    'lips slightly parted',
    'intense gaze',
    'captivating gaze',  // OK alone, blocked with revealing outfit
    'bedroom eyes',
    'come hither',
  ],
  
  // Poses that trigger safety filters
  poses: [
    'looking over shoulder',
    'over shoulder',
    'lying on bed',
    'lying down',
    'lying on side',
    'arched back',
    'back arched',
    'on all fours',
    'spread legs',
    'straddling',
  ],
  
  // Body descriptions that trigger filters
  body: [
    'curves',
    'feminine curves',
    'curvy body',
    'voluptuous',
    'busty',
    'cleavage',  // OK with "dress showing cleavage", blocked alone
  ],
  
  // Clothing terms that trigger filters
  clothing: [
    'lingerie',
    'bralette',
    'sheer',
    'see-through',
    'transparent',
    'towel',  // alone
    'underwear',
    'panties',
    'thong',
    'g-string',
  ],
  
  // These combinations are always blocked
  blockedCombinations: [
    // Revealing outfit + sexy expression = BLOCKED
    { outfit: ['bikini', 'swimwear', 'swimsuit'], expression: ['sensual', 'alluring', 'sultry', 'lips parted', 'intense gaze'] },
    // Any reference to nudity
    { any: ['naked', 'nude', 'topless', 'bottomless', 'exposed'] },
  ],
};

// ═══════════════════════════════════════════════════════════════
// SAFE REPLACEMENTS — Auto-replace blocked terms
// ═══════════════════════════════════════════════════════════════

export const SAFE_REPLACEMENTS = {
  // Expressions
  'sensual': 'elegant',
  'alluring': 'confident',
  'sultry': 'glamorous',
  'seductive': 'sophisticated',
  'smoldering': 'striking',
  'captivating gaze': 'warm gaze',
  'intense gaze': 'confident expression',
  'lips parted': 'warm smile',
  'lips slightly parted': 'soft smile',
  'bedroom eyes': 'warm eyes',
  
  // Poses
  'looking over shoulder': 'confident pose',
  'over shoulder': 'elegant pose',
  'lying on bed': 'sitting on bed edge',
  'lying down': 'relaxed seated pose',
  'lying on side': 'seated elegantly',
  'arched back': 'confident posture',
  'back arched': 'elegant posture',
  
  // Body
  'curves': 'silhouette',
  'feminine curves': 'feminine silhouette',
  'curvy body': 'feminine figure',
  'voluptuous': 'feminine',
  'busty': 'elegant',
  
  // Clothing
  'lingerie': 'elegant loungewear',
  'bralette': 'delicate top',
  'sheer': 'delicate',
  'see-through': 'light fabric',
  'transparent': 'soft',
  'underwear': 'loungewear',
  
  // General
  'sexy': 'striking',
  'hot': 'radiant',
  'naked': 'natural',
  'nude': 'natural',
};

// ═══════════════════════════════════════════════════════════════
// SAFE VOCABULARY — What DOES work
// ═══════════════════════════════════════════════════════════════

export const SAFE_VOCABULARY = {
  expressions: [
    'confident',
    'warm smile',
    'glamorous',
    'elegant',
    'sophisticated',
    'striking',
    'natural',
    'radiant',
    'warm gaze',
    'soft smile',
    'genuine laugh',
    'contemplative',
    'dreamy',
    'peaceful',
  ],
  
  poses: [
    'standing',
    'sitting',
    'seated elegantly',
    'hand on hip',
    'confident pose',
    'elegant pose',
    'model pose',
    'relaxed posture',
    'leaning on railing',
    'by window',
    'mirror reflection',
    'walking',
    'stretching',
  ],
  
  outfitsOK: [
    'bikini',  // OK with neutral expression
    'swimsuit',
    'swimwear',
    'bodysuit',
    'mini dress',
    'slip dress',
    'evening dress',
    'dress showing cleavage',  // OK as full phrase
    'silk robe',
    'loungewear',
    'crop top',
    'leggings',
    'oversized shirt',
  ],
  
  locationsOK: [
    'beach',
    'pool',
    'infinity pool',
    'yacht',
    'rooftop',
    'bedroom',
    'bathroom',
    'spa',
    'hotel room',
    'terrace',
    'balcony',
    'cafe',
    'restaurant',
    'bar',
    'gallery',
  ],
};

// ═══════════════════════════════════════════════════════════════
// SANITIZE FUNCTION — Clean prompts before sending to Nano Banana
// ═══════════════════════════════════════════════════════════════

/**
 * Sanitize a prompt by replacing blocked terms with safe alternatives
 * @param {string} prompt - The original prompt
 * @param {string} level - 'normal' or 'aggressive' (for retry after failure)
 * @returns {string} - Sanitized prompt
 */
export function sanitizePrompt(prompt, level = 'normal') {
  if (!prompt) return '';
  
  let safe = prompt;
  
  // Apply all safe replacements
  for (const [blocked, replacement] of Object.entries(SAFE_REPLACEMENTS)) {
    const regex = new RegExp(`\\b${blocked}\\b`, 'gi');
    safe = safe.replace(regex, replacement);
  }
  
  // Aggressive mode: additional replacements for retry
  if (level === 'aggressive') {
    // Remove any remaining potentially problematic terms
    safe = safe.replace(/\bgaze\b/gi, 'expression');
    safe = safe.replace(/\blips\b/gi, 'smile');
    safe = safe.replace(/\bintimate\b/gi, 'cozy');
    safe = safe.replace(/\brevealing\b/gi, 'stylish');
    safe = safe.replace(/\bexposed\b/gi, 'visible');
    safe = safe.replace(/\bbare\b/gi, 'visible');
    safe = safe.replace(/\bskin\b/gi, 'natural');
    safe = safe.replace(/\bbody\b/gi, 'figure');
    safe = safe.replace(/\bcleavage\b/gi, 'neckline');
  }
  
  return safe;
}

/**
 * Check if a prompt contains any blocked terms
 * @param {string} prompt 
 * @returns {{ isBlocked: boolean, blockedTerms: string[] }}
 */
export function checkForBlockedTerms(prompt) {
  if (!prompt) return { isBlocked: false, blockedTerms: [] };
  
  const promptLower = prompt.toLowerCase();
  const foundTerms = [];
  
  // Check all blocked categories (skip blockedCombinations which contains objects)
  for (const [key, category] of Object.entries(BLOCKED_TERMS)) {
    if (key === 'blockedCombinations') continue;  // Skip objects
    if (Array.isArray(category)) {
      for (const term of category) {
        if (typeof term === 'string' && promptLower.includes(term.toLowerCase())) {
          foundTerms.push(term);
        }
      }
    }
  }
  
  return {
    isBlocked: foundTerms.length > 0,
    blockedTerms: [...new Set(foundTerms)],  // Unique terms
  };
}

/**
 * Format blocklist for prompt inclusion (tell Claude what to avoid)
 * @returns {string}
 */
export function formatBlocklistForPrompt() {
  return `## 🚫 MOTS INTERDITS (Nano Banana Pro Safety Filters)

Ces termes BLOQUENT la génération d'image. NE JAMAIS utiliser dans outfit, action, mood, prompt_hints:

### Expressions bloquées:
${BLOCKED_TERMS.expressions.map(t => `- "${t}"`).join('\n')}

### Poses bloquées:
${BLOCKED_TERMS.poses.map(t => `- "${t}"`).join('\n')}

### Descriptions corps bloquées:
${BLOCKED_TERMS.body.map(t => `- "${t}"`).join('\n')}

### Vêtements bloqués:
${BLOCKED_TERMS.clothing.map(t => `- "${t}"`).join('\n')}

### ⚠️ COMBINAISONS INTERDITES:
- Bikini/swimwear + expression sexy (sensual, alluring, lips parted) = ❌ BLOCKED
- Tenue révélatrice + intense gaze = ❌ BLOCKED

## ✅ ALTERNATIVES SAFE (utiliser à la place):
- "sensual" → "elegant" ou "sophisticated"
- "alluring" → "confident" ou "striking"  
- "captivating gaze" → "warm gaze" ou "confident expression"
- "lips parted" → "warm smile" ou "soft smile"
- "curves" → "silhouette" ou "figure"
- "lying on bed" → "sitting on bed edge" ou "seated elegantly"
- "looking over shoulder" → "confident pose" ou "elegant pose"
- "lingerie" → "elegant loungewear" ou "silk sleepwear"

## 🎯 RÈGLE D'OR:
**Tenue révélatrice (bikini, bodysuit) = expression NEUTRE (warm smile, confident)**
**Expression sensuelle = tenue COUVERTE (sweater, robe, dress)**
`;
}
