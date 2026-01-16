#!/usr/bin/env node
/**
 * Elena Daily Fanvue Post
 * 
 * Generates one photo per day using safe-sexy prompts and posts to Fanvue
 * Designed for GitHub Actions at 17h Paris time
 * 
 * Usage:
 *   node scripts/daily-fanvue-elena.mjs              # Auto-select today's content
 *   node scripts/daily-fanvue-elena.mjs --day 5     # Force specific day (1-14)
 *   node scripts/daily-fanvue-elena.mjs --test      # Generate only, no Fanvue post
 */

import Replicate from 'replicate';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════
// ENV LOADING
// ═══════════════════════════════════════════════════════════════

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// Elena references
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

// Parse CLI args
const args = process.argv.slice(2);
const TEST_MODE = args.includes('--test');
const dayArg = args.find(a => a.startsWith('--day'));
const FORCED_DAY = dayArg ? parseInt(args[args.indexOf(dayArg) + 1] || args[args.indexOf('--day') + 1]) : null;

// ═══════════════════════════════════════════════════════════════
// CONTENT CALENDAR - SAFE SEXY STRATEGY
// Uses creative angles, body-focused shots, and filter-friendly vocabulary
// ═══════════════════════════════════════════════════════════════

// Reference instructions for consistency
const REFERENCE_INSTRUCTION = `Reference images provided:

**IMAGE 1 (FACE)**: Copy this face exactly - same features, same beauty mark on right cheekbone, same bronde hair with balayage.

**IMAGE 2 (BODY)**: Match this body type exactly - same feminine figure, same proportions.

CRITICAL: Generated image must look like the same person as references.`;

// ELENA BODY DESCRIPTION - Detailed (from Content Brain V2)
// Used for body shots where face is hidden
const ELENA_BODY_DETAILED = `24 year old Italian woman,
feminine shapely figure 172cm tall,
very large natural bust prominent and natural shape,
narrow defined waist creating hourglass silhouette,
wide feminine hips,
healthy fit Italian body with confident posture,
bronde hair dark roots with golden blonde balayage long beach waves,
gold chunky chain bracelet on left wrist,
layered gold necklaces with medallion pendant,
glowing sun-kissed Italian skin tone`;

// Base description (shorter version for prompts with face)
const ELENA_BASE = `24 year old Italian woman, warm approachable features,
bronde hair dark roots with golden blonde balayage long beach waves,
honey brown almond-shaped eyes, naturally thick eyebrows,
small beauty mark on right cheekbone,
gold chunky chain bracelet on left wrist,
layered gold necklaces with medallion pendant,
feminine shapely figure, Italian curves`;

const ELENA_FINAL_CHECK = `CRITICAL REQUIREMENTS:
- SINGLE IMAGE ONLY - NO collages, NO grids, NO multiple photos
- FACE CHECK: Face MUST be IDENTICAL to Image 1 - same person, same features
- Beauty mark on right cheekbone visible
- Hair: bronde with golden blonde balayage
- Body: match Image 2 proportions - shapely feminine figure
- Gold jewelry visible when applicable

NEGATIVE: different face, different person, angular face, skinny body, thin figure, low quality`;

// Safe-sexy expressions using approved vocabulary
const EXPRESSIONS = [
  'captivating warm gaze, soft confident smile, magnetic presence',
  'enchanting eyes with playful knowing smile, radiating charm',
  'alluring gaze, soft parted lips, sparkling feminine allure',
  'inviting warm expression, confident soft smile',
  'striking confident gaze, elegant charming presence',
];

// ═══════════════════════════════════════════════════════════════
// FANVUE OUTFITS - Only sexy/revealing options (NO regular clothes)
// Bikini, lingerie, leggings, bodysuits, etc.
// ═══════════════════════════════════════════════════════════════

const FANVUE_OUTFITS = {
  // Lingerie Sets - optimized safe vocabulary
  lace_bralette_black: 'elegant black lace bralette with matching brazilian briefs, delicate straps, luxury lingerie editorial',
  lace_bralette_white: 'white lace triangle bralette with matching cheeky lace briefs, bridal intimate apparel',
  satin_lingerie_burgundy: 'burgundy silk bralette with high-cut satin briefs, thin spaghetti straps, luxury intimate wear',
  mesh_bodysuit: 'black mesh bodysuit with lace panels, plunging V neckline, high-cut french legs, elegant lingerie',
  babydoll_pink: 'soft pink silk babydoll chemise, thin straps, flowing delicate fabric, romantic intimate apparel',
  
  // Corsets & Structure
  corset_black: 'black satin corset with boning, cinched waist, matching brazilian briefs, elegant bustier style',
  bustier_lace: 'black lace bustier with matching high-cut briefs, structured elegant lingerie editorial',
  
  // Bikinis - brazilian/cheeky cuts
  bikini_black: 'black string bikini, triangle top, brazilian cut cheeky bottoms, beach editorial photography',
  bikini_white: 'white bikini set, minimal triangle top, high-cut brazilian bottoms, summer glamour',
  bikini_red: 'red brazilian bikini, cheeky high-cut bottoms, halter top, poolside fashion editorial',
  monokini_black: 'black monokini with cut-outs, one-piece swimsuit showing curves, elegant beach style',
  
  // Athletic - showing curves
  sports_bra_leggings: 'cropped sports bra showing toned midriff, skin-tight high-waisted yoga leggings, athletic curves, fitness editorial',
  crop_top_leggings: 'tiny cropped athletic tank showing midriff, form-fitting leggings accentuating curves, gym aesthetic',
  
  // Bodysuits & Teddies
  bodysuit_lace: 'black lace bodysuit, deep plunge neckline, high-cut french legs, sophisticated lingerie',
  bodysuit_satin: 'nude champagne satin bodysuit, thin spaghetti straps, high-cut legs, second-skin fit, luxury',
  
  // Artistic / Minimal
  briefs_only: 'elegant black lace brazilian briefs only, bare back and shoulders visible, artistic portrait',
  cheeky_briefs: 'minimal cheeky lace briefs, artistic fine art portrait, elegant hands placement, fashion photography',
  silk_robe_open: 'silk robe falling off shoulders revealing lingerie underneath, elegant artistic, sophisticated style',
};

// 14-day calendar - SEXY FANVUE with varied angles
// Angles: high angle, bird's eye, low angle, side profile, POV, over-shoulder, from floor
// ALL shots: face NOT visible (cropped, turned away, hidden)
const DAILY_CALENDAR = [
  {
    day: 1, id: 'birds_eye_bed_lingerie', name: 'Morning View',
    caption: 'Good morning from Paris... 💋',
    setting: 'Elegant Parisian bedroom, white silk sheets, soft morning golden light from window',
    outfit: FANVUE_OUTFITS.lace_bralette_black,
    pose: 'BIRD\'S EYE VIEW shot from directly above, lying on bed on back, body in lingerie visible from neck down, one arm stretched above head (hiding face), back slightly arched, intimate morning moment. CRITICAL: Face NOT visible - arm covers face or cropped at neck',
    expression: 'face not visible - cropped or hidden by arm',
  },
  {
    day: 2, id: 'low_angle_mirror', name: 'Mirror Moment',
    caption: 'Just got out of the shower... 🚿✨',
    setting: 'Luxurious marble bathroom, large gold-framed mirror, soft warm lighting, steam visible',
    outfit: FANVUE_OUTFITS.lace_bralette_white + ', fresh dewy skin',
    pose: 'LOW ANGLE shot from floor level looking up at body in mirror reflection, lingerie visible, legs elongated, body from chin down visible in reflection. CRITICAL: Face cropped out - shot from chin down only',
    expression: 'face not visible - cropped below chin',
  },
  {
    day: 3, id: 'side_profile_sofa', name: 'Sofa Vibes',
    caption: 'Netflix and... 🍷',
    setting: 'Parisian loft with dusty rose velvet sofa, soft afternoon light, wine glass visible',
    outfit: FANVUE_OUTFITS.bodysuit_lace,
    pose: 'SIDE PROFILE shot, lying on sofa on her side, S-curve body position, top leg bent forward, bodysuit visible, silhouette showing curves. CRITICAL: Face turned away from camera or hidden in cushion',
    expression: 'face not visible - turned away',
  },
  {
    day: 4, id: 'back_walking_away', name: 'Walking Away',
    caption: 'Getting ready for something special... 💄',
    setting: 'Elegant Parisian apartment hallway, soft warm lighting, wooden floor',
    outfit: FANVUE_OUTFITS.briefs_only + ', bare back and shoulders visible',
    pose: 'BACK SHOT from behind, walking away from camera down hallway, full back visible, hair flowing down, brazilian briefs visible, feminine silhouette. CRITICAL: Face NOT visible - shot from behind only',
    expression: 'face not visible - back to camera',
  },
  {
    day: 5, id: 'high_angle_yoga', name: 'Yoga Time',
    caption: 'Flexibility is key 🧘‍♀️',
    setting: 'Minimalist yoga corner, black mat on light wood floor, plants, natural light',
    outfit: FANVUE_OUTFITS.sports_bra_leggings,
    pose: 'HIGH ANGLE shot from above, downward dog yoga pose, back arched, athletic body visible, leggings accentuating figure. CRITICAL: Face hidden - looking down at mat',
    expression: 'face not visible - looking down',
  },
  {
    day: 6, id: 'pool_bikini_back', name: 'Pool Day',
    caption: 'Summer vibes ☀️',
    setting: 'Luxury infinity pool, turquoise water, golden sunset light',
    outfit: FANVUE_OUTFITS.bikini_red + ', wet skin glistening',
    pose: 'BACK SHOT standing at pool edge, looking out at horizon, full back and brazilian bikini bottoms visible, water droplets on skin, sunset silhouette. CRITICAL: Face NOT visible - looking away at sunset',
    expression: 'face not visible - looking at horizon',
  },
  {
    day: 7, id: 'pov_looking_down_body', name: 'Self-Care Sunday',
    caption: 'Sunday self-care 🛁',
    setting: 'Luxury bathroom, soft lighting, elegant atmosphere',
    outfit: FANVUE_OUTFITS.lace_bralette_white,
    pose: 'POV SHOT looking down at own body, chest and stomach visible in lingerie, hands visible adjusting bralette strap, intimate first-person perspective. CRITICAL: Face NOT in frame - POV shot',
    expression: 'face not visible - POV shot',
  },
  {
    day: 8, id: 'bed_stomach_arched', name: 'Bedroom Confidence',
    caption: 'Feeling myself today 💋',
    setting: 'Elegant bedroom, white silk sheets, soft golden morning light',
    outfit: FANVUE_OUTFITS.cheeky_briefs + ', bare back',
    pose: 'Lying on bed ON STOMACH, back arched elegantly, legs bent up behind playfully, cheeky briefs visible, hair spread on pillow, hands gripping sheets. CRITICAL: Face buried in pillow or turned away - only back and body visible',
    expression: 'face not visible - hidden in pillow',
  },
  {
    day: 9, id: 'floor_angle_standing', name: 'Towering',
    caption: 'Just this and nothing else 😏',
    setting: 'Parisian loft, tall French windows, soft morning light streaming in',
    outfit: FANVUE_OUTFITS.bodysuit_satin,
    pose: 'LOW ANGLE from floor looking up, standing figure, legs elongated, bodysuit visible, powerful feminine stance, body from below chin. CRITICAL: Face cropped out - shot ends below chin',
    expression: 'face not visible - cropped below chin',
  },
  {
    day: 10, id: 'over_shoulder_mirror', name: 'Mirror Check',
    caption: 'That after workout feeling 💪✨',
    setting: 'Home gym area, large mirror, natural light',
    outfit: FANVUE_OUTFITS.crop_top_leggings,
    pose: 'OVER SHOULDER shot, back to camera, looking at mirror reflection, athletic body visible, leggings accentuating figure, mirror shows body from neck down. CRITICAL: Face NOT visible - back of head only, reflection blurred or cropped',
    expression: 'face not visible - back of head',
  },
  {
    day: 11, id: 'three_quarter_bed', name: 'Evening Lingerie',
    caption: 'Ready for tonight... or staying in? 🖤',
    setting: 'Bedroom with soft evening lamp lighting, silk sheets',
    outfit: FANVUE_OUTFITS.corset_black,
    pose: '3/4 VIEW sitting on bed edge, body turned 45 degrees, corset visible, one leg extended, silhouette showing waist, hands on thighs. CRITICAL: Face turned away from camera or cropped',
    expression: 'face not visible - turned away',
  },
  {
    day: 12, id: 'aerial_sheets_artistic', name: 'Lazy Day',
    caption: 'Some days you just stay in bed 😴💕',
    setting: 'Luxurious bedroom, cream silk sheets, soft daylight',
    outfit: FANVUE_OUTFITS.satin_lingerie_burgundy,
    pose: 'AERIAL/BIRD\'S EYE VIEW from above, lying on back on silk sheets, body visible in lingerie, sheet draped across hips, one arm above head covering face, artistic intimate composition. CRITICAL: Face hidden by arm',
    expression: 'face not visible - covered by arm',
  },
  {
    day: 13, id: 'towel_drop_back', name: 'Fresh Out',
    caption: 'That fresh feeling ✨🚿',
    setting: 'Luxurious marble bathroom, soft warm lighting, steam in air',
    outfit: 'small white towel held at front, entire bare back visible, wet hair',
    pose: 'BACK SHOT walking towards shower, towel covering front only, entire bare back visible from shoulders to lower back, wet hair cascading down, steam atmosphere. CRITICAL: Face NOT visible - walking away',
    expression: 'face not visible - back to camera',
  },
  {
    day: 14, id: 'hands_covering_artistic', name: 'Satin Dreams',
    caption: 'Ending the day right 🌙',
    setting: 'Bedroom with soft lamp lighting, silk sheets, intimate atmosphere',
    outfit: FANVUE_OUTFITS.cheeky_briefs + ' only, hands covering chest',
    pose: 'FRONT VIEW lying on bed, from NECK DOWN only, hands elegantly covering chest area, briefs visible, stomach and hips visible, silk sheets around, artistic intimate shot. CRITICAL: Face NOT in frame - cropped at neck',
    expression: 'face not visible - cropped at neck',
  },
];

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`;
}

function getTodaysContent() {
  if (FORCED_DAY && FORCED_DAY >= 1 && FORCED_DAY <= 14) {
    return DAILY_CALENDAR.find(c => c.day === FORCED_DAY);
  }
  
  const startDate = new Date('2024-12-30');
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const dayIndex = daysDiff % DAILY_CALENDAR.length;
  return DAILY_CALENDAR[dayIndex];
}

function buildPrompt(content) {
  // Check if this is a body-only shot (no face visible)
  const isBodyShot = content.expression.includes('not visible') || content.expression.includes('face not');
  
  if (isBodyShot) {
    // Body shot - no refs (filter blocks refs + lingerie)
    // Use DETAILED body description from Content Brain V2
    return `SUBJECT: Elena, ${ELENA_BODY_DETAILED},

SETTING: ${content.setting}

OUTFIT: ${content.outfit}

COMPOSITION: ${content.pose}

FACE INSTRUCTION: Face is NOT visible in this shot. Either cropped out, turned away, hidden by arm/pillow, or back to camera.

STYLE: luxury fashion photography, intimate apparel editorial, premium Fanvue content, warm golden lighting, magazine quality, high-end lingerie campaign, Vogue editorial aesthetic
${content.pose.includes('POV') ? 'PERSPECTIVE: First-person POV shot looking down at own body.' : ''}

QUALITY: 8K resolution, professional studio quality, sharp focus, natural skin texture, realistic body

NEGATIVE: face visible, head visible, skinny, thin, flat chest, angular, low quality, blurry, amateur, different body type, small bust`;
  }
  
  // Face visible shot - with reference matching
  return `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, ${ELENA_BASE},

SETTING: ${content.setting}

OUTFIT: ${content.outfit}

COMPOSITION: ${content.pose}

EXPRESSION: ${content.expression}

STYLE: luxury fashion photography, intimate apparel editorial, premium lifestyle content, warm golden lighting, magazine quality, high-end lingerie campaign

${ELENA_FINAL_CHECK}`;
}

// ═══════════════════════════════════════════════════════════════
// CLOUDINARY UPLOAD
// ═══════════════════════════════════════════════════════════════

async function uploadToCloudinary(imageDataUrl, photoId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Missing Cloudinary credentials');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'elena-fanvue-daily';
  const publicId = `${photoId}-${timestamp}`;
  
  const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash('sha1').update(signatureString).digest('hex');

  const formData = new FormData();
  formData.append('file', imageDataUrl);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

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

async function generateImage(replicate, prompt, base64Images) {
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

// ═══════════════════════════════════════════════════════════════
// FANVUE API
// ═══════════════════════════════════════════════════════════════

const FANVUE_AUTH_URL = 'https://auth.fanvue.com';
const FANVUE_API_URL = 'https://api.fanvue.com';

async function refreshFanvueToken(refreshToken) {
  const clientId = process.env.FANVUE_CLIENT_ID;
  const clientSecret = process.env.FANVUE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing Fanvue OAuth credentials');
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${FANVUE_AUTH_URL}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fanvue token refresh failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

async function uploadMediaToFanvue(accessToken, imageUrl) {
  log('   📤 Step 1: Creating upload session...');
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Fanvue-API-Version': '2025-06-26',
  };
  
  // Step 1: Create upload session
  const sessionResponse = await fetch(`${FANVUE_API_URL}/media/uploads`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Elena Daily Post',
      filename: 'elena-post.jpg',
      mediaType: 'image',
    }),
  });
  
  if (!sessionResponse.ok) {
    const error = await sessionResponse.text();
    throw new Error(`Failed to create upload session: ${error}`);
  }
  
  const { mediaUuid, uploadId } = await sessionResponse.json();
  log(`   ✅ Upload session created: ${mediaUuid}`);
  
  // Step 2: Get signed URL for upload
  log('   📤 Step 2: Getting signed upload URL...');
  const urlResponse = await fetch(`${FANVUE_API_URL}/media/uploads/${uploadId}/parts/1/url`, {
    headers,
  });
  
  if (!urlResponse.ok) {
    const error = await urlResponse.text();
    throw new Error(`Failed to get upload URL: ${error}`);
  }
  
  // Response might be plain text URL or JSON - handle both
  const urlText = await urlResponse.text();
  let signedUrl;
  try {
    const urlJson = JSON.parse(urlText);
    signedUrl = urlJson.url || urlJson.signedUrl || urlText;
  } catch {
    signedUrl = urlText; // Plain URL response
  }
  log('   ✅ Got signed URL');
  
  // Step 3: Download image from Cloudinary and upload to Fanvue
  log('   📤 Step 3: Uploading image to Fanvue...');
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();
  
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    body: imageBuffer,
    headers: {
      'Content-Type': 'image/jpeg',
    },
  });
  
  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload image: ${uploadResponse.status}`);
  }
  
  const etag = uploadResponse.headers.get('ETag');
  log(`   ✅ Image uploaded, ETag: ${etag}`);
  
  // Step 4: Complete upload session
  log('   📤 Step 4: Completing upload session...');
  const completeResponse = await fetch(`${FANVUE_API_URL}/media/uploads/${uploadId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      parts: [{ PartNumber: 1, ETag: etag?.replace(/"/g, '') || '' }],
    }),
  });
  
  if (!completeResponse.ok) {
    const error = await completeResponse.text();
    throw new Error(`Failed to complete upload: ${error}`);
  }
  
  log('   ✅ Upload completed');
  return mediaUuid;
}

async function postToFanvue(accessToken, content, imageUrl) {
  log('📤 Posting to Fanvue (subscribers only)...');
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Fanvue-API-Version': '2025-06-26',
  };
  
  // First, upload the media to Fanvue's servers
  const mediaUuid = await uploadMediaToFanvue(accessToken, imageUrl);
  
  // Then create the post with the uploaded media UUID
  log('   📤 Step 5: Creating post...');
  const postBody = {
    text: content.caption,
    mediaUuids: [mediaUuid],
    audience: 'subscribers',
  };
  log(`   Request body: ${JSON.stringify(postBody)}`);
  
  const response = await fetch(`${FANVUE_API_URL}/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(postBody),
  });

  if (!response.ok) {
    const error = await response.text();
    const errorObj = { status: response.status, message: error };
    throw errorObj;
  }

  return response.json();
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

// Helper to check if shot needs face reference
function needsFaceReference(content) {
  const expr = (content.expression || '').toLowerCase();
  const pose = (content.pose || '').toLowerCase();
  const combined = expr + ' ' + pose;
  
  // Body shots, detail shots, POV shots, silhouettes - no face ref (filters block it)
  const noFaceKeywords = ['not visible', 'face not', 'body shot', 'body focus', 'pov shot', 
    'detail shot', 'silhouette', 'face in shadow', 'cropped out', 'from behind', 'back shot'];
  
  return !noFaceKeywords.some(kw => combined.includes(kw));
}

async function main() {
  log('═══════════════════════════════════════════════════════════════');
  log('🌟 ELENA DAILY FANVUE POST');
  log('═══════════════════════════════════════════════════════════════');
  
  if (TEST_MODE) {
    log('⚠️  TEST MODE: Will generate but NOT post to Fanvue');
  }

  // Get today's content
  const content = getTodaysContent();
  if (!content) {
    throw new Error('No content found for today');
  }
  
  log(`\n📅 Day ${content.day}: ${content.name}`);
  log(`   Caption: ${content.caption}`);
  
  const useReferences = needsFaceReference(content);
  log(`   Shot type: ${useReferences ? 'Face visible (with refs)' : 'Body shot (no refs - filter limitation)'}`);

  // Initialize Replicate
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  // Load reference images only for face shots (body shots + refs = filter block)
  let base64Refs = null;
  if (useReferences) {
    log('\n📸 Loading reference images...');
    base64Refs = await Promise.all([
      urlToBase64(ELENA_FACE_REF),
      urlToBase64(ELENA_BODY_REF),
    ]);
    log('   ✅ References loaded');
  } else {
    log('\n📸 Skipping refs for body shot (filter limitation)');
  }

  // Generate image
  log('\n🎨 Generating image with Nano Banana Pro...');
  const prompt = buildPrompt(content);
  log(`   Prompt preview: ${prompt.substring(0, 150)}...`);
  const imageData = await generateImage(replicate, prompt, base64Refs);
  log('   ✅ Image generated');

  // Upload to Cloudinary
  log('\n☁️  Uploading to Cloudinary...');
  const cloudinaryUrl = await uploadToCloudinary(imageData, content.id);
  log(`   ✅ Uploaded: ${cloudinaryUrl}`);

  // Post to Fanvue (unless test mode)
  if (!TEST_MODE) {
    const accessToken = process.env.FANVUE_ACCESS_TOKEN;
    const refreshToken = process.env.FANVUE_REFRESH_TOKEN;
    
    if (!accessToken || !refreshToken) {
      log('\n⚠️  No Fanvue tokens found. Skipping Fanvue post.');
      log('   Set FANVUE_ACCESS_TOKEN and FANVUE_REFRESH_TOKEN to enable posting.');
    } else {
      try {
        // Try with current token first
        await postToFanvue(accessToken, content, cloudinaryUrl);
        log('   ✅ Posted to Fanvue (subscribers only)!');
      } catch (error) {
        // Check if error is authentication-related (401 Unauthorized)
        const isAuthError = error.status === 401 || (error.message && error.message.includes('401'));
        
        if (!isAuthError) {
          // Not an auth error, rethrow
          throw error;
        }
        
        // Auth error, try refreshing token
        log('   🔄 Access token expired, refreshing...');
        try {
          const newTokens = await refreshFanvueToken(refreshToken);
          await postToFanvue(newTokens.accessToken, content, cloudinaryUrl);
          log('   ✅ Posted to Fanvue (subscribers only, with refreshed token)');
          log(`   ⚠️  IMPORTANT: Update GitHub Secrets with new refresh token:`);
          log(`      FANVUE_REFRESH_TOKEN=${newTokens.refreshToken}`);
          log(`      (Current token in secrets is now invalid)`);
        } catch (refreshError) {
          // Check if refresh token is invalid
          const errorMsg = refreshError.message || '';
          if (errorMsg.includes('invalid_grant') || errorMsg.includes('already used')) {
            log('\n   ❌ Refresh token is invalid or expired!');
            log('   📋 To fix this:');
            log('      1. Visit: https://ig-influencer.vercel.app/api/oauth/auth');
            log('      2. Authorize Fanvue');
            log('      3. Copy the new FANVUE_ACCESS_TOKEN and FANVUE_REFRESH_TOKEN');
            log('      4. Update GitHub Secrets with the new tokens');
            throw new Error('Refresh token invalid. Please obtain new tokens via OAuth flow.');
          }
          throw refreshError;
        }
      }
    }
  }

  // Summary
  log('\n═══════════════════════════════════════════════════════════════');
  log('🎉 SUCCESS!');
  log('═══════════════════════════════════════════════════════════════');
  log(`\n📸 ${content.name}`);
  log(`   Day: ${content.day}/14`);
  log(`   Caption: ${content.caption}`);
  log(`   Image: ${cloudinaryUrl}`);
  if (TEST_MODE) {
    log(`\n⚠️  TEST MODE: Image was NOT posted to Fanvue`);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});

