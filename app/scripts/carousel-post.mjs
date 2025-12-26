#!/usr/bin/env node
/**
 * Carousel Post Script - Sexy Edition
 * Runs in GitHub Actions to avoid Vercel timeout limits
 * 
 * Usage: node scripts/carousel-post.mjs [slot] [test]
 * Slots: morning (8h30), late_morning (11h), afternoon (17h), evening (21h15)
 */

import Replicate from 'replicate';
import { savePostToSupabase } from './lib/supabase-helper.mjs';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const CAROUSEL_SIZE = 3;
const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// Mila's reference photos - SIMPLIFIED for better consistency
// Only 2 references: face + body (less confusion for the model)
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const MILA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png';

// ═══════════════════════════════════════════════════════════════
// LOCATION REFERENCES - For consistent apartment look
// ═══════════════════════════════════════════════════════════════

const LOCATION_REFS = {
  home_bedroom: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794597/1._Chambre_Paris_u2lyut.png',
  home_living_room: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794600/2._Salon_Paris_ltyd8r.png',
};

// ═══════════════════════════════════════════════════════════════
// MILA CHARACTER - Based on docs/03-PERSONNAGE.md
// CRITICAL: Must match provided reference images exactly
// ═══════════════════════════════════════════════════════════════

// Instruction to match reference images - EXPLICIT IMAGE MAPPING
const REFERENCE_INSTRUCTION = `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Mila's face. Copy this EXACTLY:
- Same oval elongated face shape with high cheekbones
- Same soft feminine jawline (not angular), slightly pointed chin
- Same copper auburn hair with type 3A loose curls, shoulder-length, messy texture
- Same almond-shaped hazel-green eyes with golden flecks
- Same straight nose with slightly upturned tip
- Same naturally full lips with subtle asymmetry
- Same small dark brown beauty mark 2mm above left lip corner (SIGNATURE)
- Same beauty mark on center of right cheekbone
- Same 20-25 light golden-brown freckles on nose and cheekbones

**IMAGE 2 (BODY REFERENCE)**: This is Mila's body. Match these proportions:
- Same slim athletic physique 168cm
- Same natural full feminine curves with defined waist
- Same toned but not muscular Pilates-sculpted shoulders
- Same Mediterranean light tan skin

**IMAGE 3+ (LOCATION REFERENCE if provided)**: This is the setting. Place the subject in this exact room/location.

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Body proportions MUST match Image 2
- Hair MUST be copper auburn with curls (NOT straight, NOT dark brown)
- ALWAYS include the beauty mark above left lip and freckles`;

// Detailed face description (critical for consistency)
const MILA_FACE = `oval elongated face shape with high naturally defined cheekbones,
soft feminine jawline not angular, chin slightly pointed,
copper auburn hair type 3A loose curls shoulder-length with natural volume and messy texture,
almond-shaped hazel-green eyes with golden flecks, natural full eyebrows slightly arched,
straight nose with slightly upturned tip (cute nose),
naturally full lips medium thickness with subtle asymmetry, rose-nude natural color`;

// Distinctive marks (CRITICAL for recognition)
const MILA_MARKS = `small dark brown beauty mark 2mm above left lip corner (SIGNATURE),
medium brown beauty mark on center of right cheekbone,
20-25 light golden-brown freckles on nose bridge and cheekbones,
thin gold necklace with minimalist star pendant always visible`;

// Body description
const MILA_BODY = `slim athletic physique 168cm, Mediterranean light tan skin,
natural full feminine curves with defined waist,
toned but not muscular, Pilates-sculpted shoulders`;

// Combined base (used in prompts)
const MILA_BASE = `${MILA_FACE},
${MILA_MARKS},
${MILA_BODY}`;

// Final check to reinforce reference matching
const MILA_FINAL_CHECK = `FINAL CHECK - MUST MATCH REFERENCES:
- SINGLE IMAGE ONLY - NO collages, NO grids, NO patchwork, NO multiple photos combined
- Face: IDENTICAL to Image 1 (oval face, copper auburn curly hair)
- Body: IDENTICAL to Image 2 (slim athletic, toned)
- Beauty mark: above left lip corner MUST be visible (SIGNATURE)
- Freckles: on nose and cheekbones
- Jewelry: thin gold necklace with star pendant`;

// Mila's signature phone - always the same for consistency
const MILA_PHONE = 'iPhone Air in cream white color, ultra-thin minimalist design, matte finish';

// ═══════════════════════════════════════════════════════════════
// EXPRESSIONS - Safe sexy vocabulary per docs/19-QUALITY-SEXY-STRATEGY.md
// ═══════════════════════════════════════════════════════════════

const HERO_EXPRESSIONS = [
  'captivating magnetic gaze at camera, slight knowing smile, eyes sparkling',
  'soft warm gaze with feminine allure, lips slightly parted, enchanting presence',
  'playful smirk, direct eye contact, effortless charm',
  'striking confident look, natural beauty radiating, approachable warmth',
];

const SECONDARY_EXPRESSIONS = [
  'alluring soft expression, eyes slightly hooded, natural charm',
  'pensive look gazing away, mysterious allure, caught in thought',
  'genuine relaxed smile, radiant expression, authentic moment',
  'dreamy expression, looking through window, contemplative',
  'candid laugh, hand near face, spontaneous joy',
  'sleepy soft smile, just woke up authenticity',
];

// ═══════════════════════════════════════════════════════════════
// LOCATIONS - Home focused + Paris generic
// ═══════════════════════════════════════════════════════════════

const LOCATIONS = {
  home_bedroom: {
    name: 'Chambre Mila',
    hasLocationRef: true,
    setting: `Based on the provided location reference image, place the subject in this exact bedroom.

Cozy bohemian bedroom with edgy artistic vibe, unmade bed with rumpled grey linen sheets, chunky knit terracotta throw blanket. Mix of pillows - black, olive green, one abstract pattern.

Nightstand cluttered with real life items: iPhone face-down, vintage film camera (Canon AE-1). Wall behind bed: vintage rock band poster (Nirvana/Blondie style), polaroid photos taped casually.

Corner elements: acoustic guitar leaning against wall, yoga mat rolled up. Large monstera plant in corner. Wooden floor with worn vintage rug.

Lived-in creative messy-chic aesthetic, the room of a 22-year-old fitness girl who's also a photographer.`,
    instagramLocationId: '101156775033710', // Paris 18e
    actions: [
      'sitting on edge of bed, one leg tucked under, sheets draped around her, relaxed morning moment',
      'standing by window looking out, silhouette backlit by soft light, contemplative',
      `lying on bed propped on elbow, body curved naturally, scrolling on her ${MILA_PHONE}`,
      'stretching arms above head while sitting in bed, morning awakening',
      `taking mirror selfie with her ${MILA_PHONE}, natural casual pose`,
      'sitting cross-legged on bed, coffee cup in hands, cozy moment',
      'adjusting hair in vanity mirror, getting ready routine',
      'lying on stomach on bed, legs kicked up playfully behind her',
    ],
  },
  home_living_room: {
    name: 'Salon Mila',
    hasLocationRef: true,
    setting: `Based on the provided location reference image, place the subject in this exact living room.

Cozy Parisian apartment living room in 18th arrondissement Montmartre, bohemian-artistic vibe. Tall ceiling, large traditional French windows with Paris zinc rooftops view.

Comfortable linen sofa in warm beige/sand color with mix of throw pillows (black, olive green, terracotta). Vintage wooden coffee table cluttered with magazines (Vogue, i-D), vintage film camera, succulent, coffee cup.

Wall decor: vintage rock band poster in black frame, grid of polaroid photos, black and white photography print. Large monstera plant in terracotta pot, acoustic guitar leaning against wall.

Authentic Parisian apartment with rooftop view, creative messy-chic with personality.`,
    instagramLocationId: '101156775033710', // Paris 18e
    actions: [
      'curled up on sofa, bare legs tucked to side, watching something on laptop',
      'lying on couch, one arm above head, relaxed evening pose',
      'sitting on sofa edge, leaning forward slightly, engaged in conversation',
      'standing by window, soft light on face, hand playing with hair',
      'stretching on yoga mat, mid-pose, flexible and toned',
      'lighting candles on coffee table, setting evening mood',
      'reading magazine on sofa, legs extended, comfortable position',
      'dancing slightly to music, carefree movement, eyes closed',
    ],
  },
  paris_cafe: {
    name: 'Café parisien',
    hasLocationRef: false, // No reference image yet
    setting: 'charming Parisian sidewalk café, marble bistro table, warm natural light, Montmartre atmosphere',
    instagramLocationId: null, // No geotag for generic
    actions: [
      'sipping coffee, cup near lips, savoring the moment',
      'laughing mid-conversation, genuine joy, eyes sparkling',
      'looking out at street, people watching, pensive expression',
      'typing on laptop, working remotely, focused but relaxed',
      'adjusting sunglasses, chic Parisian style',
      'reading book at table, intellectual vibe',
      'taking photo of coffee for content, creator moment',
      'leaning back in chair, confident relaxed posture',
    ],
  },
  paris_street: {
    name: 'Rue parisienne',
    hasLocationRef: false, // No reference image yet
    setting: 'typical Parisian cobblestone street, Haussmann buildings, soft daylight, authentic city atmosphere',
    instagramLocationId: null, // No geotag for generic
    actions: [
      'walking toward camera, natural stride, hair moving',
      'leaning against wall, one leg bent, casual cool',
      'looking back over shoulder, inviting glance',
      'standing at street corner, city life around her',
      'adjusting jacket, candid street style moment',
      'hailing taxi, arm raised, urban life',
      'window shopping, reflection visible, contemplative',
      'exiting building door, arriving somewhere',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════
// OUTFITS - Sexy but filter-safe (with brand references)
// ═══════════════════════════════════════════════════════════════

const OUTFITS = {
  home_bedroom: [
    'fitted ribbed gray bodysuit Skims style with thin spaghetti straps, fabric hugging curves elegantly',
    'oversized white cotton t-shirt slipping off one shoulder, bare legs, just woke up authentic',
    'silk champagne camisole Intimissimi style with thin delicate straps, matching shorts',
    'oversized cream knit sweater falling off shoulder, Savage x Fenty cotton boyshort underneath',
    'loose mens dress shirt in white unbuttoned showing décolleté, sleeves rolled up casual',
    'matching cotton underwear set Etam style neutral tone, soft bralette and high-waisted brief',
    'fitted black ribbed tank top thin straps Alo Yoga style, high-waisted cotton panties',
    'delicate lace bralette Livy Paris style visible under loose tank top, cozy morning',
  ],
  home_living_room: [
    'fitted ribbed bodysuit Skims style heather gray, thin straps, barefoot on sofa',
    'oversized cream sweater slipping off one shoulder revealing skin, bare legs tucked',
    'matching loungewear set Alo Yoga style, cropped top and high-waisted leggings beige',
    'silk camisole Intimissimi style soft pink, loose pajama pants, cozy evening',
    'fitted tank top no visible bra natural silhouette, cotton shorts casual home',
    'oversized hoodie as dress Brandy Melville style, sleeves covering hands',
    'yoga set Lululemon style, fitted crop top and high-waisted leggings showing midriff',
  ],
  paris_cafe: [
    'fitted ribbed top Sézane style white, high-waisted jeans, effortless Parisian chic',
    'silk blouse Rouje style slightly unbuttoned, tailored trousers elegant',
    'fitted sundress Réalisation Par style thin straps, subtle décolletage summer',
    'cropped cardigan over fitted tank, showing hint of midriff, café style',
    'linen blazer over simple black bodysuit, casual sophistication French girl',
    'off-shoulder top feminine, fitted jeans, Parisian street style',
  ],
  paris_street: [
    'leather jacket over fitted white t-shirt, high-waisted jeans, cool Parisian style',
    'long coat open over fitted dress, legs visible, elegant confident walk',
    'cropped sweater showing midriff, high-waisted wide pants Zara style',
    'fitted turtleneck, leather pants, confident city look editorial',
    'oversized blazer as dress The Frankie Shop style, bare legs fashion forward',
    'simple black dress figure-hugging Rouje style, classic Parisian elegance',
  ],
};

// ═══════════════════════════════════════════════════════════════
// FALLBACK - Safer versions when flagged
// ═══════════════════════════════════════════════════════════════

// Words to remove/replace when prompt is flagged
const SENSITIVE_REPLACEMENTS = [
  { from: /\bbare legs\b/gi, to: 'legs visible' },
  { from: /\bno visible bra\b/gi, to: 'relaxed fit' },
  { from: /\bboyshort\b/gi, to: 'shorts' },
  { from: /\bpanties\b/gi, to: 'bottoms' },
  { from: /\bbralette\b/gi, to: 'soft top' },
  { from: /\bunderwear\b/gi, to: 'loungewear' },
  { from: /\blingerie\b/gi, to: 'sleepwear' },
  { from: /\bslipping off\b/gi, to: 'relaxed on' },
  { from: /\bunbuttoned\b/gi, to: 'loosely worn' },
  { from: /\bshowing décolleté\b/gi, to: 'casual neckline' },
  { from: /\bbare shoulders\b/gi, to: 'shoulders visible' },
  { from: /\bsensual\b/gi, to: 'confident' },
  { from: /\bsexy\b/gi, to: 'stylish' },
  { from: /\bintimate\b/gi, to: 'cozy' },
  { from: /\balluring\b/gi, to: 'charming' },
  { from: /\bcurves\b/gi, to: 'silhouette' },
];

function makeSaferPrompt(prompt) {
  let saferPrompt = prompt;
  for (const { from, to } of SENSITIVE_REPLACEMENTS) {
    saferPrompt = saferPrompt.replace(from, to);
  }
  // Also add extra safe keywords
  saferPrompt = saferPrompt.replace(
    'ultra realistic',
    'ultra realistic, tasteful fashion photography, editorial style'
  );
  return saferPrompt;
}

// ═══════════════════════════════════════════════════════════════
// SLOTS - 4 posts per day
// ═══════════════════════════════════════════════════════════════

const SLOTS = {
  morning: {
    // 8h30 Paris
    locations: ['home_bedroom'],
    lighting: 'soft golden morning light streaming through sheer curtains, warm intimate glow',
    mood: 'sensualité naturelle, intimate awakening, cozy morning energy, lumière tamisée',
  },
  late_morning: {
    // 11h-12h30 Paris
    locations: ['paris_cafe', 'paris_street'],
    lighting: 'bright natural daylight, clear and flattering, soft shadows',
    mood: 'confident energy, Parisian chic, effortless style, natural beauty',
  },
  afternoon: {
    // 17h-19h Paris
    locations: ['home_living_room', 'paris_cafe'],
    lighting: 'warm golden hour light beginning, soft amber tones',
    mood: 'relaxed afternoon vibes, comfortable sensuality, ambiance intime',
  },
  evening: {
    // 21h-21h15 Paris
    locations: ['home_bedroom', 'home_living_room'],
    lighting: 'warm candlelight and soft lamp glow, intimate evening shadows, chiaroscuro',
    mood: 'intimate evening atmosphere, sensual relaxation, cozy night energy',
  },
  night: {
    // 23h Paris — WEEKEND ONLY (best engagement)
    locations: ['home_bedroom'],
    lighting: 'soft dim lighting, intimate shadows, single warm lamp glow, boudoir atmosphere',
    mood: 'late night intimacy, maximum sensuality, private moment energy, très intime',
  },
};

// ═══════════════════════════════════════════════════════════════
// CAPTIONS - Engaging questions + CTAs for better engagement
// Structure: [Hook/Story] + [Question/CTA] + [Hashtags]
// ═══════════════════════════════════════════════════════════════

const CAPTIONS = {
  home: [
    // Hook + Question format
    'Ce moment où tu traînes au lit toute la matinée… Vous êtes team lève-tôt ou grasse mat? 🛏️',
    'Soft mornings > everything else. Change my mind 🤍',
    'This is 22 and thriving ✨ What age are you feeling your best?',
    'Mood: unbothered. Qui d\'autre a besoin de ça aujourd\'hui?',
    'Les matins lents sont sous-estimés. Swipe pour voir le vrai mood 👀',
    'Cozy vibes only 🤍 Team dimanche chill ou brunch dehors?',
    'Natural glow, no filter ✨ Skincare ou génétique? Haha les deux',
    'Main character energy activated 💫 Votre chanson du moment?',
    'Sunday state of mind all week long. Qui peut relate?',
    'Embrace every part of yourself 🤍 What\'s your self-care ritual?',
    'Cette lumière dans ma chambre >> 📸 Favourite time of day?',
    'POV: Tu refuses de quitter le lit. Relatable or not? 😅',
  ],
  outside: [
    // Hook + Question format
    'Paris at golden hour hits different ✨ Votre spot préféré?',
    'Café crème & people watching. Ma définition du bonheur 🥐 Team café ou thé?',
    'Cette ville me surprend toujours 🇫🇷 Votre quartier parisien préféré?',
    'Living for these Paris streets 📸 What\'s your city?',
    'Just another day in Paris... ou pas 🗼 First time visitors vs locals - comment voyez-vous la ville?',
    'Chasing light and good vibes ☀️ Where\'s your happy place?',
    'Weekend energy activated 🔋 Vos plans?',
    'Terrasse season is the best season 🌸 Sweet or savory person?',
    'Cette terrasse vs mon canapé... tough choice 😅 Vous choisissez quoi?',
    'Paris ne m\'ennuie jamais 🥀 Votre café parisien préféré?',
  ],
};

// Hashtag pools by category - optimized for reach
const HASHTAG_POOLS = {
  lifestyle: ['#lifestyle', '#dailylife', '#instadaily', '#parisienne', '#frenchgirl', '#weekendvibes', '#goodvibes', '#aesthetic', '#vibes'],
  paris: ['#paris', '#parisianlife', '#parisiangirl', '#montmartre', '#parisian', '#iloveparis'],
  fitness: ['#fitnessmotivation', '#fitgirl', '#healthylifestyle', '#pilates', '#yogalife', '#fitnessgirl'],
  selfcare: ['#selfcare', '#naturalbeauty', '#confidence', '#selflove', '#glowup', '#skincare'],
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function generateCaption(isHome) {
  const captionList = isHome ? CAPTIONS.home : CAPTIONS.outside;
  const caption = randomFrom(captionList);
  
  // Mix hashtags from relevant pools
  const pools = isHome 
    ? ['lifestyle', 'selfcare', 'paris'] 
    : ['paris', 'lifestyle'];
  
  const selectedHashtags = [];
  for (const poolName of pools) {
    const pool = HASHTAG_POOLS[poolName];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    selectedHashtags.push(...shuffled.slice(0, 2));
  }
  
  // Dedupe and limit
  const uniqueHashtags = [...new Set(selectedHashtags)].slice(0, 6);
  
  return `${caption}\n\n${uniqueHashtags.join(' ')}`;
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
  const folder = 'mila-carousel';
  
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

async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

async function generateImageInternal(replicate, prompt, base64Images) {
  const input = {
    prompt,
    aspect_ratio: "4:5",
    resolution: "2K",
    output_format: "jpg",
    safety_filter_level: "block_only_high",
  };

  if (base64Images && base64Images.length > 0) {
    input.image_input = base64Images;
  }

  const output = await replicate.run(NANO_BANANA_MODEL, { input });

  if (!output) {
    throw new Error('No output from Nano Banana Pro');
  }

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

// Minimax Image-01 fallback for sexy content
async function generateWithMinimax(replicate, prompt, faceRefUrl) {
  log(`  🔄 Fallback to Minimax Image-01 (more permissive)...`);
  
  const input = {
    prompt,
    aspect_ratio: '3:4', // Closest to 4:5 that Minimax supports
    subject_reference: faceRefUrl,
  };

  const output = await replicate.run('minimax/image-01', { input });

  // Parse Minimax output
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
  
  // Convert references to base64 once
  let base64Images = null;
  if (referenceUrls.length > 0) {
    log(`  Converting ${referenceUrls.length} images to base64...`);
    base64Images = await Promise.all(
      referenceUrls.map(url => urlToBase64(url))
    );
    log(`  ✅ Converted to base64`);
  }

  // Try Nano Banana Pro first
  try {
    return await generateImageInternal(replicate, prompt, base64Images);
  } catch (error) {
    const isSensitiveError = error.message.includes('flagged') || 
                            error.message.includes('sensitive') ||
                            error.message.includes('E005');
    
    if (isSensitiveError) {
      log(`  ⚠️ Nano Banana Pro flagged as sensitive`);
      log(`  🔥 Using Minimax Image-01 fallback (keeps sexy prompt intact)`);
      
      // Use Minimax with the ORIGINAL sexy prompt (not diluted!)
      try {
        return await generateWithMinimax(replicate, prompt, MILA_FACE_REF);
      } catch (minimaxError) {
        log(`  ❌ Minimax also failed: ${minimaxError.message}`);
        
        // Last resort: try safer prompt on Nano Banana
        log(`  🔄 Last resort: safer prompt on Nano Banana...`);
        const saferPrompt = makeSaferPrompt(prompt);
        return await generateImageInternal(replicate, saferPrompt, base64Images);
      }
    }
    
    // Re-throw non-sensitive errors
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM PUBLISH
// ═══════════════════════════════════════════════════════════════

/**
 * Wait for Instagram media container to be ready for publishing
 * Instagram needs time to process uploaded media
 */
async function waitForMediaReady(containerId, accessToken, maxWaitMs = 120000) {
  const startTime = Date.now();
  const pollInterval = 3000; // Check every 3 seconds
  
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
      
      // Status is IN_PROGRESS or PUBLISHED, keep waiting
      log(`  ⏳ Status: ${data.status_code || 'processing'}...`);
      
    } catch (error) {
      // If we can't check status, just wait and retry
      log(`  ⏳ Checking status...`);
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Media processing timeout - Instagram took too long');
}

async function publishCarousel(imageUrls, caption, locationId) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  if (!accessToken || !accountId) {
    throw new Error('Missing Instagram credentials');
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
    
    // Check for API errors
    if (result.error) {
      throw new Error(`Failed to create media container ${i + 1}/${imageUrls.length}: ${result.error.message} (code: ${result.error.code})`);
    }
    
    if (!result.id) {
      throw new Error(`Media container ${i + 1}/${imageUrls.length} creation failed: no ID returned`);
    }
    
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
  
  // Check for API errors
  if (carouselResult.error) {
    throw new Error(`Failed to create carousel container: ${carouselResult.error.message} (code: ${carouselResult.error.code})`);
  }
  
  if (!carouselResult.id) {
    throw new Error('Carousel container creation failed: no ID returned');
  }
  
  const carouselId = carouselResult.id;

  // Wait for media to be ready (Instagram needs time to process)
  log('  Waiting for media to be ready...');
  await waitForMediaReady(carouselId, accessToken);

  // Retry publishing up to 5 times with increasing delays
  const maxRetries = 5;
  const baseDelay = 5000; // Start with 5 seconds
  
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
    
    // Check for API errors (except "not ready" which we retry)
    if (result.error) {
      // Special case: media not ready yet (error_subcode 2207027) - retry
      if (result.error.error_subcode === 2207027) {
      if (attempt < maxRetries) {
        const delay = baseDelay * attempt; // 5s, 10s, 15s, 20s, 25s
        log(`  ⏳ Media not ready, waiting ${delay/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      // Max retries reached for "not ready" error
      throw new Error(`Failed to publish: Media never became ready after ${maxRetries} attempts`);
    }
    
    // Success - verify ID exists
    if (result.id) {
      return result.id;
    }
    
    // No error but no ID either - this shouldn't happen
    throw new Error(`Carousel publication failed: Instagram API returned no post ID (response: ${JSON.stringify(result)})`);
  }
  
  throw new Error('Max retries reached - Instagram never became ready');
}

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER - With reference instruction for face consistency
// ═══════════════════════════════════════════════════════════════

function buildPrompt(expression, action, outfit, setting, lighting, mood) {
  return `${REFERENCE_INSTRUCTION}

SUBJECT: Mila, 22 year old French woman,
${MILA_BASE},

EXPRESSION: ${expression},
ACTION: ${action},
OUTFIT: wearing ${outfit},

SETTING: ${setting},
LIGHTING: ${lighting},
MOOD: ${mood},

STYLE: 2026 instagram style picture, ultra realistic Instagram photo, lifestyle editorial photography, 
natural feminine beauty, 8k resolution, professional photography, soft focus background, candid authentic moment,

${MILA_FINAL_CHECK}`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  const slot = process.argv[2] || 'morning';
  const isTest = process.argv[3] === 'true';

  log(`🚀 Starting carousel generation (${CAROUSEL_SIZE} images)`);
  log(`📅 Slot: ${slot}`);
  if (isTest) log('🧪 TEST MODE - will not publish');

  const requiredEnvVars = [
    'REPLICATE_API_TOKEN',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];
  
  if (!isTest) {
    requiredEnvVars.push('INSTAGRAM_ACCESS_TOKEN', 'INSTAGRAM_ACCOUNT_ID');
  }

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ Missing required environment variable: ${envVar}`);
      process.exit(1);
    }
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  try {
    // Step 1: Select location and content
    const slotConfig = SLOTS[slot] || SLOTS.morning;
    const locationId = randomFrom(slotConfig.locations);
    const location = LOCATIONS[locationId];
    
    if (!location) {
      throw new Error(`Unknown location: ${locationId}`);
    }

    const outfit = randomFrom(OUTFITS[locationId] || OUTFITS.home_bedroom);
    
    // Get 3 different actions
    const shuffledActions = [...location.actions].sort(() => Math.random() - 0.5);
    const actions = shuffledActions.slice(0, CAROUSEL_SIZE);

    const isHome = locationId.startsWith('home_');

    log(`📍 Location: ${location.name}`);
    log(`👗 Outfit: ${outfit.slice(0, 60)}...`);
    log(`🎬 Actions: ${actions.length}`);
    log(`🏠 Is home: ${isHome}`);

    // Step 2: Generate images
    const cloudinaryUrls = [];
    let firstImageUrl = null; // Store first image URL for outfit consistency

    for (let i = 0; i < CAROUSEL_SIZE; i++) {
      const photoNum = i + 1;
      const action = actions[i];
      const isHero = i === 0;
      const expression = isHero
        ? randomFrom(HERO_EXPRESSIONS)
        : randomFrom(SECONDARY_EXPRESSIONS);

      log(`\n🎨 Generating Photo ${photoNum}/${CAROUSEL_SIZE}...`);
      log(`  Action: ${action.slice(0, 60)}...`);

      // Build artistic prompt
      const prompt = buildPrompt(
        expression,
        action,
        outfit,
        location.setting,
        slotConfig.lighting,
        slotConfig.mood
      );

      // Build references - face + body + location (if available)
      const refs = [MILA_FACE_REF, MILA_BODY_REF];
      
      // Add location reference if available for consistent apartment look
      const locationRef = LOCATION_REFS[locationId];
      if (locationRef && location.hasLocationRef) {
        refs.push(locationRef);
        log(`  📍 Including location reference for ${location.name}`);
      }
      
      // Add first image as reference for outfit/scene consistency (images 2 and 3)
      if (firstImageUrl && i > 0) {
        refs.push(firstImageUrl);
        log(`  👗 Including first image reference for outfit consistency`);
      }

      const startTime = Date.now();
      const imageUrl = await generateImage(replicate, prompt, refs);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`  ✅ Generated in ${duration}s`);

      // Store first image URL for subsequent generations
      if (i === 0) {
        firstImageUrl = imageUrl;
        log(`  📌 Stored as reference for outfit consistency`);
      }

      log(`  ☁️ Uploading to Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(imageUrl);
      log(`  ✅ Uploaded: ${cloudinaryUrl}`);

      cloudinaryUrls.push(cloudinaryUrl);
    }

    log(`\n📸 Carousel ready: ${cloudinaryUrls.length} images`);

    // Step 3: Generate caption
    const caption = generateCaption(isHome);
    log(`📝 Caption: ${caption.split('\n')[0]}`);

    // Step 4: Publish (unless test mode)
    if (isTest) {
      log('\n🧪 TEST MODE - Skipping publish');
      log('\n✅ SUCCESS (test mode)');
      console.log(JSON.stringify({
        success: true,
        test: true,
        imageUrls: cloudinaryUrls,
        caption,
        location: location.name,
        slot,
      }, null, 2));
    } else {
      const postId = await publishCarousel(
        cloudinaryUrls,
        caption,
        location.instagramLocationId
      );
      log(`\n✅ PUBLISHED! Post ID: ${postId}`);
      
      // Step 5: Save to Supabase
      log('💾 Saving to Supabase...');
      await savePostToSupabase({
        character: 'mila',
        instagramPostId: postId,
        postType: 'carousel',
        imageUrls: cloudinaryUrls,
        caption,
        locationName: location.name,
        locationKey: locationId,
        outfit,
        mood: slotConfig.mood,
      });
      
      console.log(JSON.stringify({
        success: true,
        postId,
        imageUrls: cloudinaryUrls,
        caption,
        location: location.name,
        slot,
      }, null, 2));
    }

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main();
