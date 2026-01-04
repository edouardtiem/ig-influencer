#!/usr/bin/env node
/**
 * Elena Yoga Studio - Mirror selfie doing a split
 * Inspired by Sophie Emélia reference photo
 * 
 * Usage: node scripts/elena-yoga-studio.mjs
 */

import Replicate from 'replicate';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
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

// Elena's reference photos - 4 angles for consistency
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';
const ELENA_PROFILE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1767561713/y1r6jt0pwdrmr0cvhbf9sbenkw_z0sydx.png';
const ELENA_BACK_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1767562505/replicate-prediction-bjnvs97bqxrmy0cvhbpa8cx5f8_daohqh.png';

// ═══════════════════════════════════════════════════════════════
// ELENA CHARACTER
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

**IMAGE 3 (PROFILE REFERENCE)**: This is Elena from LEFT PROFILE. For side angles use this guide.

**IMAGE 4 (BACK REFERENCE)**: This is Elena from BEHIND. For back views use this guide.

CRITICAL: Face MUST be identical to Image 1. Body proportions MUST match Image 2. Side angles use Image 3. Back views use Image 4.`;

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

// ═══════════════════════════════════════════════════════════════
// HOME GYM LINGERIE PROMPT
// ═══════════════════════════════════════════════════════════════

const YOGA_STUDIO_PHOTO = {
  id: 'homegym_flexibility_selfie',
  name: 'Home Gym Flexibility Mirror Selfie',
  caption: 'I want you 💋',
  prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: Elegant private yoga space in bright Parisian apartment, large floor mirror, warm wooden parquet floor, black yoga mat, minimalist decor with plants, soft golden hour daylight streaming through windows,

OUTFIT: delicate black loungewear set - soft fitted camisole top and matching brief bottoms, barefoot on yoga mat, hair down flowing in natural beach waves, gold chunky bracelet and layered gold necklaces visible,

POSE: seated on black yoga mat facing large mirror, demonstrating impressive straddle stretch with legs extended wide to each side flat on mat, torso upright with elegant posture, both hands raised holding iPhone to take mirror selfie, phone partially covering lower face,

CAMERA: mirror selfie composition, full body visible in mirror reflection showcasing flexibility and feminine silhouette, warm soft indoor lighting,

EXPRESSION: captivating warm gaze into phone camera, soft confident smile, magnetic feminine presence,

STYLE: lifestyle influencer content, yoga flexibility moment, elegant athletic aesthetic, aspirational wellness, premium home content,

${ELENA_FINAL_CHECK}`
};

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
  const folder = 'elena-yoga';
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
    aspect_ratio: '4:5', // Instagram/Fanvue portrait
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
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  log('═══════════════════════════════════════════════════════════════');
  log('🧘 ELENA HOME GYM - Lingerie Split Mirror Selfie');
  log('═══════════════════════════════════════════════════════════════');

  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  // Convert references to base64 once
  log('\n📸 Loading reference images...');
  const base64Refs = await Promise.all([
    urlToBase64(ELENA_FACE_REF),
    urlToBase64(ELENA_BODY_REF),
  ]);
  log('  ✅ References loaded');

  const photo = YOGA_STUDIO_PHOTO;
  
  log(`\n🖼️ Generating: ${photo.name}`);
  log(`   Caption: ${photo.caption}`);

  try {
    const imageUrl = await generateImage(replicate, photo.prompt, base64Refs);
    log(`   ✅ Generated successfully`);

    // Upload to Cloudinary
    log(`   ☁️ Uploading to Cloudinary...`);
    const cloudinaryUrl = await uploadToCloudinary(imageUrl, photo.id);
    log(`   ✅ Uploaded: ${cloudinaryUrl}`);

    log('\n═══════════════════════════════════════════════════════════════');
    log('🎉 SUCCESS!');
    log('═══════════════════════════════════════════════════════════════');
    log(`\n📸 ${photo.name}`);
    log(`   Caption: ${photo.caption}`);
    log(`   URL: ${cloudinaryUrl}`);

  } catch (error) {
    log(`   ❌ Failed: ${error.message}`);
    console.error(error);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

