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

// Elena's reference photos - SIMPLIFIED for better consistency
// Only 2 references: face + body (less confusion for the model)
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// ═══════════════════════════════════════════════════════════════
// LOCATION REFERENCE PHOTOS — For consistent apartment generation
// ═══════════════════════════════════════════════════════════════

const LOCATION_REFS = {
  loft_living: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009920/replicate-prediction-aphj5sddfxrmc0cv5sf8eqe2pw_c0otnl.png',
  loft_bedroom: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009918/replicate-prediction-nnns47vwgdrme0cv5shbd0b224_d0ghoj.png',
  bathroom_luxe: 'https://res.cloudinary.com/dily60mr0/image/upload/v1766009922/replicate-prediction-cq10n9h3jsrma0cv5sgrn0x5mr_swbswr.png',
};

// ═══════════════════════════════════════════════════════════════
// ELENA CHARACTER - Based on docs/characters/elena/PERSONNAGE.md
// CRITICAL: Must match provided reference images exactly
// ═══════════════════════════════════════════════════════════════

// Instruction to match reference images (MUST be at start of prompt)
const REFERENCE_INSTRUCTION = `BASED ON THE PROVIDED REFERENCE IMAGES, generate the EXACT SAME PERSON with identical face features, body proportions, and distinctive marks. The reference images are the source of truth for appearance.`;

// Detailed face description (critical for consistency)
const ELENA_FACE = `soft round pleasant face NOT angular, warm approachable features,
smooth feminine jawline, rounded chin, soft cheekbones,
bronde hair dark roots with golden blonde balayage, long voluminous beach waves past shoulders,
honey brown warm almond-shaped eyes, naturally thick eyebrows well-groomed,
small straight nose, naturally full lips nude-pink color`;

// Distinctive marks (CRITICAL for recognition)
const ELENA_MARKS = `small beauty mark on right cheekbone (SIGNATURE),
glowing sun-kissed Italian skin tone,
gold chunky chain bracelet on left wrist ALWAYS visible,
layered gold necklaces with medallion pendant ALWAYS visible`;

// Body description
const ELENA_BODY = `curvy voluptuous figure 172cm tall,
very large natural F-cup breasts prominent and natural shape,
narrow defined waist, wide feminine hips, thick thighs,
healthy curvy Italian body, confident posture`;

// Combined base (used in prompts)
const ELENA_BASE = `${ELENA_FACE},
${ELENA_MARKS},
${ELENA_BODY}`;

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
    hasLocationRef: true,
    setting: `Based on the provided location reference image, place the subject in this exact living room.

Luxurious bright Parisian loft apartment 8th arrondissement with high Haussmannian ceilings, ornate white crown moldings. Large French windows with natural daylight flooding in, Paris zinc rooftops view with typical grey Haussmann buildings.

Herringbone chevron parquet floor in light oak honey color. Statement vintage dusty rose mauve velvet sofa with curved armrests 1970s Italian design. Minimalist black metal and glass side table.

Large indoor palm tree in terracotta pot, fiddle leaf fig plant, smaller potted plants. Fashion magazines on coffee table, gold candle holders, soft cream throw blanket on sofa.

White walls, dusty rose mauve velvet, cream and beige tones, gold accents. Expensive but lived-in, Italian-Parisian luxury aesthetic.`,
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
    hasLocationRef: true,
    setting: `Based on the provided location reference image, place the subject in this exact bedroom.

Elegant Parisian apartment bedroom 8th arrondissement with high Haussmannian ceiling, ornate white crown moldings, herringbone chevron parquet floor light oak.

Two tall French windows with sheer white linen curtains gently flowing, view of Paris rooftops.

King size bed with cream linen upholstered headboard button-tufted, luxurious white and beige layered bedding, multiple pillows in cream white and dusty rose, cashmere throw blanket in camel color.

Vintage-style vanity table in white lacquer with gold legs, Hollywood mirror with warm globe lights, velvet stool in dusty rose mauve. Gold and marble bedside tables, gold arc floor lamp with cream shade.

Fresh white roses in glass vase, fashion books, perfume bottles, abstract feminine art print above bed in gold frame. Warm golden natural light, romantic atmosphere.`,
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
    hasLocationRef: true,
    setting: `Based on the provided location reference image, place the subject in this exact bathroom.

Luxurious Parisian apartment bathroom with high ceiling, large French window overlooking Paris zinc rooftops and Haussmann building facades.

Floor to ceiling white Calacatta marble with elegant grey veining, polished finish. All brushed gold brass fixtures throughout, vintage-style gold faucet with cross handles on pedestal sink.

Gold-framed rectangular mirror with subtle art deco lines, glass walk-in shower enclosure with gold hinges and gold rainfall showerhead, gold towel rack.

White porcelain pedestal sink classic Parisian style. Fluffy white towels neatly rolled, minimalist amber glass bottles, white candles in gold holders.

Bright natural daylight from window, clean and fresh atmosphere. Five-star Parisian hotel bathroom aesthetic.`,
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
    hasLocationRef: false, // No reference image yet
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
    hasLocationRef: false, // No reference image yet
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
// CAPTIONS - Elena style (luxe + sexy + Italian touch + QUESTIONS/CTAs)
// Structure: [Hook/Story] + [Question/CTA] + [Hashtags]
// ═══════════════════════════════════════════════════════════════

const CAPTIONS = {
  home: [
    // Hook + Question format
    'Cette lumière dans mon loft 🏠 Votre pièce préférée chez vous?',
    'This light though ✨ Morning or evening person?',
    'Mood: staying in today. Qui d\'autre cancelle ses plans? 😅',
    'La dolce vita, Paris edition 🇮🇹🇫🇷 Best of both worlds, non?',
    'Cozy vibes only 🤍 Netflix recommendations anyone?',
    'Home is where the heart is… et le bon café. Team espresso ou latte?',
    'Ciao from my loft ☀️ What does your happy place look like?',
    'Morning light hits different here 📸 Swipe pour le mood',
    'Feeling myself today ✨ What gives you confidence?',
    'Just me, myself & this view. Votre vue préférée?',
    'Buongiorno 🌅 Early bird or night owl?',
    'Paris mornings are unmatched. Change my mind 🥐',
  ],
  cafe: [
    // Hook + Question format
    'Café time ☕ Votre commande habituelle?',
    'The usual spot. Vous avez un café attitré?',
    'Espresso mood only ☕ Single or double shot?',
    'Parisian pause 🥐 Sweet or savory pour le goûter?',
    'Terrasse season is the best season 🌸 Agree or disagree?',
    'People watching is an art. Votre terrasse préférée à Paris?',
    'Aperitivo time 🍷 Spritz ou Negroni?',
    'La vie parisienne ✨ What\'s your favourite café ritual?',
  ],
  sexy: [
    // Hook + short CTA
    '🔥 Thoughts?',
    'Feeling dangerous tonight. Plans for the weekend?',
    'Handle with care 💋 Vos plans ce soir?',
    'Soft power only ✨',
    'Temperature rising 🌡️ Summer vibes or winter cozy?',
    'After hours 🌙 Night owls où êtes-vous?',
    'When the city sleeps... 🌃 What time do you go to bed?',
    'Midnight thoughts 💭 Share yours below',
    'La nuit m\'appartient 🌙 Team sortir ou cocooning?',
    'Catch me if you can 😏',
    'Body language says it all. What\'s your power pose?',
    'This or the next slide? 👀',
  ],
  spa: [
    // Hook + Question format
    'Spa day finally 💫 Quand était votre dernier jour off?',
    'R&R mode activated. Your favourite way to relax?',
    'Reset mode ON 🧘‍♀️ Spa day or home self-care?',
    'Mountain views, warm water ♨️ This or beach vibes?',
    'This is living ✨ Your dream vacation spot?',
    'Vacation state of mind 🏔️ Where would you escape right now?',
  ],
};

// ═══════════════════════════════════════════════════════════════
// HASHTAG POOLS - Elena style (luxe + fashion focus)
// ═══════════════════════════════════════════════════════════════

const HASHTAG_POOLS = {
  fashion: ['#parisfashion', '#ootd', '#fashionista', '#streetstyle', '#frenchstyle', '#luxurylifestyle', '#instafashion', '#styleinspo'],
  lifestyle: ['#lifestyle', '#parisienne', '#frenchgirl', '#dailylife', '#aesthetic', '#vibes', '#livingmybestlife'],
  model: ['#modellife', '#fashionmodel', '#modelwork', '#shootingday', '#behindthescenes'],
  luxe: ['#luxe', '#luxurylifestyle', '#highfashion', '#chic', '#elegant'],
  italia: ['#italia', '#italianstyle', '#ladolcevita', '#italiano', '#amore'],
};

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
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imageUrl) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'elena-carousel';
  
  const crypto = await import('crypto');
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudinary upload failed: ${error}`);
  }

  const result = await response.json();
  return result.secure_url;
}

// ═══════════════════════════════════════════════════════════════
// IMAGE GENERATION
// ═══════════════════════════════════════════════════════════════

async function generateImageInternal(replicate, prompt, base64Images) {
  const input = {
    prompt,
    aspect_ratio: '4:5',
    resolution: '2K',
    output_format: 'jpg',
    safety_filter_level: 'block_only_high',
  };

  if (base64Images && base64Images.length > 0) {
    input.image_input = base64Images;
  }

  const output = await replicate.run(NANO_BANANA_MODEL, { input });

  if (!output) {
    throw new Error('No output from Nano Banana Pro');
  }

  // Handle async iterator (streamed output)
  if (typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk);
      } else if (typeof chunk === 'string') {
        return chunk;
      }
    }
    
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const base64 = Buffer.from(combined).toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    }
  }

  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) return output[0];

  throw new Error('Could not process API response');
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
        return await generateWithMinimax(replicate, prompt, ELENA_FACE_REF);
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
  
  // Pick ONE outfit for the entire carousel (same person = same outfit in real life!)
  const outfit = randomFrom(OUTFITS[locationKey]);
  log(`👗 Outfit: ${outfit.slice(0, 60)}...`);
  
  // Get unique actions (different poses, same outfit)
  const shuffledActions = [...location.actions].sort(() => Math.random() - 0.5);
  const actions = shuffledActions.slice(0, CAROUSEL_SIZE);

  let firstImageUrl = null; // Store first image URL for outfit consistency

  for (let i = 0; i < CAROUSEL_SIZE; i++) {
    log(`\n🖼️ Generating image ${i + 1}/${CAROUSEL_SIZE}...`);

    const action = actions[i];

    // Pick expression
    const expression = i === 0 
      ? randomFrom(HERO_EXPRESSIONS)
      : randomFrom(SECONDARY_EXPRESSIONS);

    // Build prompt with reference instruction for face consistency
    const prompt = `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman living in Paris,
${ELENA_BASE},

EXPRESSION: ${expression},
ACTION: ${action},
OUTFIT: wearing ${outfit},

SETTING: ${location.setting},
LIGHTING: ${slot.lighting},
MOOD: ${slot.mood},

STYLE: ultra realistic Instagram photo, lifestyle content, high fashion model aesthetic,
shot on iPhone, natural photography, 8k quality, detailed skin texture, realistic lighting,

CRITICAL: Face must match reference images exactly - same soft round face shape, same jawline, same distinctive marks`;

    log(`  Prompt preview: ${prompt.substring(0, 100)}...`);

    // Build references - face + body + location (if available)
    const refs = [ELENA_FACE_REF, ELENA_BODY_REF];
    
    // Add location reference if available for consistent apartment look
    const locationRef = LOCATION_REFS[locationKey];
    if (locationRef && location.hasLocationRef) {
      refs.push(locationRef);
      log(`  📍 Including location reference for ${location.name}`);
    }
    
    // Add first image as reference for outfit/scene consistency (images 2 and 3)
    if (firstImageUrl && i > 0) {
      refs.push(firstImageUrl);
      log(`  👗 Including first image reference for outfit consistency`);
    }

    try {
      const imageUrl = await generateImage(replicate, prompt, refs);
      const urlString = typeof imageUrl === 'string' ? imageUrl : String(imageUrl);
      log(`  ✅ Generated: ${urlString.substring(0, 60)}...`);
      
      // Store first image URL for subsequent generations
      if (i === 0) {
        firstImageUrl = urlString;
        log(`  📌 Stored as reference for outfit consistency`);
      }
      
      // Upload to Cloudinary
      log(`  ☁️ Uploading to Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(urlString);
      imageUrls.push(cloudinaryUrl);
      log(`  ✅ Uploaded: ${cloudinaryUrl}`);
    } catch (error) {
      log(`  ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  log(`\n✅ Generated and uploaded ${imageUrls.length} images`);

  // Build caption with engaging questions/CTAs
  const captionPool = locationKey.includes('cafe') 
    ? CAPTIONS.cafe 
    : locationKey.includes('spa')
    ? CAPTIONS.spa
    : slotArg === 'night' || slotArg === 'late_night'
    ? CAPTIONS.sexy
    : CAPTIONS.home;
  
  const baseCaption = randomFrom(captionPool);
  
  // Mix hashtags from relevant pools
  const pools = locationKey.includes('cafe') 
    ? ['lifestyle', 'fashion'] 
    : locationKey.includes('spa')
    ? ['lifestyle', 'luxe']
    : ['fashion', 'lifestyle', 'italia'];
  
  const selectedHashtags = [];
  for (const poolName of pools) {
    const pool = HASHTAG_POOLS[poolName];
    if (pool) {
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      selectedHashtags.push(...shuffled.slice(0, 2));
    }
  }
  const uniqueHashtags = [...new Set(selectedHashtags)].slice(0, 6);
  
  const caption = `${baseCaption}\n\n${uniqueHashtags.join(' ')}`;
  
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

