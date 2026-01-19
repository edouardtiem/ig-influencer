#!/usr/bin/env node
/**
 * Scheduled Post Script — Uses schedule params from Content Brain
 * 
 * This script reads the post parameters from SCHEDULED_POST env var (JSON)
 * and generates content based on those params instead of using hardcoded themes.
 * 
 * Usage:
 *   SCHEDULED_POST='{"character":"mila",...}' node scripts/scheduled-post.mjs
 *   node scripts/scheduled-post.mjs --test  (dry run)
 */

import Replicate from 'replicate';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local for local development
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
const REEL_SIZE = 3;
const SECONDS_PER_PHOTO = 3;
const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// ===========================================
// CHARACTER CONFIGS
// ===========================================

const CHARACTERS = {
  mila: {
    name: 'Mila',
    face_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
    body_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png',
    extra_refs: [
      'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
      'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
    ],
    reference_instruction: `You are provided with reference images in order:

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

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Body proportions MUST match Image 2
- Hair MUST be copper auburn with curls (NOT straight, NOT dark brown)
- ALWAYS include the beauty mark above left lip and freckles`,
    face_description: `oval elongated face shape with high naturally defined cheekbones,
soft feminine jawline not angular, chin slightly pointed,
copper auburn hair type 3A loose curls shoulder-length with natural volume and messy texture,
almond-shaped hazel-green eyes with golden flecks, natural full eyebrows slightly arched,
straight nose with slightly upturned tip (cute nose),
naturally full lips medium thickness with subtle asymmetry, rose-nude natural color`,
    marks: `small dark brown beauty mark 2mm above left lip corner (SIGNATURE),
medium brown beauty mark on center of right cheekbone,
20-25 light golden-brown freckles on nose bridge and cheekbones,
thin gold necklace with minimalist star pendant always visible`,
    body_description: `slim athletic physique 168cm, Mediterranean light tan skin,
natural full feminine curves with defined waist,
toned but not muscular, Pilates-sculpted shoulders`,
    final_check: `FINAL CHECK - MUST MATCH REFERENCES:
- SINGLE IMAGE ONLY - NO collages, NO grids, NO patchwork, NO multiple photos combined
- Face: IDENTICAL to Image 1 (oval face, copper auburn curly hair)
- Body: IDENTICAL to Image 2 (slim athletic, toned)
- Beauty mark: above left lip corner MUST be visible (SIGNATURE)
- Freckles: on nose and cheekbones
- Jewelry: thin gold necklace with star pendant`,
    instagram_token_env: 'INSTAGRAM_ACCESS_TOKEN',
    instagram_account_env: 'INSTAGRAM_ACCOUNT_ID',
    cloudinary_folder: 'mila-scheduled',
  },
  elena: {
    name: 'Elena',
    face_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
    body_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png',
    extra_refs: [
      'https://res.cloudinary.com/dily60mr0/image/upload/v1767562505/replicate-prediction-bjnvs97bqxrmy0cvhbpa8cx5f8_daohqh.png', // Back view
    ],
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

**IMAGE 3 (BACK REFERENCE)**: This is Elena from BEHIND. For back views:
- Same hair color, length, and balayage pattern from behind
- Same shoulder width and body silhouette
- Same skin tone

CRITICAL RULES:
- Face MUST be identical to Image 1 - same person, same features
- Body proportions MUST match Image 2 - same curves, same large bust size
- For BACK VIEWS: use Image 3 as back guide
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
- Face: IDENTICAL to Image 1 (soft round face, NOT angular)
- Body: IDENTICAL to Image 2 (shapely with very large bust visible)
- Hair: bronde with VISIBLE golden blonde balayage (NOT solid dark brown)
- Beauty mark: on right cheekbone MUST be visible
- Jewelry: gold chunky bracelet + layered gold necklaces`,
    instagram_token_env: 'INSTAGRAM_ACCESS_TOKEN_ELENA',
    instagram_account_env: 'INSTAGRAM_ACCOUNT_ID_ELENA',
    cloudinary_folder: 'elena-scheduled',
  },
};

// ===========================================
// EXPRESSIONS (varied for carousel/reel)
// Mix: Sexy (docs/19-QUALITY-SEXY-STRATEGY.md) + Natural/Candid
// ===========================================

const EXPRESSIONS = {
  mila: [
    'captivating magnetic gaze at camera, slight knowing smile, eyes sparkling',
    'soft warm gaze with feminine allure, lips slightly parted, enchanting presence',
    'playful smirk, direct eye contact, effortless charm',
    'striking confident look, natural beauty radiating, approachable warmth',
    'pensive look gazing away, alluring charm, caught in thought',
    'genuine relaxed smile, radiant expression, authentic moment',
  ],
  elena: [
    // === SEXY (keep the allure) ===
    'intense captivating gaze at camera, lips slightly parted, smoldering confidence',
    'enchanting knowing smile, direct eye contact, magnetic allure, curves visible',
    'soft alluring expression, warm inviting eyes, effortless glamour',
    'looking over shoulder with captivating glance, mysterious and inviting',
    'playful charming smirk, soft bite of lower lip, inviting look',
    'sultry gaze through half-closed eyes, sensual confidence, alluring',
    
    // === NATURAL/CANDID (add authenticity) ===
    'genuine laugh mid-burst, eyes crinkled, authentic joy, candid energy',
    'looking out window dreamily, profile view, contemplative mood, curves silhouette',
    'eyes closed enjoying moment, peaceful sensual smile, vibing',
    'caught off-guard glance over shoulder, surprised candid moment',
    'side profile gazing away, pensive natural moment, soft light on curves',
    'comfortable resting expression, not posing, natural beauty',
  ],
};

// ===========================================
// DETAIL SHOTS (environment without subject - for image 3 sometimes)
// Modern IG trend: storytelling through environment details
// ===========================================

const DETAIL_SHOTS = {
  bedroom: [
    'close-up of silk sheets rumpled on luxurious bed, morning golden light streaming through curtains, intimate atmosphere',
    'vanity mirror reflection showing makeup products and jewelry scattered, soft Hollywood lights glow, feminine luxury',
    'silk robe draped elegantly over velvet chair, golden morning light, Parisian apartment elegance',
    'iPhone on silk pillow next to gold jewelry and coffee cup, intimate morning still life',
  ],
  living: [
    'coffee cup steaming on marble side table next to fashion magazine, soft morning light, Parisian loft',
    'cozy velvet sofa corner with cashmere throw and book, golden afternoon light, hygge vibes',
    'iPhone propped against plant with instagram open, modern lifestyle detail shot',
    'gold jewelry scattered on coffee table next to espresso, luxury lifestyle detail',
  ],
  bathroom: [
    'bathroom mirror with steam, candles lit around marble tub, spa atmosphere',
    'luxury skincare products arranged on marble counter, golden light, self-care ritual',
    'silk robe hanging on golden hook, marble and gold bathroom details, feminine luxury',
    'bath with bubbles and rose petals, candles flickering, intimate spa moment',
  ],
  beach: [
    'designer sunglasses and straw hat on beach towel, turquoise water in background',
    'champagne glass next to iPhone on yacht deck, Mediterranean blue sea blur',
    'bikini top draped on lounge chair, infinity pool edge with ocean view',
  ],
  spa: [
    'fluffy white robe and slippers on spa bed, candles and essential oils, zen atmosphere',
    'hot stone massage setup, eucalyptus and candles, luxury wellness',
  ],
};

// ===========================================
// SEXY OUTFIT ENHANCERS FOR ELENA
// Based on docs/characters/elena/AUDIENCE.md - "très sexy" positioning
// ===========================================

// Safe sexy vocabulary that passes Google filters while staying alluring
const ELENA_SEXY_OUTFIT_DETAILS = {
  bedroom: [
    'silk slip dress with delicate straps, fabric draping elegantly over curves, intimate elegance',
    'elegant lace loungewear set, confident feminine energy, silhouette emphasized',
    'silk camisole and matching shorts set champagne color, fabric following curves',
    'oversized cream sweater worn as dress off-shoulder, legs visible, cozy intimate morning',
    'delicate lace top visible under unbuttoned white oversized shirt, fitted shorts',
  ],
  living: [
    'fitted crop top showing midriff, high-waisted leggings hugging curves tightly',
    'cream oversized knit sweater falling off one shoulder, fitted black shorts',
    'fitted white ribbed tank top emphasizing silhouette, high-waisted black leggings',
    'silk robe elegantly tied at waist, loungewear underneath',
    'oversized mens white shirt partially unbuttoned, cycling shorts',
  ],
  bathroom: [
    'luxurious white towel wrapped elegantly around body, hair wet, skin glowing',
    'silk robe tied loosely, getting ready moment, feminine',
    'matching cream loungewear set, showing midriff and silhouette',
  ],
  default: [
    'form-fitting dress emphasizing elegant silhouette',
    'elegant top with feminine neckline, fitted bottom',
    'bodycon outfit accentuating feminine curves',
  ],
};

const ELENA_SEXY_ACTION_DETAILS = {
  bedroom: [
    'lying on bed propped on elbow, relaxed elegant pose, looking at camera with warm gaze',
    'sitting on bed edge, leaning back on hands, legs extended elegantly',
    'stretching on bed just woke up, natural morning moment',
    'standing by window in morning light, elegant silhouette',
  ],
  living: [
    'lounging on sofa elegantly, legs tucked, relaxed confident pose',
    'leaning against doorframe, hip slightly cocked, confident feminine pose',
    'sitting with legs crossed, leaning forward slightly, engaging camera warmly',
  ],
  bathroom: [
    'standing in front of mirror, glowing skin, elegant reflection',
    'applying skincare, natural beauty moment, mirror reflection',
  ],
  default: [
    'confident elegant pose',
    'relaxed feminine body language',
  ],
};

// ===========================================
// SEXY OUTFIT ENHANCERS FOR MILA
// Based on docs/characters/mila/PERSONNAGE.md - "Sexy Light-Medium (30%)"
// ===========================================

const MILA_SEXY_OUTFIT_DETAILS = {
  bedroom: [
    'silk champagne camisole with thin delicate straps, matching shorts, intimate elegance',
    'oversized white cotton t-shirt slipping off one shoulder, bare legs, just woke up authentic',
    'fitted ribbed gray bodysuit with thin spaghetti straps, fabric hugging curves elegantly',
    'delicate lace bralette visible under loose tank top, cozy morning',
    'oversized cream knit sweater falling off shoulder, cotton boyshort underneath',
  ],
  living: [
    'fitted ribbed bodysuit heather gray, thin straps, barefoot on sofa, relaxed allure',
    'oversized cream sweater slipping off one shoulder revealing skin, bare legs tucked',
    'matching loungewear set cropped top and high-waisted leggings, showing midriff',
    'fitted tank top natural silhouette, cotton shorts casual home',
    'yoga set fitted crop top and high-waisted leggings showing toned midriff',
  ],
  gym: [
    'matching sports bra and high-waisted leggings, form-fitting, showing toned midriff',
    'fitted sports bra and bike shorts, athletic but feminine, showing curves',
    'seamless workout set, cropped top showing waist, sculpting leggings',
    'sports bra with mesh details, high-waisted leggings, athletic allure',
  ],
  outdoor: [
    'fitted ribbed top, high-waisted jeans, effortless Parisian chic',
    'crop top showing midriff, high-waisted vintage jeans, casual confidence',
    'mini dress flowing fabric, natural silhouette, feminine energy',
  ],
  default: [
    'form-fitting outfit emphasizing athletic silhouette',
    'casual chic showing natural curves tastefully',
    'fitted athleisure highlighting toned body',
  ],
};

const MILA_SEXY_ACTION_DETAILS = {
  bedroom: [
    'stretching on bed, natural morning moment, relaxed and confident',
    'sitting on bed edge, legs tucked, warm inviting pose',
    'standing by window in morning light, natural silhouette',
  ],
  living: [
    'lounging on sofa elegantly, legs tucked, relaxed confident pose',
    'sitting with guitar, creative intimate moment',
    'relaxed on floor with coffee, casual authentic vibe',
  ],
  gym: [
    'mid-workout pose, confident and focused',
    'stretching, athletic flexibility visible',
    'casual gym selfie, natural confidence',
  ],
  outdoor: [
    'walking with natural confidence, hair moving',
    'leaning against wall, casual cool pose',
    'candid moment, authentic street style',
  ],
  default: [
    'confident natural pose',
    'relaxed authentic body language',
  ],
};

function getLocationCategory(locationName) {
  const name = locationName.toLowerCase();
  if (name.includes('bedroom') || name.includes('chambre') || name.includes('lit')) return 'bedroom';
  if (name.includes('living') || name.includes('salon') || name.includes('loft')) return 'living';
  if (name.includes('bathroom') || name.includes('salle de bain') || name.includes('bath')) return 'bathroom';
  if (name.includes('gym') || name.includes('fitness') || name.includes('sport')) return 'gym';
  if (name.includes('street') || name.includes('cafe') || name.includes('outdoor') || name.includes('paris')) return 'outdoor';
  return 'default';
}

function enhanceElenaOutfit(originalOutfit, locationName) {
  const category = getLocationCategory(locationName);
  const sexyOptions = ELENA_SEXY_OUTFIT_DETAILS[category] || ELENA_SEXY_OUTFIT_DETAILS.default;
  const sexyOutfit = sexyOptions[Math.floor(Math.random() * sexyOptions.length)];
  return `${sexyOutfit}, ${originalOutfit}`;
}

function enhanceElenaAction(originalAction, locationName) {
  const category = getLocationCategory(locationName);
  const sexyOptions = ELENA_SEXY_ACTION_DETAILS[category] || ELENA_SEXY_ACTION_DETAILS.default;
  const sexyAction = sexyOptions[Math.floor(Math.random() * sexyOptions.length)];
  return `${sexyAction}, ${originalAction}`;
}

function enhanceMilaOutfit(originalOutfit, locationName) {
  const category = getLocationCategory(locationName);
  const sexyOptions = MILA_SEXY_OUTFIT_DETAILS[category] || MILA_SEXY_OUTFIT_DETAILS.default;
  const sexyOutfit = sexyOptions[Math.floor(Math.random() * sexyOptions.length)];
  return `${sexyOutfit}, ${originalOutfit}`;
}

function enhanceMilaAction(originalAction, locationName) {
  const category = getLocationCategory(locationName);
  const sexyOptions = MILA_SEXY_ACTION_DETAILS[category] || MILA_SEXY_ACTION_DETAILS.default;
  const sexyAction = sexyOptions[Math.floor(Math.random() * sexyOptions.length)];
  return `${sexyAction}, ${originalAction}`;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===========================================
// GENERATE IMAGE
// ===========================================

async function generateImage(character, setting, outfit, action, promptHints, index, locationName, sceneReferenceBase64 = null, isReel = false) {
  const config = CHARACTERS[character];
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Use 9:16 for reels, 4:5 for carousels
  const aspectRatio = isReel ? '9:16' : '4:5';

  // Get character-specific expressions
  const charExpressions = EXPRESSIONS[character] || EXPRESSIONS.mila;
  const expression = charExpressions[index % charExpressions.length];

  // Enhance outfit and action for sexy positioning (both characters)
  let finalOutfit = outfit;
  let finalAction = action;
  if (character === 'elena') {
    finalOutfit = enhanceElenaOutfit(outfit, locationName || setting);
    finalAction = enhanceElenaAction(action, locationName || setting);
    log(`  🔥 Elena sexy enhancement applied`);
  } else if (character === 'mila') {
    finalOutfit = enhanceMilaOutfit(outfit, locationName || setting);
    finalAction = enhanceMilaAction(action, locationName || setting);
    log(`  🔥 Mila sexy enhancement applied`);
  }

  // Build the prompt using schedule params with explicit reference mapping
  const prompt = `${config.reference_instruction}

SUBJECT (copy from references): ${config.face_description},
${config.marks},
${config.body_description}

SETTING: ${setting}

OUTFIT: ${finalOutfit}

ACTION: ${finalAction}

EXPRESSION: ${expression}

${promptHints ? `ADDITIONAL HINTS: ${promptHints}` : ''}

STYLE: Shot on iPhone 15 Pro, RAW unedited authentic look
- NO Instagram filters, NO heavy color grading, natural flat colors
- Real indoor lighting (warm lamps, cool window light, blue screen glow - mix naturally)
- Environment VISIBLE around subject - show the room, objects, messy details
- Subject takes 50-70% of frame, NOT perfectly centered, breathing room around
- Natural skin with texture and imperfections (not airbrushed smooth)
- Visible grain/noise in shadows (authentic low-light iPhone feel)
- Candid energy like friend took it without warning
- Show real environment details: phone, coffee cup, unmade bed, clothes, furniture

EXPRESSION AUTHENTICITY (CRITICAL):
- NOT always looking at camera - can look out window, away, down, at something off-frame
- Natural imperfect moments: mid-blink, mid-laugh, mid-yawn are GOOD
- NO forced smiles - grimaces, silly faces, surprised looks are encouraged
- Can be caught off-guard, distracted, absorbed in thought
- Real emotions: genuine laughs with eyes squeezed, sleepy morning faces, thinking expressions

AVOID: Professional studio, magazine editorial, stock photo, heavy retouching, perfect centering, overly clean backgrounds, saturated colors, forced posed expressions

${config.final_check}`;

  log(`  Generating image ${index + 1}...`);
  log(`  Setting: ${setting.substring(0, 60)}...`);
  log(`  Outfit: ${outfit.substring(0, 60)}...`);

  // Prepare references - add scene reference first for outfit/scene consistency
  const refs = [config.face_ref, config.body_ref, ...config.extra_refs].filter(Boolean);
  log(`  Converting ${refs.length} references to base64...`);
  const refBase64 = await Promise.all(refs.map(urlToBase64));
  
  // Add scene reference at the beginning for stronger consistency (images 2 and 3)
  if (sceneReferenceBase64) {
    refBase64.unshift(sceneReferenceBase64);
    log(`  👗 Added first image as scene reference for consistency`);
  }

  try {
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt,
        negative_prompt: 'ugly, deformed, noisy, blurry, low quality, cartoon, anime, illustration, painting, drawing, watermark, text, logo, bad anatomy, extra limbs, missing limbs, mutation, disfigured, poorly drawn face, cloned face, malformed limbs, fused fingers, too many fingers, username, signature, professional studio lighting, magazine cover, stock photo, overly retouched, artificial lighting',
        aspect_ratio: aspectRatio,
        resolution: '2K',
        output_format: 'jpg',
        safety_filter_level: 'block_only_high',
        image_input: refBase64,
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    log(`  ✅ Generated successfully`);
    return imageUrl;
  } catch (error) {
    // Try with safer prompt if flagged
    if (error.message?.includes('flagged') || error.message?.includes('safety')) {
      log(`  ⚠️ Prompt flagged, trying safer version...`);
      const saferPrompt = prompt
        .replace(/sensual/gi, 'confident')
        .replace(/sexy/gi, 'stylish')
        .replace(/cleavage/gi, 'neckline')
        .replace(/bikini/gi, 'swimwear');

      const output = await replicate.run(NANO_BANANA_MODEL, {
        input: {
          prompt: saferPrompt,
          negative_prompt: 'ugly, deformed, noisy, blurry, low quality, cartoon, anime',
          aspect_ratio: aspectRatio,
          resolution: '2K',
          output_format: 'jpg',
          safety_filter_level: 'block_only_high',
          image_input: refBase64,
        },
      });

      const imageUrl = Array.isArray(output) ? output[0] : output;
      log(`  ✅ Generated with safer prompt`);
      return imageUrl;
    }
    throw error;
  }
}

// ===========================================
// GENERATE DETAIL SHOT (environment only, no subject)
// Modern IG trend: storytelling through environment details
// ===========================================

async function generateDetailShot(locationName, sceneReferenceBase64 = null) {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Determine location category
  const locationLower = locationName.toLowerCase();
  let category = 'living'; // default
  if (locationLower.includes('bedroom') || locationLower.includes('chambre')) category = 'bedroom';
  else if (locationLower.includes('bathroom') || locationLower.includes('bain')) category = 'bathroom';
  else if (locationLower.includes('beach') || locationLower.includes('pool') || locationLower.includes('yacht')) category = 'beach';
  else if (locationLower.includes('spa')) category = 'spa';
  
  // Get detail shots for this category
  const detailOptions = DETAIL_SHOTS[category] || DETAIL_SHOTS.living;
  const detailPrompt = detailOptions[Math.floor(Math.random() * detailOptions.length)];
  
  log(`  📷 Generating DETAIL SHOT (no subject)...`);
  log(`  Category: ${category}`);
  log(`  Detail: ${detailPrompt.substring(0, 60)}...`);

  const prompt = `DETAIL SHOT - Environment only, NO PERSON in frame:

${detailPrompt}

STYLE: Shot on iPhone 15 Pro, RAW unedited authentic look
- NO Instagram filters, natural flat colors
- Real indoor lighting (warm lamps, cool window light)
- Intimate detail shot, as if photographing your own space
- 4:5 portrait aspect ratio
- Shallow depth of field, some bokeh
- Lifestyle still life aesthetic

CRITICAL: NO person, NO body parts, NO face in this image. Environment details ONLY.

AVOID: People, faces, hands, body parts, professional studio lighting, stock photo look`;

  // Use scene reference if available for consistent environment
  const refs = sceneReferenceBase64 ? [sceneReferenceBase64] : [];

  try {
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt,
        negative_prompt: 'person, human, face, body, hands, fingers, portrait, model, woman, man, people, ugly, deformed, blurry, low quality, cartoon, anime',
        aspect_ratio: '4:5',
        resolution: '2K',
        output_format: 'jpg',
        safety_filter_level: 'block_only_high',
        image_input: refs.length > 0 ? refs : undefined,
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    log(`  ✅ Detail shot generated`);
    return imageUrl;
  } catch (error) {
    log(`  ⚠️ Detail shot failed, falling back to regular image`);
    return null; // Caller will fall back to regular image
  }
}

// ===========================================
// UPLOAD TO CLOUDINARY
// ===========================================

async function uploadToCloudinary(imageUrl, character, postType, index) {
  const config = CHARACTERS[character];
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${config.cloudinary_folder}/${postType}-${index + 1}-${timestamp}`;

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;

  // Generate signature for signed upload
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
  
  log(`  ☁️ Uploaded: ${data.secure_url}`);
  return data.secure_url;
}

// ===========================================
// KLING VIDEO PROMPT — Instagram 2026 Style
// ===========================================

function buildKlingPrompt(action, setting, mood) {
  return `SETTING: ${setting}

ACTION: ${action}

STYLE: Instagram Reel 2026 aesthetic
- iPhone video quality, authentic content vibe
- Natural casual movement (not choreographed)
- "Caught on camera" authentic feel
- The kind of reel that goes viral organically
- Main character energy, effortless cool

SPEED CRITICAL:
- REAL-TIME SPEED only
- NO slow motion whatsoever
- Normal human movement pace
- Instagram Reel pacing (quick, engaging)

MOVEMENTS (subtle and natural):
- Gentle breathing visible in shoulders
- Hair moving slightly with natural air
- Natural eye blinks
- Micro-expressions (slight smile changes)
- Fabric settling naturally

CAMERA: Static or very subtle pan. No dramatic moves.

MOOD: ${mood}

AVOID: Slow motion, cinematic camera moves, CGI look, TikTok transitions, overly produced feel, artificial movements`;
}

// ===========================================
// DOWNLOAD FILE HELPER
// ===========================================

async function downloadFile(url, destPath) {
  const { default: https } = await import('https');
  const { default: http } = await import('http');
  
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    proto.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// ===========================================
// CREATE REEL VIDEO (Kling v2.5 Animation)
// ===========================================

async function createReelVideo(imageUrls, character, postParams = {}) {
  const config = CHARACTERS[character];
  const outputDir = path.join(__dirname, '..', 'generated', config.cloudinary_folder);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  // Download images locally first
  log(`🎬 Preparing ${imageUrls.length} images for Kling animation...`);
  const localImagePaths = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const response = await fetch(imageUrls[i]);
    const buffer = Buffer.from(await response.arrayBuffer());
    const localPath = path.join(outputDir, `temp-img-${i}.jpg`);
    fs.writeFileSync(localPath, buffer);
    localImagePaths.push(localPath);
  }

  // Kling action variations for narrative progression
  const baseAction = postParams.action || 'natural movement, looking at camera';
  const klingActions = [
    `${baseAction}, subtle movement, holds position naturally`,
    `${baseAction}, transitions smoothly, natural body adjustment`,
    `${baseAction}, finishes movement, warm smile toward camera`,
  ];

  const setting = postParams.prompt_hints || postParams.location_name || 'aesthetic interior';
  const mood = postParams.mood || 'authentic, natural';

  // Generate Kling clips in parallel
  log(`🎬 Generating ${localImagePaths.length} Kling clips (parallel)...`);
  const startTime = Date.now();

  const clipPromises = localImagePaths.map(async (imgPath, i) => {
    log(`   Clip ${i + 1}/${localImagePaths.length}: Starting Kling...`);
    const clipStart = Date.now();
    
    const imageBase64 = `data:image/jpeg;base64,${fs.readFileSync(imgPath).toString('base64')}`;
    const prompt = buildKlingPrompt(klingActions[i] || klingActions[0], setting, mood);
    
    try {
      const output = await replicate.run('kwaivgi/kling-v2.5-turbo-pro', {
        input: {
          prompt,
          image: imageBase64,
          duration: 5,
          aspect_ratio: '9:16',
        },
      });
      
      // Extract URL from various Replicate output formats
      let videoUrl = null;
      
      if (typeof output === 'string') {
        videoUrl = output;
      } else if (output && typeof output === 'object') {
        // Check if it's a FileOutput with href() method
        if (typeof output.url === 'function') {
          const urlObj = output.url();
          videoUrl = urlObj?.href || String(urlObj);
        } else if (output.url) {
          videoUrl = String(output.url);
        } else if (output.href) {
          videoUrl = String(output.href);
        } else if (output.video) {
          videoUrl = typeof output.video === 'string' ? output.video : output.video?.url;
        }
      }
      
      // Array output
      if (!videoUrl && Array.isArray(output) && output[0]) {
        const first = output[0];
        if (typeof first === 'string') {
          videoUrl = first;
        } else if (first && typeof first === 'object') {
          if (typeof first.url === 'function') {
            const urlObj = first.url();
            videoUrl = urlObj?.href || String(urlObj);
          } else {
            videoUrl = first.url || first.href || first.video;
          }
        }
      }
      
      // Last resort: try to extract URL from stringified output
      if (!videoUrl) {
        const outputStr = JSON.stringify(output);
        const urlMatch = outputStr.match(/https?:\/\/[^\s"]+\.mp4[^"']*/);
        if (urlMatch) {
          videoUrl = urlMatch[0];
        }
      }
      
      if (!videoUrl || typeof videoUrl !== 'string') {
        log(`   ❌ Clip ${i + 1}: No valid URL in Kling output`);
        return null;
      }
      
      // Download clip
      const clipPath = path.join(outputDir, `clip-${i + 1}-${Date.now()}.mp4`);
      await downloadFile(videoUrl, clipPath);
      
      const duration = ((Date.now() - clipStart) / 1000).toFixed(1);
      log(`   ✅ Clip ${i + 1} generated in ${duration}s`);
      return clipPath;
      
    } catch (err) {
      log(`   ❌ Clip ${i + 1} Kling error: ${err.message?.slice(0, 80) || err}`);
      return null;
    }
  });

  const clipPaths = await Promise.all(clipPromises);
  const validClips = clipPaths.filter(Boolean);
  
  const klingTime = ((Date.now() - startTime) / 1000).toFixed(1);
  log(`   📊 ${validClips.length}/${localImagePaths.length} clips generated in ${klingTime}s`);

  // Cleanup temp images
  localImagePaths.forEach(p => { try { fs.unlinkSync(p); } catch {} });

  if (validClips.length === 0) {
    throw new Error('No Kling clips generated - cannot create reel');
  }

  // Assemble clips with FFmpeg
  log(`🎞️ Assembling ${validClips.length} clips with FFmpeg...`);
  const listPath = path.join(outputDir, 'clips.txt');
  fs.writeFileSync(listPath, validClips.map(p => `file '${p}'`).join('\n'));
  
  const outputPath = path.join(outputDir, `reel-${Date.now()}.mp4`);
  await execAsync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`);
  
  // Cleanup clips and list
  fs.unlinkSync(listPath);
  validClips.forEach(p => { try { fs.unlinkSync(p); } catch {} });

  log(`  ✅ Reel assembled: ${outputPath}`);

  // Upload video to Cloudinary
  const timestamp = Math.floor(Date.now() / 1000);
  const videoPublicId = `${config.cloudinary_folder}/reel-${timestamp}`;
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`;

  const paramsToSign = `public_id=${videoPublicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash('sha1')
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  const formData = new FormData();
  formData.append('file', new Blob([fs.readFileSync(outputPath)]));
  formData.append('public_id', videoPublicId);
  formData.append('timestamp', timestamp.toString());
  formData.append('api_key', process.env.CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const response = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  
  if (!data.secure_url) {
    throw new Error(`Cloudinary video upload failed: ${JSON.stringify(data)}`);
  }
  
  log(`  ☁️ Video uploaded: ${data.secure_url}`);

  // Cleanup local video
  fs.unlinkSync(outputPath);

  return data.secure_url;
}

// ===========================================
// PUBLISH TO INSTAGRAM
// ===========================================

async function publishCarousel(character, imageUrls, caption) {
  const config = CHARACTERS[character];
  const accessToken = process.env[config.instagram_token_env];
  const accountId = process.env[config.instagram_account_env];

  log(`📤 Publishing carousel to Instagram (${config.name})...`);

  // Validate inputs
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error('Invalid imageUrls: must be a non-empty array');
  }

  // Create media containers for each image
  const containerIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${accountId}/media?image_url=${encodeURIComponent(url)}&is_carousel_item=true&access_token=${accessToken}`,
      { method: 'POST' }
    );
    const data = await response.json();
    
    // Check for API errors
    if (data.error) {
      throw new Error(`Failed to create media container ${i + 1}/${imageUrls.length}: ${data.error.message} (code: ${data.error.code})`);
    }
    
    if (!data.id) {
      throw new Error(`Media container ${i + 1}/${imageUrls.length} creation failed: no ID returned`);
    }
    
    containerIds.push(data.id);
  }

  if (containerIds.length === 0) {
    throw new Error('No media containers created');
  }

  // Wait for all media containers to be ready
  log(`⏳ Waiting for ${containerIds.length} media containers to process...`);
  for (let i = 0; i < containerIds.length; i++) {
    const containerId = containerIds[i];
    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `https://graph.facebook.com/v21.0/${containerId}?fields=status_code,status&access_token=${accessToken}`
      );
      const statusData = await statusResponse.json();
      
      if (statusData.status_code === 'FINISHED') {
        log(`   ✅ Container ${i + 1}/${containerIds.length} ready`);
        break;
      }
      
      if (statusData.status_code === 'ERROR') {
        throw new Error(`Media container ${i + 1} processing failed: ${statusData.status || 'Unknown error'}`);
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
    
    if (attempts >= maxAttempts) {
      throw new Error(`Media container ${i + 1} processing timeout`);
    }
  }

  // Create carousel container
  log(`🎠 Creating carousel container...`);
  const carouselResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media?media_type=CAROUSEL&children=${containerIds.join(',')}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const carouselData = await carouselResponse.json();

  // Check for API errors
  if (carouselData.error) {
    throw new Error(`Failed to create carousel container: ${carouselData.error.message} (code: ${carouselData.error.code})`);
  }

  if (!carouselData.id) {
    throw new Error('Carousel container creation failed: no ID returned');
  }

  // Wait for carousel container to be ready
  log(`⏳ Waiting for carousel container to process...`);
  let carouselAttempts = 0;
  const maxCarouselAttempts = 60;
  
  while (carouselAttempts < maxCarouselAttempts) {
    const carouselStatusResponse = await fetch(
      `https://graph.facebook.com/v21.0/${carouselData.id}?fields=status_code,status&access_token=${accessToken}`
    );
    const carouselStatusData = await carouselStatusResponse.json();
    
    if (carouselStatusData.status_code === 'FINISHED') {
      log(`   ✅ Carousel container ready`);
      break;
    }
    
    if (carouselStatusData.status_code === 'ERROR') {
      throw new Error(`Carousel container processing failed: ${carouselStatusData.status || 'Unknown error'}`);
    }
    
    carouselAttempts++;
    if (carouselAttempts < maxCarouselAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (carouselAttempts >= maxCarouselAttempts) {
    throw new Error('Carousel container processing timeout');
  }

  // Publish
  log(`🚀 Publishing carousel...`);
  const publishResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media_publish?creation_id=${carouselData.id}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const publishData = await publishResponse.json();

  // Check for API errors
  if (publishData.error) {
    throw new Error(`Failed to publish carousel: ${publishData.error.message} (code: ${publishData.error.code})`);
  }

  if (!publishData.id) {
    throw new Error('Carousel publication failed: Instagram API returned no post ID');
  }

  log(`✅ Carousel published! ID: ${publishData.id}`);
  return publishData.id;
}

async function publishReel(character, videoUrl, caption) {
  const config = CHARACTERS[character];
  const accessToken = process.env[config.instagram_token_env];
  const accountId = process.env[config.instagram_account_env];

  log(`📤 Publishing reel to Instagram (${config.name})...`);

  // Validate inputs
  if (!videoUrl) {
    throw new Error('Invalid videoUrl: must be provided');
  }

  // Create reel container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const containerData = await containerResponse.json();

  // Check for API errors
  if (containerData.error) {
    throw new Error(`Failed to create reel container: ${containerData.error.message} (code: ${containerData.error.code})`);
  }

  if (!containerData.id) {
    throw new Error('Reel container creation failed: no ID returned');
  }

  log(`  Container created: ${containerData.id}`);

  // Wait for video processing
  log(`  ⏳ Waiting for video processing...`);
  let status = 'IN_PROGRESS';
  let attempts = 0;
  while (status === 'IN_PROGRESS' && attempts < 30) {
    await new Promise(r => setTimeout(r, 5000));
    const statusResponse = await fetch(
      `https://graph.facebook.com/v21.0/${containerData.id}?fields=status_code&access_token=${accessToken}`
    );
    const statusData = await statusResponse.json();
    
    // Check for API errors when checking status
    if (statusData.error) {
      throw new Error(`Failed to check video processing status: ${statusData.error.message} (code: ${statusData.error.code})`);
    }
    
    status = statusData.status_code;
    process.stdout.write('.');
    attempts++;
  }
  console.log('');

  if (status !== 'FINISHED') {
    throw new Error(`Video processing failed: ${status}`);
  }
  log(`  ✅ Video processed`);

  // Publish
  const publishResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media_publish?creation_id=${containerData.id}&access_token=${accessToken}`,
    { method: 'POST' }
  );
  const publishData = await publishResponse.json();

  // Check for API errors
  if (publishData.error) {
    throw new Error(`Failed to publish reel: ${publishData.error.message} (code: ${publishData.error.code})`);
  }

  if (!publishData.id) {
    throw new Error('Reel publication failed: Instagram API returned no post ID');
  }

  log(`✅ Reel published! ID: ${publishData.id}`);
  return publishData.id;
}

// ===========================================
// EXPORTED FUNCTIONS FOR CRON-EXECUTOR V2
// ===========================================

/**
 * Generate images for a post (without publishing)
 * @param {Object} postParams - Post parameters from scheduler
 * @returns {Object} { imageUrls: string[], videoUrl?: string }
 */
export async function generateImagesForPost(postParams) {
  const character = postParams.character;
  const config = CHARACTERS[character];
  if (!config) {
    throw new Error(`Unknown character: ${character}`);
  }

  log('═'.repeat(60));
  log(`🎨 GENERATING IMAGES — ${character.toUpperCase()}`);
  log('═'.repeat(60));
  log(`📍 Location: ${postParams.location_name}`);
  log(`📸 Type: ${postParams.type} ${postParams.reel_type ? `(${postParams.reel_type})` : ''}`);

  const contentCount = postParams.type === 'reel' ? REEL_SIZE : CAROUSEL_SIZE;
  const setting = postParams.prompt_hints || postParams.location_name;

  const imageUrls = [];
  let firstImageBase64 = null;

  // Decide if image 3 should be a detail shot (30% chance for Elena carousels only)
  const useDetailShot = character === 'elena' && 
                        postParams.type !== 'reel' && 
                        Math.random() < 0.30;
  
  if (useDetailShot) {
    log(`\n📷 Detail shot mode: Image 3 will be environment-only (modern IG trend)`);
  }

  for (let i = 0; i < contentCount; i++) {
    log(`\n🎨 Generating image ${i + 1}/${contentCount}...`);

    // Image 3 can be a detail shot (environment only, no subject)
    if (i === 2 && useDetailShot) {
      const detailUrl = await generateDetailShot(postParams.location_name, firstImageBase64);
      if (detailUrl) {
        const cloudinaryUrl = await uploadToCloudinary(detailUrl, character, postParams.type, i);
        imageUrls.push(cloudinaryUrl);
        continue; // Skip to next iteration
      }
      // If detail shot fails, fall through to regular image generation
      log(`  ⚠️ Detail shot failed, generating regular image instead`);
    }

    // Framing variations for carousel diversity (real IG style)
    const framingVariations = [
      // Image 1: Hero shot - medium/full body, subject prominent but environment visible
      `${postParams.action}, FRAMING: medium shot showing full body, subject takes 60% of frame, room/environment clearly visible around her, not perfectly centered`,
      // Image 2: Different composition - close-up OR wide showing more environment
      `${postParams.action}, FRAMING: ${i === 1 ? 'CLOSE UP from shoulders up, face fills 70% of frame, shallow depth of field, intimate portrait feel' : 'wide shot showing more environment, subject positioned to one side using rule of thirds'}`,
      // Image 3: Candid/POV - unexpected angle, environment-focused
      `${postParams.action}, FRAMING: candid angle as if caught off-guard, show environment details (messy bed, phone visible, real room), slightly imperfect framing adds authenticity`,
    ];
    const action = framingVariations[i % framingVariations.length];

    const isReel = postParams.type === 'reel';
    const imageUrl = await generateImage(
      character,
      setting,
      postParams.outfit || 'stylish casual outfit appropriate for the setting',
      action,
      postParams.prompt_hints,
      i,
      postParams.location_name,
      i > 0 ? firstImageBase64 : null,
      isReel
    );

    const cloudinaryUrl = await uploadToCloudinary(imageUrl, character, postParams.type, i);
    imageUrls.push(cloudinaryUrl);

    if (i === 0) {
      firstImageBase64 = await urlToBase64(cloudinaryUrl);
      log(`  📌 Stored first image as reference for scene consistency`);
    }
  }

  log(`\n📸 ${contentCount} images generated`);

  // All reels use Kling animation now (no more photo slideshows)
  let videoUrl = null;
  if (postParams.type === 'reel') {
    log(`\n🎬 Creating Kling animated reel...`);
    videoUrl = await createReelVideo(imageUrls, character, postParams);
  }

  return { imageUrls, videoUrl };
}

/**
 * Publish a carousel to Instagram
 * @param {string} character - 'mila' or 'elena'
 * @param {string[]} imageUrls - Cloudinary URLs
 * @param {string} caption - Full caption with hashtags
 * @returns {string} Instagram post ID
 */
export async function publishCarouselToInstagram(character, imageUrls, caption) {
  return await publishCarousel(character, imageUrls, caption);
}

/**
 * Publish a reel to Instagram
 * @param {string} character - 'mila' or 'elena'
 * @param {string} videoUrl - Cloudinary video URL
 * @param {string} caption - Full caption with hashtags
 * @returns {string} Instagram post ID
 */
export async function publishReelToInstagram(character, videoUrl, caption) {
  return await publishReel(character, videoUrl, caption);
}

// ===========================================
// MAIN (for direct execution)
// ===========================================

async function main() {
  // Parse schedule from env
  const scheduleJson = process.env.SCHEDULED_POST;
  if (!scheduleJson) {
    console.error('❌ Missing SCHEDULED_POST environment variable');
    console.error('   Usage: SCHEDULED_POST=\'{"character":"mila",...}\' node scripts/scheduled-post.mjs');
    process.exit(1);
  }

  const post = JSON.parse(scheduleJson);
  const isTest = process.argv.includes('--test');

  log('═'.repeat(60));
  log(`🎯 SCHEDULED POST — ${post.character.toUpperCase()}`);
  log('═'.repeat(60));
  log(`📍 Location: ${post.location_name}`);
  log(`📸 Type: ${post.type} ${post.reel_type ? `(${post.reel_type})` : ''}`);
  log(`👗 Outfit: ${post.outfit?.substring(0, 50)}...`);
  log(`🎬 Action: ${post.action?.substring(0, 50)}...`);
  log(`💬 Caption: ${post.caption?.substring(0, 50)}...`);

  const character = post.character;
  const config = CHARACTERS[character];
  if (!config) {
    console.error(`❌ Unknown character: ${character}`);
    process.exit(1);
  }

  // Determine content count
  const contentCount = post.type === 'reel' ? REEL_SIZE : CAROUSEL_SIZE;

  // Build setting from location
  const setting = post.prompt_hints || post.location_name;

  // Generate images with scene consistency (first image used as reference for subsequent)
  const imageUrls = [];
  let firstImageBase64 = null; // Store first image for outfit/scene consistency
  
  for (let i = 0; i < contentCount; i++) {
    log(`\n🎨 Generating image ${i + 1}/${contentCount}...`);
    
    // Framing variations for carousel diversity (real IG style)
    const framingVariations = [
      // Image 1: Hero shot - medium/full body, subject prominent but environment visible
      `${post.action}, FRAMING: medium shot showing full body, subject takes 60% of frame, room/environment clearly visible around her, not perfectly centered`,
      // Image 2: Different composition - close-up OR wide showing more environment
      `${post.action}, FRAMING: ${i === 1 ? 'CLOSE UP from shoulders up, face fills 70% of frame, shallow depth of field, intimate portrait feel' : 'wide shot showing more environment, subject positioned to one side using rule of thirds'}`,
      // Image 3: Candid/POV - unexpected angle, environment-focused
      `${post.action}, FRAMING: candid angle as if caught off-guard, show environment details (messy bed, phone visible, real room), slightly imperfect framing adds authenticity`,
    ];
    const action = framingVariations[i % framingVariations.length];

    const imageUrl = await generateImage(
      character,
      setting,
      post.outfit || 'stylish casual outfit appropriate for the setting',
      action,
      post.prompt_hints,
      i,
      post.location_name,
      i > 0 ? firstImageBase64 : null // Pass first image as reference for images 2 and 3
    );

    // Upload to Cloudinary
    const cloudinaryUrl = await uploadToCloudinary(imageUrl, character, post.type, i);
    imageUrls.push(cloudinaryUrl);
    
    // Store first image as base64 for scene consistency
    if (i === 0) {
      firstImageBase64 = await urlToBase64(cloudinaryUrl);
      log(`  📌 Stored first image as reference for scene consistency`);
    }
  }

  log(`\n📸 ${contentCount} images ready`);

  // Build caption with hashtags
  let fullCaption = post.caption || 'Enjoying the moment ✨';
  if (post.hashtags && Array.isArray(post.hashtags)) {
    fullCaption += '\n\n' + post.hashtags.join(' ');
  } else {
    // Default hashtags
    const defaultHashtags = character === 'mila'
      ? '#lifestyle #fitness #paris #photography #travel'
      : '#fashion #luxurylifestyle #travel #model #paris';
    fullCaption += '\n\n' + defaultHashtags;
  }

  if (isTest) {
    log('\n🧪 TEST MODE — Not publishing to Instagram');
    log(`   Would publish: ${post.type}`);
    log(`   Images: ${imageUrls.join(', ')}`);
    log(`   Caption: ${fullCaption.substring(0, 100)}...`);
    return { success: true, test: true, imageUrls };
  }

  // Publish based on type
  let postId;
  if (post.type === 'reel') {
    // Create slideshow video and publish as reel
    const videoUrl = await createReelVideo(imageUrls, character);
    postId = await publishReel(character, videoUrl, fullCaption);
  } else {
    // Publish as carousel
    postId = await publishCarousel(character, imageUrls, fullCaption);
  }

  log('\n' + '═'.repeat(60));
  log(`✅ SUCCESS! Post ID: ${postId}`);
  log('═'.repeat(60));

  return {
    success: true,
    postId,
    character,
    type: post.type,
    imageUrls,
    caption: fullCaption,
  };
}

// Only run main() when executed directly (not when imported)
const isMainModule = process.argv[1]?.includes('scheduled-post.mjs');
if (isMainModule) {
  main().catch(err => {
    console.error('❌ ERROR:', err.message);
    process.exit(1);
  });
}

