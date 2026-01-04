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
// CONTENT CALENDAR (inline for script portability)
// ═══════════════════════════════════════════════════════════════

const REFERENCE_INSTRUCTION = `You are provided with reference images in order:

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same smooth feminine jawline and rounded chin
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
- Same bronde hair with VISIBLE golden blonde balayage highlights
- Same naturally thick well-groomed eyebrows

**IMAGE 2 (BODY REFERENCE)**: This is Elena's body. Match these proportions EXACTLY:
- Same feminine shapely figure (NOT skinny, NOT thin)
- Same very large natural F-cup breasts (prominent, NOT reduced)
- Same narrow defined waist
- Same wide feminine hips

CRITICAL: Face MUST be identical to Image 1. Body proportions MUST match Image 2.`;

const ELENA_BASE = `soft round pleasant face NOT angular, warm approachable features,
bronde hair dark roots with golden blonde balayage long beach waves,
honey brown warm almond-shaped eyes, naturally thick eyebrows,
small beauty mark on right cheekbone (SIGNATURE),
gold chunky chain bracelet on left wrist ALWAYS visible,
layered gold necklaces with medallion pendant,
feminine shapely figure 172cm, very large natural F-cup breasts,
narrow defined waist, wide feminine hips`;

const ELENA_FINAL_CHECK = `FINAL CHECK - MUST MATCH REFERENCES:
- SINGLE IMAGE ONLY - NO collages, NO grids, NO patchwork, NO multiple photos combined
- Face: IDENTICAL to Image 1 (soft round face, NOT angular)
- Body: IDENTICAL to Image 2 (shapely with large bust visible)
- Hair: bronde with VISIBLE golden blonde balayage
- Beauty mark: on right cheekbone MUST be visible
- Jewelry: gold bracelet, layered gold necklaces`;

// Safe-sexy expressions
const EXPRESSIONS = [
  'captivating warm gaze directly at camera, soft confident smile, magnetic feminine presence',
  'enchanting eyes with playful knowing smile, radiating warmth and charm',
  'alluring gaze with soft parted lips, eyes sparkling with feminine allure',
  'inviting warm expression, confident soft smile, eyes full of warmth',
  'striking confident gaze, elegant smile, charming captivating presence',
];

// 14-day calendar
const DAILY_CALENDAR = [
  {
    day: 1, id: 'morning_bed_stretch', name: 'Morning Stretch',
    caption: 'Good morning from Paris... barely awake 💋',
    setting: 'Elegant Parisian apartment bedroom, king bed with crisp white linen sheets and cream pillows, soft morning golden light through sheer curtains, warm intimate atmosphere',
    outfit: 'delicate black silk camisole top with thin straps and matching soft shorts, barefoot',
    pose: 'lounging elegantly on bed, propped on elbow, legs naturally positioned, hair flowing on pillows',
    expression: EXPRESSIONS[0],
  },
  {
    day: 2, id: 'bathroom_mirror_selfie', name: 'Mirror Moment',
    caption: 'Just got out of the shower... 🚿✨',
    setting: 'Luxurious marble bathroom, large ornate gold-framed mirror, soft warm lighting, steam from shower visible, spa-like intimate setting',
    outfit: 'luxurious oversized cream knit sweater falling off one shoulder, black brief bottoms, hair slightly damp, fresh glowing skin',
    pose: 'taking mirror selfie with phone, body slightly angled to show curves, natural candid moment',
    expression: EXPRESSIONS[1],
  },
  {
    day: 3, id: 'sofa_evening', name: 'Sofa Vibes',
    caption: 'Netflix and... 🍷',
    setting: 'Bright Parisian loft with dusty rose velvet sofa, herringbone parquet floor, tall French windows, soft afternoon light, cozy intimate space',
    outfit: 'elegant cream silk slip dress with lace trim, thin straps, mid-thigh length, barefoot',
    pose: 'lying on sofa, one arm above head, body curved gracefully, relaxed confident pose',
    expression: EXPRESSIONS[2],
  },
  {
    day: 4, id: 'vanity_getting_ready', name: 'Getting Ready',
    caption: 'Getting ready for something special tonight... 💄',
    setting: 'Elegant vanity area with Hollywood mirror lights, makeup scattered on marble top, getting ready intimate moment',
    outfit: 'delicate lace-trimmed ivory satin camisole and matching tap shorts, barefoot',
    pose: 'sitting at vanity applying lipstick, mirror reflection visible, intimate getting ready moment',
    expression: EXPRESSIONS[3],
  },
  {
    day: 5, id: 'yoga_flexibility', name: 'Yoga Time',
    caption: 'Flexibility is key 🧘‍♀️',
    setting: 'Minimalist home yoga corner, black yoga mat on light wood floor, large mirror, soft natural light, peaceful wellness space',
    outfit: 'fitted black athletic crop top showing midriff and matching high-cut athletic briefs',
    pose: 'stretching on yoga mat, impressive flexibility displayed, athletic feminine strength',
    expression: EXPRESSIONS[4],
  },
  {
    day: 6, id: 'balcony_golden_hour', name: 'Golden Hour',
    caption: 'Paris sunsets hit different ✨',
    setting: 'Private Parisian balcony with wrought iron railing, golden hour sunset light, Paris rooftops in background, warm romantic atmosphere',
    outfit: 'soft fitted ribbed tank top in nude tone and matching brief-style loungewear bottoms',
    pose: 'standing by window, one hand touching hair, soft backlight creating silhouette, looking over shoulder',
    expression: EXPRESSIONS[0],
  },
  {
    day: 7, id: 'bath_self_care', name: 'Self-Care Sunday',
    caption: 'Sunday self-care ritual 🛁🕯️',
    setting: 'Luxurious deep soaking tub filled with bubbles, candles lit around, eucalyptus hanging, steam rising, self-care sanctuary',
    outfit: 'hair up in messy bun, shoulders and collarbone visible above bubbles, gold necklaces visible, natural dewy skin',
    pose: 'relaxing in bubble bath, head tilted back slightly, one arm resting on tub edge, peaceful self-care moment',
    expression: 'eyes closed blissfully with soft content smile, complete relaxation, spa day energy',
  },
  {
    day: 8, id: 'bed_edge_confident', name: 'Bedroom Confidence',
    caption: 'Feeling myself today 💋',
    setting: 'Elegant Parisian apartment bedroom, king bed with crisp white linen sheets and cream pillows, soft morning golden light through sheer curtains, warm intimate atmosphere',
    outfit: 'soft stretchy black bodysuit with thin straps, form-fitting, showcasing silhouette',
    pose: 'sitting on edge of bed, leaning forward slightly, hands on knees, confident feminine pose',
    expression: EXPRESSIONS[2],
  },
  {
    day: 9, id: 'oversized_sweater', name: 'Cozy Morning',
    caption: 'Boyfriend sweater but no boyfriend needed 😏',
    setting: 'Bright Parisian loft with dusty rose velvet sofa, herringbone parquet floor, tall French windows, morning light',
    outfit: 'luxurious oversized cream knit sweater falling off one shoulder, black brief bottoms',
    pose: 'standing by window, hands pulling sweater down slightly, one bare leg visible, cozy casual moment',
    expression: EXPRESSIONS[1],
  },
  {
    day: 10, id: 'post_workout_glow', name: 'Post-Workout Glow',
    caption: 'That after workout feeling 💪✨',
    setting: 'Minimalist home yoga corner, black yoga mat on light wood floor, large mirror, soft natural light, towel nearby, water bottle visible',
    outfit: 'fitted black athletic crop top showing midriff and matching high-cut athletic briefs, slight sheen of sweat, glowing skin',
    pose: 'standing confidently, one hand on hip, towel around neck, proud accomplished energy, full body visible',
    expression: EXPRESSIONS[4],
  },
  {
    day: 11, id: 'silk_slip_evening', name: 'Evening Ready',
    caption: 'Ready for tonight... or staying in? 🖤',
    setting: 'Bright Parisian loft with dusty rose velvet sofa, herringbone parquet floor, tall French windows, evening soft lighting',
    outfit: 'elegant cream silk slip dress with lace trim, thin straps, mid-thigh length, barefoot',
    pose: 'standing, hands adjusting thin strap on shoulder, hip slightly cocked, elegant feminine silhouette',
    expression: EXPRESSIONS[3],
  },
  {
    day: 12, id: 'lazy_bed_day', name: 'Lazy Day',
    caption: 'Some days you just stay in bed 😴💕',
    setting: 'Elegant Parisian apartment bedroom, messy but luxurious white bedding, soft daylight',
    outfit: 'delicate black silk camisole top with thin straps and matching soft shorts, barefoot',
    pose: 'lying on stomach on bed, propped up on elbows, feet playfully kicked up behind, chin resting on hands, looking at camera',
    expression: EXPRESSIONS[1],
  },
  {
    day: 13, id: 'fresh_from_shower', name: 'Fresh Out',
    caption: 'That fresh feeling ✨🚿',
    setting: 'Luxurious marble bathroom, large ornate gold-framed mirror, soft warm lighting, steam visible',
    outfit: 'wrapped in large white fluffy towel, wet hair slicked back, fresh natural skin, gold jewelry visible',
    pose: 'stepping out of bath wrapped in towel, wet hair, fresh glowing skin, candid moment',
    expression: EXPRESSIONS[0],
  },
  {
    day: 14, id: 'satin_loungewear', name: 'Satin Dreams',
    caption: 'Ending the day right 🌙',
    setting: 'Elegant Parisian apartment bedroom, soft evening lamp lighting, warm intimate atmosphere',
    outfit: 'delicate lace-trimmed ivory satin camisole and matching tap shorts, barefoot',
    pose: 'sitting on bed, legs tucked to side, one hand in hair, soft romantic pose, feminine silhouette emphasized',
    expression: EXPRESSIONS[2],
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
  return `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: ${content.setting}

OUTFIT: ${content.outfit},

POSE: ${content.pose},

EXPRESSION: ${content.expression},

STYLE: lifestyle influencer content, warm intimate atmosphere, premium Fanvue quality, aspirational,

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
  
  const response = await fetch(`${FANVUE_API_URL}/posts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: content.caption,
      media_urls: [imageUrl],
      is_premium: true, // Subscribers only, not free followers
    }),
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

  // Initialize Replicate
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  // Load reference images
  log('\n📸 Loading reference images...');
  const base64Refs = await Promise.all([
    urlToBase64(ELENA_FACE_REF),
    urlToBase64(ELENA_BODY_REF),
  ]);
  log('   ✅ References loaded');

  // Generate image
  log('\n🎨 Generating image with Nano Banana Pro...');
  const prompt = buildPrompt(content);
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

