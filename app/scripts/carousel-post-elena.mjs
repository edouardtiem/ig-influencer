#!/usr/bin/env node
/**
 * Carousel Post Script - Elena Visconti (Très Sexy Edition)
 * Runs in GitHub Actions to avoid Vercel timeout limits
 * 
 * Usage: node scripts/carousel-post-elena.mjs [slot] [test]
 * Slots: morning (9h), midday (12h30), evening (19h), night (21h30), late_night (23h)
 */

import Replicate from 'replicate';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const CAROUSEL_SIZE = 3;
const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// Elena's reference photos for face consistency
const PRIMARY_FACE_URL = process.env.ELENA_BASE_FACE_URL;
const ELENA_REFS_RAW = process.env.ELENA_REFERENCE_URLS || '';
const FACE_REFS = ELENA_REFS_RAW ? ELENA_REFS_RAW.split(',').filter(Boolean) : [];

if (!PRIMARY_FACE_URL) {
  console.error('❌ ELENA_BASE_FACE_URL is required in .env.local');
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════
// ELENA CHARACTER - Based on docs/characters/elena/PERSONNAGE.md
// ═══════════════════════════════════════════════════════════════

const ELENA_BASE = `Elena, 24 year old Italian woman living in Paris, successful model,
soft round pleasant face not angular, warm approachable features,
bronde hair dark roots with golden blonde balayage long voluminous beach waves,
honey brown warm eyes, naturally full lips nude-pink,
glowing sun-kissed skin, small beauty mark on right cheekbone,
gold chunky chain bracelet on left wrist always visible,
layered gold necklaces with medallion pendant,
curvy voluptuous figure 172cm, very large natural F-cup breasts prominent,
narrow defined waist, wide feminine hips, thick thighs, healthy curvy body`;

// Elena's signature phone
const ELENA_PHONE = 'iPhone 17 Pro in blue color, sleek modern design';

// ═══════════════════════════════════════════════════════════════
// EXPRESSIONS - Très sexy focus
// ═══════════════════════════════════════════════════════════════

const HERO_EXPRESSIONS = [
  'intense sultry gaze at camera, lips slightly parted, smoldering confidence',
  'seductive knowing smile, direct eye contact, magnetic allure',
  'soft sensual expression, bedroom eyes, effortless glamour',
  'playful sexy smirk, inviting look, confident femininity',
];

const SECONDARY_EXPRESSIONS = [
  'looking over shoulder with sultry glance, mysterious and inviting',
  'eyes half-closed sensual, caught in intimate moment',
  'confident smile, head tilted, curves accentuated',
  'dreamy soft expression, natural sensuality radiating',
  'biting lip subtly, playful teasing energy',
  'looking up through lashes, innocent but knowing',
];

// ═══════════════════════════════════════════════════════════════
// LOCATIONS - Elena's world (Loft 8e + Luxe Paris)
// ═══════════════════════════════════════════════════════════════

const LOCATIONS = {
  loft_living: {
    name: 'Loft Elena',
    setting: 'luxurious bright Parisian loft apartment 8th arrondissement, huge windows with natural daylight flooding in, Paris rooftops view, high ceilings, white walls, velvet mauve sofa, plants, parquet floor, minimalist expensive decor',
    instagramLocationId: null, // Paris 8e - to add
    actions: [
      'standing confidently, hands on hips, showcasing silhouette against window light',
      'lounging on velvet sofa, legs extended, body curved naturally',
      'leaning against window frame, backlit silhouette, curves emphasized',
      `taking mirror selfie with her ${ELENA_PHONE}, confident pose`,
      'stretching arms up, arching back slightly, morning energy',
      'sitting on sofa arm, legs crossed, elegant but revealing pose',
      'walking toward camera, hair flowing, confident stride',
      'adjusting outfit, candid getting ready moment',
    ],
  },
  loft_bedroom: {
    name: 'Chambre Elena',
    setting: 'elegant Parisian apartment bedroom, luxurious white bedding, soft morning light through tall windows, Haussmann buildings visible outside, vanity table with Hollywood mirror, neutral tones beige and cream',
    instagramLocationId: null,
    actions: [
      'sitting on bed edge, leaning back on hands, legs extended',
      'lying on bed propped on elbow, body curved sensually',
      'standing by vanity mirror, getting ready, reflection visible',
      `taking selfie in mirror with her ${ELENA_PHONE}, sultry expression`,
      'sitting at vanity, touching hair, glam moment',
      'lying on stomach on bed, legs kicked up, playful',
      'standing by window in morning light, silhouette visible',
      'stretching on bed, just woke up sensuality',
    ],
  },
  bathroom_luxe: {
    name: 'Salle de bain Elena',
    setting: 'luxurious Parisian bathroom, white marble walls with grey veins, gold fixtures and faucets, large window with Paris rooftops view, elegant minimalist design',
    instagramLocationId: null,
    actions: [
      `taking mirror selfie with her ${ELENA_PHONE}, full body visible`,
      'leaning against marble counter, confident pose',
      'adjusting hair in mirror, candid getting ready',
      'standing in doorway, backlit silhouette',
    ],
  },
  cafe_paris: {
    name: 'Café parisien chic',
    setting: 'upscale Parisian cafe terrace, classic rattan bistro chairs, marble table, Haussmann buildings in background, golden hour warm sunlight, elegant atmosphere',
    instagramLocationId: null,
    actions: [
      'sitting elegantly, legs crossed, holding espresso cup',
      'leaning forward on table, cleavage visible, engaged expression',
      'looking away pensively, profile showing curves',
      'laughing genuinely, hand near face, joy',
      'adjusting necklace, drawing attention to décolleté',
    ],
  },
  spa_luxe: {
    name: 'Spa luxe',
    setting: 'luxury spa setting, outdoor heated pool with steam rising, snowy mountain panorama or elegant indoor spa, warm water, relaxation atmosphere',
    instagramLocationId: null,
    actions: [
      'sitting on pool edge, legs in water, body visible',
      'leaning on pool edge, looking back over shoulder',
      'standing in pool, water at hip level, curves visible',
      'relaxing in jacuzzi, arms on edge, serene expression',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// OUTFITS - Très sexy, street-luxe Paris 2025
// ═══════════════════════════════════════════════════════════════

const OUTFITS = {
  loft_living: [
    'oversized plaid blazer worn open, tiny beige crop top underneath showing generous cleavage and midriff, high-waisted beige leggings hugging curves tightly',
    'cream oversized knit sweater falling off one shoulder revealing skin and bra strap, tiny black cotton shorts showing thick thighs, barefoot',
    'fitted white ribbed tank top very tight emphasizing large bust, high-waisted black leggings',
    'silk robe loosely tied at waist, hint of lingerie underneath, sensual morning',
    'matching beige loungewear set, cropped tank top low cut, high-waisted shorts',
    'oversized mens white shirt unbuttoned showing black lace bralette, cycling shorts',
  ],
  loft_bedroom: [
    'black lace bralette visible under unbuttoned white oversized shirt, black fitted high-waisted pants',
    'silk slip dress thin straps, fabric draping over curves, intimate elegance',
    'matching lingerie set elegant black lace, confident boudoir energy',
    'oversized cream sweater as dress, off-shoulder, bare legs',
    'fitted ribbed bodysuit low cut, emphasizing silhouette',
    'silk camisole and matching shorts set, champagne color',
  ],
  bathroom_luxe: [
    'tiny white ribbed tank top very tight showing cleavage and midriff, high-waisted black leggings',
    'matching neutral loungewear, cropped top emphasizing bust, fitted bottoms',
    'silk robe loosely open, tasteful hint of lingerie',
    'fitted crop top and high-waisted joggers, casual but sexy',
  ],
  cafe_paris: [
    'beige ribbed cropped cardigan slightly unbuttoned showing cleavage nothing underneath, high-waisted cream tailored trousers',
    'fitted black turtleneck emphasizing curves, leather pants, chic Parisian',
    'silk blouse slightly unbuttoned, pencil skirt, elegant sexy',
    'fitted sundress thin straps showing décolleté, summer Paris',
  ],
  spa_luxe: [
    'elegant cream one-piece swimsuit plunging deep V-neckline showing generous cleavage, high cut on hips',
    'black one-piece swimsuit with cutouts at waist, sophisticated sexy',
    'bikini set neutral tone, string ties, body confident',
  ],
};

// ═══════════════════════════════════════════════════════════════
// FALLBACK - Safer versions when flagged
// ═══════════════════════════════════════════════════════════════

const SENSITIVE_REPLACEMENTS = [
  { from: /\bbare legs\b/gi, to: 'legs visible' },
  { from: /\bcleavage\b/gi, to: 'neckline' },
  { from: /\bbralette\b/gi, to: 'soft top' },
  { from: /\blingerie\b/gi, to: 'sleepwear' },
  { from: /\bunbuttoned\b/gi, to: 'loosely worn' },
  { from: /\bshowing décolleté\b/gi, to: 'elegant neckline' },
  { from: /\bseductive\b/gi, to: 'confident' },
  { from: /\bsexy\b/gi, to: 'stylish' },
  { from: /\bsensual\b/gi, to: 'elegant' },
  { from: /\bsultry\b/gi, to: 'confident' },
  { from: /\bbedroom eyes\b/gi, to: 'soft gaze' },
  { from: /\bcurves\b/gi, to: 'silhouette' },
  { from: /\bbust\b/gi, to: 'figure' },
  { from: /\bsmoldering\b/gi, to: 'warm' },
];

function makeSaferPrompt(prompt) {
  let saferPrompt = prompt;
  for (const { from, to } of SENSITIVE_REPLACEMENTS) {
    saferPrompt = saferPrompt.replace(from, to);
  }
  saferPrompt = saferPrompt.replace(
    'ultra realistic',
    'ultra realistic, tasteful fashion photography, editorial style'
  );
  return saferPrompt;
}

// ═══════════════════════════════════════════════════════════════
// SLOTS - 5 posts per day (Elena posts more, sexier content)
// Optimized for audience: evening/night peak engagement
// ═══════════════════════════════════════════════════════════════

const SLOTS = {
  morning: {
    // 9h00 Paris
    locations: ['loft_bedroom', 'bathroom_luxe'],
    lighting: 'soft golden morning light streaming through tall windows, warm intimate glow',
    mood: 'sensual awakening, intimate morning energy, natural beauty',
  },
  midday: {
    // 12h30 Paris
    locations: ['cafe_paris', 'loft_living'],
    lighting: 'bright natural daylight, clear and flattering, soft shadows',
    mood: 'confident Parisian chic, effortless glamour, lunch break vibes',
  },
  evening: {
    // 19h00 Paris
    locations: ['loft_living', 'cafe_paris'],
    lighting: 'warm golden hour light, soft amber tones, magical',
    mood: 'golden hour glamour, confident sensuality, evening energy',
  },
  night: {
    // 21h30 Paris - PRIME TIME
    locations: ['loft_bedroom', 'loft_living'],
    lighting: 'warm soft lamp glow, intimate evening shadows, candlelight ambiance',
    mood: 'intimate night atmosphere, très sensuelle, cozy seduction',
  },
  late_night: {
    // 23h00 Paris - PEAK INTIMACY
    locations: ['loft_bedroom', 'bathroom_luxe'],
    lighting: 'soft dim lighting, intimate shadows, boudoir atmosphere',
    mood: 'late night intimacy, maximum sensuality, private moment energy',
  },
};

// ═══════════════════════════════════════════════════════════════
// CAPTIONS - Elena style (luxe + sexy + Italian touch)
// ═══════════════════════════════════════════════════════════════

const CAPTIONS = {
  home: [
    'Chez moi 🏠',
    'This light though ✨',
    'Mood',
    'Sunday in the city',
    'La dolce vita, Paris edition',
    'Staying in today',
    'Cozy vibes 🤍',
    'Home is where the heart is',
    'Ciao from my loft',
    'Morning light hits different here',
    'Feeling myself',
    'Just me',
    '...',
    'Buongiorno ☀️',
    'Paris mornings',
  ],
  cafe: [
    'Café time ☕',
    'The usual spot',
    'Espresso mood',
    'Parisian pause',
    'Terrasse season',
    'People watching',
    'Aperitivo time 🍷',
    'La vie parisienne',
  ],
  sexy: [
    '🔥',
    'Feeling dangerous',
    'Handle with care',
    'Not your average',
    'Soft power',
    'Temperature rising',
    'After hours',
    'When the city sleeps',
    'Midnight thoughts',
    'La nuit m\'appartient',
    'Catch me if you can',
    'Body language says it all',
  ],
  spa: [
    'Spa day 💫',
    'R&R',
    'Reset mode',
    'Mountain views, warm water',
    'This is living',
    'Vacation state of mind',
  ],
};

// ═══════════════════════════════════════════════════════════════
// HASHTAGS - Elena style
// ═══════════════════════════════════════════════════════════════

const HASHTAGS = [
  '#paris', '#parisienne', '#ootd', '#lifestyle', '#model',
  '#fashion', '#style', '#luxe', '#italia', '#frenchgirl',
];

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomSubset(array, count) {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

// ═══════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateImageInternal(replicate, prompt, base64Images) {
  const input = {
    prompt,
    aspect_ratio: '4:5',
    safety_filter_level: 'block_only_high',
    ...(base64Images && base64Images.length > 0 && {
      reference_images: base64Images,
    }),
  };

  const output = await replicate.run(NANO_BANANA_MODEL, { input });

  if (typeof output === 'string') return output;
  if (output && output.url) return output.url;
  if (Array.isArray(output) && output[0]) {
    if (typeof output[0] === 'string') return output[0];
    if (output[0].url) return output[0].url;
  }
  
  throw new Error('Could not parse output');
}

async function generateWithMinimax(replicate, prompt, faceRefUrl) {
  log('  Using Minimax Image-01 fallback...');
  
  const input = {
    prompt,
    aspect_ratio: '3:4',
    subject_reference: faceRefUrl,
  };

  const output = await replicate.run('minimax/image-01', { input });

  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.toString === 'function') {
      const str = first.toString();
      if (str.startsWith('http')) return str;
    }
  }
  if (output && typeof output.toString === 'function') {
    const str = output.toString();
    if (str.startsWith('http')) return str;
  }

  throw new Error('Could not parse Minimax output');
}

async function generateImage(replicate, prompt, referenceUrls) {
  log(`  Generating with ${referenceUrls.length} references...`);
  
  let base64Images = null;
  if (referenceUrls.length > 0) {
    log(`  Converting ${referenceUrls.length} images to base64...`);
    base64Images = await Promise.all(
      referenceUrls.map(url => urlToBase64(url))
    );
    log(`  ✅ Converted to base64`);
  }

  try {
    return await generateImageInternal(replicate, prompt, base64Images);
  } catch (error) {
    const isSensitiveError = error.message.includes('flagged') || 
                            error.message.includes('sensitive') ||
                            error.message.includes('E005');
    
    if (isSensitiveError) {
      log(`  ⚠️ Nano Banana Pro flagged as sensitive`);
      log(`  🔥 Using Minimax Image-01 fallback (keeps sexy prompt intact)`);
      
      try {
        return await generateWithMinimax(replicate, prompt, PRIMARY_FACE_URL);
      } catch (minimaxError) {
        log(`  ❌ Minimax also failed: ${minimaxError.message}`);
        log(`  🔄 Last resort: safer prompt on Nano Banana...`);
        const saferPrompt = makeSaferPrompt(prompt);
        return await generateImageInternal(replicate, saferPrompt, base64Images);
      }
    }
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM PUBLISH
// ═══════════════════════════════════════════════════════════════

async function waitForMediaReady(containerId, accessToken, maxWaitMs = 120000) {
  const startTime = Date.now();
  const pollInterval = 3000;
  
  while (Date.now() - startTime < maxWaitMs) {
    const statusUrl = `https://graph.facebook.com/v18.0/${containerId}?fields=status_code,status&access_token=${accessToken}`;
    
    try {
      const response = await fetch(statusUrl);
      const data = await response.json();
      
      if (data.status_code === 'FINISHED') {
        log('  ✅ Media ready!');
        return true;
      }
      
      if (data.status_code === 'ERROR') {
        throw new Error(`Media processing failed: ${data.status || 'Unknown error'}`);
      }
      
      log(`  ⏳ Status: ${data.status_code || 'processing'}...`);
      
    } catch (error) {
      log(`  ⏳ Checking status...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Media processing timeout - Instagram took too long');
}

async function publishCarousel(imageUrls, caption, locationId) {
  // Use Elena's Instagram credentials
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN_ELENA;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID_ELENA;

  if (!accessToken || !accountId) {
    throw new Error('Missing Elena Instagram credentials (INSTAGRAM_ACCESS_TOKEN_ELENA, INSTAGRAM_ACCOUNT_ID_ELENA)');
  }

  log(`📤 Publishing carousel with ${imageUrls.length} images...`);

  const containerIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    log(`  Creating container ${i + 1}/${imageUrls.length}...`);
    
    const params = new URLSearchParams({
      image_url: imageUrls[i],
      is_carousel_item: 'true',
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media?${params}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create container: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    containerIds.push(result.id);
  }

  log('  Creating carousel container...');
  const carouselParams = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: containerIds.join(','),
    caption,
    access_token: accessToken,
  });

  if (locationId) {
    carouselParams.append('location_id', locationId);
  }

  const carouselResponse = await fetch(
    `https://graph.facebook.com/v18.0/${accountId}/media?${carouselParams}`,
    { method: 'POST' }
  );

  if (!carouselResponse.ok) {
    const error = await carouselResponse.json();
    throw new Error(`Failed to create carousel: ${JSON.stringify(error)}`);
  }

  const carouselResult = await carouselResponse.json();
  const carouselId = carouselResult.id;

  log('  Waiting for media to be ready...');
  await waitForMediaReady(carouselId, accessToken);

  const maxRetries = 5;
  const baseDelay = 5000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    log(`  Publishing... (attempt ${attempt}/${maxRetries})`);
    
    const publishParams = new URLSearchParams({
      creation_id: carouselId,
      access_token: accessToken,
    });

    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media_publish?${publishParams}`,
      { method: 'POST' }
    );

    const result = await publishResponse.json();
    
    if (result.id) {
      return result.id;
    }
    
    if (result.error?.error_subcode === 2207027) {
      const delay = baseDelay * attempt;
      log(`  ⏳ Media not ready, waiting ${delay/1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    throw new Error(`Failed to publish: ${JSON.stringify(result)}`);
  }
  
  throw new Error('Failed to publish after max retries');
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  const slotArg = args[0] || 'evening';
  const isTest = args.includes('test');
  
  log('═══════════════════════════════════════════════════════════════');
  log(`🌟 ELENA CAROUSEL POST - ${slotArg.toUpperCase()}`);
  log('═══════════════════════════════════════════════════════════════');
  
  if (isTest) {
    log('🧪 TEST MODE - Will not publish to Instagram');
  }

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  const slot = SLOTS[slotArg];
  if (!slot) {
    throw new Error(`Unknown slot: ${slotArg}. Available: ${Object.keys(SLOTS).join(', ')}`);
  }

  // Pick random location for this slot
  const locationKey = randomFrom(slot.locations);
  const location = LOCATIONS[locationKey];
  log(`📍 Location: ${location.name}`);

  // Generate images
  const imageUrls = [];
  const usedOutfits = new Set();
  const usedActions = new Set();

  for (let i = 0; i < CAROUSEL_SIZE; i++) {
    log(`\n🖼️ Generating image ${i + 1}/${CAROUSEL_SIZE}...`);

    // Get unique outfit
    let outfit;
    const availableOutfits = OUTFITS[locationKey].filter(o => !usedOutfits.has(o));
    if (availableOutfits.length === 0) {
      outfit = randomFrom(OUTFITS[locationKey]);
    } else {
      outfit = randomFrom(availableOutfits);
      usedOutfits.add(outfit);
    }

    // Get unique action
    let action;
    const availableActions = location.actions.filter(a => !usedActions.has(a));
    if (availableActions.length === 0) {
      action = randomFrom(location.actions);
    } else {
      action = randomFrom(availableActions);
      usedActions.add(action);
    }

    // Pick expression
    const expression = i === 0 
      ? randomFrom(HERO_EXPRESSIONS)
      : randomFrom(SECONDARY_EXPRESSIONS);

    // Build prompt
    const prompt = `ultra realistic Instagram photo, ${ELENA_BASE},
wearing ${outfit},
${action},
${expression},
${location.setting},
${slot.lighting},
${slot.mood},
shot on iPhone, natural photography, lifestyle content, high fashion model aesthetic,
8k quality, detailed skin texture, realistic lighting`;

    log(`  Prompt preview: ${prompt.substring(0, 100)}...`);

    // Pick reference images
    const refs = [PRIMARY_FACE_URL, ...randomSubset(FACE_REFS, 1)];

    try {
      const imageUrl = await generateImage(replicate, prompt, refs);
      imageUrls.push(imageUrl);
      log(`  ✅ Generated: ${imageUrl.substring(0, 60)}...`);
    } catch (error) {
      log(`  ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  log(`\n✅ Generated ${imageUrls.length} images`);

  // Build caption
  const captionPool = locationKey.includes('cafe') 
    ? CAPTIONS.cafe 
    : locationKey.includes('spa')
    ? CAPTIONS.spa
    : slotArg === 'night' || slotArg === 'late_night'
    ? CAPTIONS.sexy
    : CAPTIONS.home;
  
  const baseCaption = randomFrom(captionPool);
  const hashtags = randomSubset(HASHTAGS, 3).join(' ');
  const caption = `${baseCaption}\n\n${hashtags}`;
  
  log(`\n📝 Caption: ${caption}`);

  // Publish
  if (isTest) {
    log('\n🧪 TEST MODE - Skipping publish');
    log('Generated URLs:');
    imageUrls.forEach((url, i) => log(`  ${i + 1}. ${url}`));
  } else {
    try {
      const postId = await publishCarousel(imageUrls, caption, location.instagramLocationId);
      log(`\n🎉 Published! Post ID: ${postId}`);
    } catch (error) {
      log(`\n❌ Publish failed: ${error.message}`);
      throw error;
    }
  }

  log('\n═══════════════════════════════════════════════════════════════');
  log('✨ ELENA POST COMPLETE');
  log('═══════════════════════════════════════════════════════════════');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

