#!/usr/bin/env node
/**
 * TEST: Natural Face Variations — Elena Only
 * 
 * Generates content plan + images WITHOUT:
 * - Saving to Supabase
 * - Posting to Instagram
 * 
 * Images are uploaded to Cloudinary for review.
 * Captions are printed to console.
 */

import Replicate from 'replicate';
import Anthropic from '@anthropic-ai/sdk';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// ===========================================
// CONFIG
// ===========================================

const CAROUSEL_SIZE = 3;
const NANO_BANANA_MODEL = 'google/nano-banana-pro';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || process.env.Claude_key });

// ===========================================
// ELENA CONFIG
// ===========================================

const ELENA_CONFIG = {
  name: 'Elena',
  face_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
  body_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png',
  profile_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767561713/y1r6jt0pwdrmr0cvhbf9sbenkw_z0sydx.png', // Left profile
  back_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1767562505/replicate-prediction-bjnvs97bqxrmy0cvhbpa8cx5f8_daohqh.png', // Back view
  cloudinary_folder: 'elena-test-expressions',
  reference_instruction: `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same smooth feminine jawline and rounded chin
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
- Same bronde hair with VISIBLE golden blonde balayage highlights (NOT solid dark brown)
- Same naturally thick well-groomed eyebrows

**IMAGE 2 (BODY REFERENCE)**: This is Elena's body. Match these proportions EXACTLY:
- Same feminine shapely figure (NOT skinny, NOT thin)
- Same very large natural F-cup breasts (prominent, NOT reduced)
- Same narrow defined waist
- Same wide feminine hips
- Same healthy fit Italian body type

**IMAGE 3 (PROFILE REFERENCE)**: This is Elena from LEFT PROFILE. For side angles:
- Same profile silhouette and jawline curve
- Same nose profile shape
- Same hair volume and flow from side

**IMAGE 4 (BACK REFERENCE)**: This is Elena from BEHIND. For back views:
- Same hair color, length, and balayage pattern from behind
- Same shoulder width and body silhouette
- Same skin tone

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Body proportions MUST match Image 2 - same curves, same large bust size
- For SIDE ANGLES: use Image 3 as profile guide
- For BACK VIEWS: use Image 4 as back guide
- Do NOT change face to look more "model-like" or angular
- Do NOT reduce bust size or body curves
- Hair MUST show visible golden blonde balayage highlights, NOT solid dark brown`,
  face_description: `soft round pleasant face NOT angular, warm approachable features,
smooth feminine jawline, rounded chin, soft cheekbones,
bronde hair dark roots with golden blonde balayage, long voluminous beach waves past shoulders,
honey brown warm almond-shaped eyes, naturally thick eyebrows well-groomed,
small straight nose, naturally full lips nude-pink color`,
  marks: `small beauty mark on right cheekbone (SIGNATURE),
glowing sun-kissed Italian skin tone,
gold chunky chain bracelet on left wrist ALWAYS visible,
layered gold necklaces with medallion pendant ALWAYS visible`,
  body_description: `feminine shapely figure 172cm tall,
very large natural F-cup breasts prominent and natural shape,
narrow defined waist, wide feminine hips,
healthy fit Italian body, confident posture`,
  final_check: `FINAL CHECK - MUST MATCH REFERENCES:
- SINGLE IMAGE ONLY - NO collages, NO grids, NO patchwork, NO multiple photos combined
- Face: IDENTICAL to Image 1 (soft round face, NOT angular, warm features)
- Body: IDENTICAL to Image 2 (shapely with very large bust visible)
- Hair: bronde with VISIBLE golden blonde balayage highlights (NOT solid dark brown)
- Beauty mark: on right cheekbone MUST be visible
- Jewelry: gold chunky bracelet on wrist, layered gold necklaces`,
};

// ===========================================
// NEW NATURAL EXPRESSIONS (the ones we just added)
// ===========================================

// Mix: Sexy (docs/19-QUALITY-SEXY-STRATEGY.md) + Natural/Candid
const HERO_EXPRESSIONS = [
  // SEXY
  'intense captivating gaze at camera, lips slightly parted, smoldering confidence',
  'soft alluring expression, warm inviting eyes, effortless glamour',
  'sultry gaze through half-closed eyes, sensual confidence, alluring',
  // NATURAL
  'genuine laugh mid-burst, eyes crinkled, authentic joy, candid energy',
  'looking out window dreamily, profile view, contemplative mood, curves silhouette',
  'eyes closed enjoying moment, peaceful sensual smile, vibing',
];

const SECONDARY_EXPRESSIONS = [
  // SEXY
  'looking over shoulder with captivating glance, mysterious and inviting',
  'playful charming smirk, soft bite of lower lip, inviting look',
  'enchanting knowing smile, direct eye contact, magnetic allure',
  // NATURAL/CANDID
  'caught off-guard glance over shoulder, surprised candid moment',
  'laughing hard with eyes squeezed shut, genuine uncontrolled joy',
  'looking at something off-camera, curious expression, distracted',
  'side profile gazing away, pensive natural moment, soft light on curves',
  'comfortable resting expression, not posing, natural beauty',
  'dreamy soft expression, natural radiance, looking away',
];

// ===========================================
// DETAIL SHOTS (environment without subject)
// ===========================================

const DETAIL_SHOTS = {
  bedroom: [
    'close-up of silk sheets rumpled on luxurious bed, morning golden light streaming through curtains, intimate atmosphere',
    'vanity mirror reflection showing makeup products and jewelry scattered, soft Hollywood lights glow',
  ],
  beach: [
    'designer sunglasses and straw hat on beach towel, turquoise Mediterranean water in background',
    'champagne glass next to iPhone on yacht deck, Mediterranean blue sea blur',
    'bikini top draped on lounge chair, infinity pool edge with ocean view',
  ],
  pool: [
    'champagne flute and sunglasses on pool edge, turquoise water, sunset light',
    'white towel and designer bag on lounge chair, infinity pool backdrop',
  ],
  spa: [
    'fluffy white robe and slippers on spa bed, candles and eucalyptus, zen atmosphere',
    'hot stone massage setup next to champagne, luxury wellness',
  ],
};

// ===========================================
// SEXY LOCATIONS (REAL from cron-scheduler.mjs)
// ===========================================

const ELENA_LOCATIONS = [
  // BEACH & POOL — Bikini content
  { 
    key: 'yacht_mediterranean', 
    name: 'Yacht Méditerranée', 
    setting: 'Luxury yacht deck in Mediterranean sea, golden sunset light, champagne, turquoise water, St Tropez coastline visible, glamorous jet-set atmosphere',
    category: 'beach'
  },
  { 
    key: 'mykonos_villa', 
    name: 'Villa Mykonos', 
    setting: 'White luxury villa in Mykonos with infinity pool overlooking Aegean sea, golden hour sunset, minimalist Greek architecture, turquoise water',
    category: 'pool'
  },
  { 
    key: 'maldives_overwater', 
    name: 'Bungalow Maldives', 
    setting: 'Overwater bungalow in Maldives, crystal clear turquoise lagoon, wooden deck, palm trees, tropical paradise sunset',
    category: 'beach'
  },
  { 
    key: 'dubai_marina', 
    name: 'Penthouse Dubai Marina', 
    setting: 'Luxury penthouse rooftop infinity pool Dubai Marina, sunset skyline, Burj Khalifa view, modern luxury, golden hour',
    category: 'pool'
  },
  // SPA & WELLNESS
  { 
    key: 'spa_mountains', 
    name: 'Spa Alpes', 
    setting: 'Luxury alpine spa with heated outdoor pool, snowy mountains backdrop, steam rising, wooden chalet architecture, cozy winter luxury',
    category: 'spa'
  },
  { 
    key: 'courchevel_chalet', 
    name: 'Chalet Courchevel', 
    setting: 'Luxury chalet in Courchevel with outdoor jacuzzi, panoramic mountain view, après-ski atmosphere, warm lighting against snow',
    category: 'spa'
  },
];

// ===========================================
// SEXY OUTFITS (REAL from cron-scheduler.mjs)
// ===========================================

const ELENA_OUTFITS = {
  beach: [
    'designer bikini string noir avec détails dorés, silhouette mise en valeur, golden tan visible',
    'bikini blanc minimaliste triangles, bronzage visible, élégance naturelle méditerranéenne',
    'maillot une pièce plongeant noir très échancré, allure sophistiquée jet-set',
    'bikini terracotta avec liens à nouer, style méditerranéen chic, curves accentuated',
  ],
  pool: [
    'bikini blanc minimaliste, wet hair, natural beauty, pool goddess vibes',
    'maillot une pièce plongeant noir très échancré, poolside elegance',
    'designer bikini string noir, golden tan, infinity pool lifestyle',
  ],
  spa: [
    'peignoir soie blanc entrouvert révélant maillot underneath, spa luxury',
    'serviette nouée élégamment around body, épaules et jambes visibles, spa goddess',
    'fluffy white robe slightly open, bikini visible, wellness vibes',
  ],
};

// ===========================================
// SEXY POSES (REAL from cron-scheduler.mjs)
// ===========================================

const ELENA_ACTIONS = [
  'allongée sur le côté au bord de la piscine, appuyée sur le coude, regard captivant vers caméra',
  'debout de dos regardant par-dessus l\'épaule, courbes mises en valeur, sunset light',
  'assise bord de piscine, jambes dans l\'eau, posture confiante, champagne in hand',
  'stretching yoga on deck, dos légèrement cambré, silhouette étirée against sunset',
  'appuyée contre le bord du jacuzzi, épaules hors de l\'eau, steam rising',
  'allongée sur transat, jambes croisées, sunbathing pose, sunglasses',
  'walking on yacht deck, wind in hair, candid movement shot',
  'standing at infinity pool edge, back to camera, overlooking view',
];

// ===========================================
// HELPERS
// ===========================================

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

function log(msg) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

// ===========================================
// GENERATE IMAGE
// ===========================================

async function generateImage(location, outfit, action, expression, index, sceneRefBase64 = null) {
  const config = ELENA_CONFIG;
  
  const prompt = `${config.reference_instruction}

SUBJECT: Elena, 24 year old Italian woman living in Paris,
${config.face_description},
${config.marks},
${config.body_description},

SETTING: ${location.setting}

OUTFIT: wearing ${outfit}

ACTION: ${action}

EXPRESSION: ${expression}

STYLE: Shot on iPhone 15 Pro, RAW unedited authentic look
- NO Instagram filters, NO heavy color grading, natural flat colors
- Real indoor lighting (warm lamps, cool window light, blue screen glow - mix naturally)
- Environment VISIBLE around subject - show the room, objects, messy details
- Subject takes 50-70% of frame, NOT perfectly centered, breathing room around
- Natural skin with texture and imperfections (not airbrushed smooth)
- Candid energy like friend took it without warning

EXPRESSION AUTHENTICITY (CRITICAL):
- NOT always looking at camera - can look out window, away, down, at something off-frame
- Natural imperfect moments: mid-blink, mid-laugh, mid-yawn are GOOD
- NO forced smiles - grimaces, silly faces, surprised looks are encouraged
- Can be caught off-guard, distracted, absorbed in thought
- Real emotions: genuine laughs with eyes squeezed, sleepy morning faces, thinking expressions

AVOID: Professional studio, magazine editorial, stock photo, heavy retouching, perfect centering, saturated colors, forced posed expressions

${config.final_check}`;

  log(`  🎨 Image ${index + 1}: ${expression.substring(0, 50)}...`);

  // Prepare references - face + body + profile + back
  const refs = [config.face_ref, config.body_ref, config.profile_ref, config.back_ref];
  const refBase64 = await Promise.all(refs.map(urlToBase64));
  
  if (sceneRefBase64) {
    refBase64.unshift(sceneRefBase64);
    log(`    ↳ Using scene reference for consistency`);
  }

  try {
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt,
        negative_prompt: 'ugly, deformed, noisy, blurry, low quality, cartoon, anime, illustration, painting, drawing, watermark, text, logo, bad anatomy, extra limbs, missing limbs, mutation, disfigured, poorly drawn face, cloned face, malformed limbs, fused fingers, too many fingers, username, signature, professional studio lighting, magazine cover, stock photo, overly retouched, artificial lighting, forced smile, posed expression',
        aspect_ratio: '4:5',
        resolution: '2K',
        output_format: 'jpg',
        safety_filter_level: 'block_only_high',
        image_input: refBase64,
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    log(`    ✅ Generated`);
    return imageUrl;
  } catch (error) {
    // Fallback with safer prompt if flagged
    if (error.message?.includes('flagged') || error.message?.includes('safety') || error.message?.includes('sensitive')) {
      log(`    ⚠️ Prompt flagged, trying safer version...`);
      const saferPrompt = prompt
        .replace(/sensual/gi, 'confident')
        .replace(/sexy/gi, 'stylish')
        .replace(/sultry/gi, 'captivating')
        .replace(/alluring/gi, 'charming')
        .replace(/curves/gi, 'silhouette')
        .replace(/intimate/gi, 'cozy');

      const output = await replicate.run(NANO_BANANA_MODEL, {
        input: {
          prompt: saferPrompt,
          negative_prompt: 'ugly, deformed, noisy, blurry, low quality, cartoon, anime',
          aspect_ratio: '4:5',
          resolution: '2K',
          output_format: 'jpg',
          safety_filter_level: 'block_only_high',
          image_input: refBase64,
        },
      });

      const imageUrl = Array.isArray(output) ? output[0] : output;
      log(`    ✅ Generated with safer prompt`);
      return imageUrl;
    }
    throw error;
  }
}

// ===========================================
// UPLOAD TO CLOUDINARY
// ===========================================

async function uploadToCloudinary(imageUrl, postNum, imageNum) {
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${ELENA_CONFIG.cloudinary_folder}/test-post${postNum}-img${imageNum}-${timestamp}`;

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', imageUrl);
  formData.append('public_id', publicId);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', process.env.CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const response = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  
  if (!data.secure_url) {
    throw new Error(`Cloudinary upload failed: ${JSON.stringify(data)}`);
  }
  
  return data.secure_url;
}

// ===========================================
// GENERATE SIMPLE CAPTION
// ===========================================

async function generateCaption(location, mood, action) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Generate a short Instagram caption for Elena (24yo Italian model in Paris).

Location: ${location.name}
Mood: ${mood}
Action: ${action}

Requirements:
- MICRO-STORY format in English: Hook → Story → Reflection → Soft CTA to private
- ~50-80 words max
- Warm, confident, slightly playful tone
- End with soft CTA like "The rest of this set is on my private 🖤" or "More on my private..."
- NO emojis spam (max 2-3)
- Add 5 hashtags at the end

Just output the caption, nothing else.`
    }],
  });

  return response.content[0].text;
}

// ===========================================
// MAIN
// ===========================================

async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🧪 TEST: Natural Face Variations — ELENA');
  console.log('═'.repeat(60));
  console.log('📌 Mode: DRY RUN (no DB save, no IG post)');
  console.log('📌 Images: Uploaded to Cloudinary for review');
  console.log('═'.repeat(60) + '\n');

  const results = [];

  // Generate 2 test posts (like Elena's daily schedule)
  for (let postNum = 1; postNum <= 2; postNum++) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📸 POST ${postNum}/2`);
    console.log('─'.repeat(60));

    const location = randomFrom(ELENA_LOCATIONS);
    
    // Get outfit based on location category (beach, pool, spa)
    const outfitCategory = location.category || 'beach';
    const categoryOutfits = ELENA_OUTFITS[outfitCategory] || ELENA_OUTFITS.beach;
    const outfit = randomFrom(categoryOutfits);
    
    const baseAction = randomFrom(ELENA_ACTIONS);
    const mood = ['sunset vibes', 'jet-set luxury', 'golden hour magic', 'paradise life'][Math.floor(Math.random() * 4)];

    log(`📍 Location: ${location.name} (${outfitCategory})`);
    log(`👗 Outfit: ${outfit.substring(0, 50)}...`);
    log(`🎬 Action: ${baseAction.substring(0, 50)}...`);
    log(`✨ Mood: ${mood}`);

    // Generate carousel (3 images)
    const imageUrls = [];
    let firstImageBase64 = null;

    for (let i = 0; i < CAROUSEL_SIZE; i++) {
      // Pick expression - Hero for first, Secondary for others
      const expression = i === 0 
        ? randomFrom(HERO_EXPRESSIONS)
        : randomFrom(SECONDARY_EXPRESSIONS);

      // Generate image
      const imageUrl = await generateImage(
        location,
        outfit,
        baseAction,
        expression,
        i,
        i > 0 ? firstImageBase64 : null
      );

      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(imageUrl, postNum, i + 1);
      imageUrls.push({ url: cloudinaryUrl, expression });

      // Store first image for scene consistency
      if (i === 0) {
        firstImageBase64 = await urlToBase64(cloudinaryUrl);
      }
    }

    // Generate caption
    log(`\n📝 Generating caption...`);
    const caption = await generateCaption(location, mood, baseAction);

    results.push({
      postNum,
      location: location.name,
      outfit,
      action: baseAction,
      mood,
      images: imageUrls,
      caption,
    });

    console.log(`\n✅ Post ${postNum} complete!`);
  }

  // ===========================================
  // RESULTS SUMMARY
  // ===========================================

  console.log('\n\n' + '═'.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('═'.repeat(60));

  for (const post of results) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📸 POST ${post.postNum}`);
    console.log('─'.repeat(60));
    console.log(`📍 Location: ${post.location}`);
    console.log(`👗 Outfit: ${post.outfit}`);
    console.log(`🎬 Action: ${post.action}`);
    console.log(`✨ Mood: ${post.mood}`);
    
    console.log(`\n🖼️ Images (Cloudinary URLs):`);
    post.images.forEach((img, i) => {
      console.log(`   ${i + 1}. ${img.url}`);
      console.log(`      Expression: ${img.expression.substring(0, 60)}...`);
    });

    console.log(`\n📝 CAPTION:`);
    console.log('─'.repeat(40));
    console.log(post.caption);
    console.log('─'.repeat(40));
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ TEST COMPLETE — Review images in Cloudinary');
  console.log('═'.repeat(60) + '\n');
}

main().catch(console.error);

