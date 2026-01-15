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

// Simplified reference - focus on consistency, not explicit descriptions
const REFERENCE_INSTRUCTION = `You are provided with reference images. Match the subject EXACTLY:
- Same face shape, features, and beauty mark on right cheekbone
- Same bronde hair with golden blonde balayage highlights
- Same body proportions and feminine figure
- Same gold jewelry (chain bracelet, layered necklaces)`;

// Safe vocabulary - no explicit body descriptions
const ELENA_BASE = `24 year old Italian woman, warm approachable features,
bronde hair dark roots with golden blonde balayage long beach waves,
honey brown almond-shaped eyes, naturally thick eyebrows,
small beauty mark on right cheekbone,
gold chunky chain bracelet on left wrist,
layered gold necklaces with medallion pendant,
feminine shapely figure, Italian curves`;

const ELENA_FINAL_CHECK = `CRITICAL REQUIREMENTS:
- SINGLE IMAGE ONLY - NO collages, NO grids, NO multiple photos
- Match reference face and body exactly
- Beauty mark on right cheekbone visible when face shown
- Gold jewelry visible when applicable`;

// Safe-sexy expressions using approved vocabulary
const EXPRESSIONS = [
  'captivating warm gaze, soft confident smile, magnetic presence',
  'enchanting eyes with playful knowing smile, radiating charm',
  'alluring gaze, soft parted lips, sparkling feminine allure',
  'inviting warm expression, confident soft smile',
  'striking confident gaze, elegant charming presence',
];

// 14-day calendar with CREATIVE ANGLES and SAFE SEXY approach
// Key strategies: high-angle selfies, body without head, over-shoulder, from above
const DAILY_CALENDAR = [
  {
    day: 1, id: 'morning_selfie_above', name: 'Morning From Above',
    caption: 'Good morning from Paris... barely awake 💋',
    setting: 'Elegant Parisian bedroom, crisp white linen sheets, soft morning golden light',
    outfit: 'oversized white t-shirt as sleepwear, hair messy on pillow',
    pose: 'HIGH ANGLE SELFIE from above looking down at her lying in bed, phone held above face, soft morning light illuminating her face and pillow, intimate morning moment',
    expression: EXPRESSIONS[0],
  },
  {
    day: 2, id: 'mirror_body_crop', name: 'Mirror Moment',
    caption: 'Just got out of the shower... 🚿✨',
    setting: 'Luxurious marble bathroom, large gold-framed mirror, soft warm lighting, steam visible',
    outfit: 'white fluffy bathrobe loosely tied, hair wrapped in towel turban, fresh dewy skin',
    pose: 'BODY-FOCUSED mirror selfie cropped from neck down, robe slightly open showing collarbone, phone visible in mirror, bathroom mirror reflection',
    expression: 'face not visible - body shot only',
  },
  {
    day: 3, id: 'sofa_legs_closeup', name: 'Sofa Vibes',
    caption: 'Netflix and... 🍷',
    setting: 'Parisian loft with dusty rose velvet sofa, herringbone floor, soft afternoon light, wine glass on side table',
    outfit: 'cozy oversized cream knit sweater, bare legs visible',
    pose: 'LEGS AND LOWER BODY FOCUS shot from her POV looking down at her legs stretched on sofa, sweater covering torso, wine glass in hand, cozy intimate moment',
    expression: 'face not visible - POV leg shot',
  },
  {
    day: 4, id: 'vanity_over_shoulder', name: 'Getting Ready',
    caption: 'Getting ready for something special tonight... 💄',
    setting: 'Elegant vanity area with Hollywood mirror lights, makeup scattered on marble',
    outfit: 'silk champagne robe, hair being styled, elegant earrings visible',
    pose: 'OVER SHOULDER shot FROM BEHIND, back and bare shoulder visible, blurred mirror reflection in background, focus on shoulder and hair, getting ready moment',
    expression: 'face not visible - back/shoulder focus',
  },
  {
    day: 5, id: 'yoga_from_above', name: 'Yoga Time',
    caption: 'Flexibility is key 🧘‍♀️',
    setting: 'Minimalist yoga corner, black mat on light wood floor, plants, natural light',
    outfit: 'black fitted athletic wear, sports top and high-waisted leggings',
    pose: 'HIGH ANGLE shot from above showing her in yoga pose on mat, body stretched elegantly, artistic top-down composition, fitness aesthetic',
    expression: EXPRESSIONS[4],
  },
  {
    day: 6, id: 'balcony_silhouette', name: 'Golden Hour',
    caption: 'Paris sunsets hit different ✨',
    setting: 'Private Parisian balcony, wrought iron railing, golden sunset backlight, Paris rooftops distant',
    outfit: 'flowy summer dress silhouette, barefoot',
    pose: 'BACKLIT SILHOUETTE standing at balcony, body outline against sunset, looking out at Paris, hair catching golden light, romantic atmospheric shot',
    expression: 'face in shadow - silhouette focus',
  },
  {
    day: 7, id: 'bath_shoulders_up', name: 'Self-Care Sunday',
    caption: 'Sunday self-care ritual 🛁🕯️',
    setting: 'Luxurious bathtub with bubbles, candles lit around, eucalyptus hanging, steam rising',
    outfit: 'hair up in messy bun, shoulders and collarbone above bubbles, gold necklaces visible, dewy skin',
    pose: 'SHOULDERS AND FACE selfie from above, relaxing in bubble bath, bubbles covering everything below collarbone, peaceful spa moment, candles glowing',
    expression: 'eyes closed blissfully with soft content smile, complete relaxation',
  },
  {
    day: 8, id: 'bed_pov_looking_down', name: 'Bedroom Confidence',
    caption: 'Feeling myself today 💋',
    setting: 'Elegant bedroom, white linen sheets, soft golden morning light',
    outfit: 'black fitted loungewear set, comfortable elegant',
    pose: 'POV SHOT looking down at her body lying on bed, sheets draped artistically, her hands visible adjusting clothing, intimate first-person perspective',
    expression: 'face not visible - body POV shot',
  },
  {
    day: 9, id: 'sweater_shoulder_closeup', name: 'Cozy Morning',
    caption: 'Boyfriend sweater but no boyfriend needed 😏',
    setting: 'Parisian loft, tall French windows, soft morning light streaming in',
    outfit: 'luxurious oversized cream cable-knit sweater, falling off one shoulder',
    pose: 'EXTREME CLOSE-UP DETAIL SHOT of bare shoulder and collarbone, sweater fabric falling off, gold necklaces catching morning light, skin texture visible, intimate cropped composition',
    expression: 'face not visible - shoulder/collarbone detail shot',
  },
  {
    day: 10, id: 'workout_mirror_body', name: 'Post-Workout Glow',
    caption: 'That after workout feeling 💪✨',
    setting: 'Home gym area, large mirror, yoga mat, water bottle, natural light',
    outfit: 'black athletic set, sports top and leggings, slight glow on skin, hair in ponytail',
    pose: 'MIRROR SELFIE body shot from chest down, one hand on hip, towel around neck, proud athletic stance, gym mirror reflection, fitness influencer style',
    expression: 'face cropped out - body focus',
  },
  {
    day: 11, id: 'dress_strap_detail', name: 'Evening Ready',
    caption: 'Ready for tonight... or staying in? 🖤',
    setting: 'Bedroom with soft evening lamp lighting, elegant atmosphere',
    outfit: 'elegant black slip dress, thin straps, delicate fabric',
    pose: 'DETAIL SHOT of hand adjusting thin dress strap on shoulder, collarbone and neck visible, gold jewelry catching light, getting ready moment, artistic close-up',
    expression: 'face not visible - detail shot',
  },
  {
    day: 12, id: 'bed_feet_playful', name: 'Lazy Day',
    caption: 'Some days you just stay in bed 😴💕',
    setting: 'Luxurious bedroom, messy white bedding, soft daylight through curtains',
    outfit: 'cozy oversized shirt, bare legs under sheets',
    pose: 'POV SHOT from her perspective lying in bed, looking at her feet playfully kicked up at end of bed, white sheets, lazy Sunday morning vibes',
    expression: 'face not visible - POV feet shot',
  },
  {
    day: 13, id: 'towel_back_shot', name: 'Fresh Out',
    caption: 'That fresh feeling ✨🚿',
    setting: 'Luxurious marble bathroom, soft warm lighting, steam in air',
    outfit: 'wrapped in large white fluffy towel from behind, wet hair cascading down back',
    pose: 'BACK SHOT walking away from camera, wrapped in white towel, wet dark hair with blonde highlights falling down back, steam atmosphere, elegant marble bathroom, figure disappearing into steam',
    expression: 'face not visible - back shot walking away',
  },
  {
    day: 14, id: 'hands_jewelry_detail', name: 'Satin Dreams',
    caption: 'Ending the day right 🌙',
    setting: 'Bedroom with soft evening lamp lighting, warm intimate atmosphere, silk sheets',
    outfit: 'elegant ivory satin sleepwear, delicate fabric',
    pose: 'ARTISTIC DETAIL SHOT of her hands on silk sheets, gold bracelet and rings visible, soft fabric texture, intimate nighttime moment, jewelry catching lamplight',
    expression: 'face not visible - hands/jewelry detail',
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
  // Check if this is a body-only shot (no face)
  const isBodyShot = content.expression.includes('not visible') || content.expression.includes('face not');
  
  // Build prompt based on shot type
  if (isBodyShot) {
    // Body-focused shots don't need face reference instructions
    return `SUBJECT: Young Italian woman, ${ELENA_BASE},

SETTING: ${content.setting}

OUTFIT: ${content.outfit}

COMPOSITION: ${content.pose}

STYLE: lifestyle influencer photography, premium content, warm intimate lighting, magazine quality, aspirational aesthetic

IMPORTANT: This is a creative artistic shot - follow the composition exactly as described. ${content.pose.includes('POV') ? 'First-person perspective shot.' : ''}`;
  }
  
  // For shots with face visible, include reference
  return `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, ${ELENA_BASE},

SETTING: ${content.setting}

OUTFIT: ${content.outfit}

COMPOSITION: ${content.pose}

EXPRESSION: ${content.expression}

STYLE: lifestyle influencer photography, premium content, warm intimate lighting, magazine quality, aspirational aesthetic

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

async function postToFanvue(accessToken, content, imageUrl) {
  log('📤 Posting to Fanvue (subscribers only)...');
  
  // Fanvue API uses 'text' and 'media' (not 'content' and 'media_urls')
  const postBody = {
    text: content.caption,
    media: [imageUrl],
    audience: 'subscribers',
  };
  log(`   Request body: ${JSON.stringify(postBody)}`);
  
  const response = await fetch(`${FANVUE_API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
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
  
  // Body shots, detail shots, POV shots, silhouettes don't need references
  const noFaceKeywords = [
    'not visible', 'face not', 'body shot', 'body focus', 'pov shot', 
    'detail shot', 'silhouette', 'face in shadow', 'cropped out',
    'from behind', 'back shot', 'legs and lower'
  ];
  
  const combined = expr + ' ' + pose;
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
  log(`   Shot type: ${useReferences ? 'Face visible (with references)' : 'Body/detail shot (no references)'}`);

  // Initialize Replicate
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  // Load reference images only if needed
  let base64Refs = null;
  if (useReferences) {
    log('\n📸 Loading reference images...');
    base64Refs = await Promise.all([
      urlToBase64(ELENA_FACE_REF),
      urlToBase64(ELENA_BODY_REF),
    ]);
    log('   ✅ References loaded');
  } else {
    log('\n📸 Skipping references (body/detail shot)');
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

