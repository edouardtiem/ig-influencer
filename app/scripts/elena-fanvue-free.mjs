#!/usr/bin/env node
/**
 * Elena Fanvue Free Content - Generate 6 lifestyle photos for free tier
 * These are "Instagram+" level - more personal than IG, less premium than paid pack
 * 
 * Usage: node scripts/elena-fanvue-free.mjs
 */

import 'dotenv/config';
import Replicate from 'replicate';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// Elena's reference photos
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';
const ELENA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967073/replicate-prediction-ws5fpmjpfsrma0cv538t79j8jm_wx9nap.png';

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

// ═══════════════════════════════════════════════════════════════
// 6 PHOTOS FOR FREE FANVUE CONTENT
// Lifestyle/casual - "Instagram+" level
// ═══════════════════════════════════════════════════════════════

const FANVUE_FREE_PHOTOS = [
  {
    id: 'morning_coffee',
    name: 'Morning Coffee Selfie',
    caption: 'Good morning from Paris ☕ Just woke up energy...',
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: Cozy Parisian apartment kitchen, morning light through window, espresso machine visible, white marble counters, brass fixtures, warm domestic atmosphere,

OUTFIT: oversized cream knit sweater falling off one shoulder revealing skin, messy hair just woke up, minimal makeup natural beauty, barefoot,

ACTION: holding espresso cup with both hands, soft sleepy smile, looking at camera, intimate morning moment,

EXPRESSION: soft dreamy eyes, gentle smile, morning glow, relaxed authentic,

STYLE: iPhone selfie aesthetic, natural lighting, lifestyle content, intimate but tasteful, cozy morning vibes,

${ELENA_FINAL_CHECK}`
  },
  {
    id: 'mirror_selfie',
    name: 'Getting Ready Mirror',
    caption: 'Getting ready for something... 👀',
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: Elegant Parisian apartment bedroom, large ornate mirror with gold frame, soft vanity lighting, messy bed in background, clothes laid out, feminine space,

OUTFIT: silk champagne colored slip dress thin straps, form fitting showing silhouette, hair being styled mid-process,

ACTION: taking mirror selfie with iPhone, one hand touching hair, confident pose, body slightly angled to show curves,

EXPRESSION: playful knowing smile, direct eye contact through mirror, confident feminine energy,

STYLE: mirror selfie aesthetic, warm lighting, behind-the-scenes getting ready moment, Instagram-plus intimacy,

${ELENA_FINAL_CHECK}`
  },
  {
    id: 'lazy_sunday',
    name: 'Lazy Sunday in Bed',
    caption: 'Sunday mood 🤍 No plans, just vibes',
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: Luxurious king bed with white crisp linen sheets, cream and beige pillows, morning sunlight streaming through sheer curtains, cozy bedroom atmosphere,

OUTFIT: oversized white t-shirt as sleepwear, hair messy natural waves on pillow, natural no-makeup look,

ACTION: lying on bed propped on elbow, reading magazine or scrolling phone, relaxed lazy morning pose, legs visible under sheets,

EXPRESSION: soft content smile, relaxed eyes, peaceful Sunday energy, authentic candid moment,

STYLE: lifestyle photography, soft natural light, cozy intimate aesthetic, relatable content,

${ELENA_FINAL_CHECK}`
  },
  {
    id: 'rooftop_sunset',
    name: 'Rooftop Golden Hour',
    caption: 'Paris sunsets hit different 🌅',
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: Private Parisian rooftop terrace, golden hour light, Paris zinc rooftops and Eiffel Tower in distance, string lights, plants, chic outdoor furniture,

OUTFIT: fitted ribbed beige crop top showing midriff, high-waisted linen pants, hair flowing in breeze, summer evening casual,

ACTION: leaning on rooftop railing, looking over shoulder at camera, wind in hair, golden hour silhouette,

EXPRESSION: serene confident smile, warm inviting gaze, magical hour energy,

STYLE: golden hour photography, backlit silhouette, lifestyle influencer aesthetic, Paris vibes,

${ELENA_FINAL_CHECK}`
  },
  {
    id: 'bath_time',
    name: 'Self-Care Sunday',
    caption: 'Self-care is not optional 🛁✨',
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: Luxurious bathroom, filled bathtub with bubbles, candles lit around, eucalyptus hanging, marble surfaces, soft ambient lighting, spa atmosphere,

OUTFIT: hair up in messy bun, shoulders and collarbone visible above bubble bath, natural dewy skin, gold necklaces still visible,

ACTION: relaxing in bubble bath, holding glass of wine, head tilted back slightly, peaceful self-care moment,

EXPRESSION: eyes closed blissfully OR soft content smile, complete relaxation, spa day energy,

STYLE: self-care aesthetic, warm candlelit glow, intimate but tasteful, wellness content,

${ELENA_FINAL_CHECK}`
  },
  {
    id: 'workout_glow',
    name: 'Post-Workout Glow',
    caption: 'Just finished, feeling good 💪',
    prompt: `${REFERENCE_INSTRUCTION}

SUBJECT: Elena, 24 year old Italian woman,
${ELENA_BASE},

SETTING: Home gym or yoga corner in Parisian apartment, yoga mat, plants, natural light, minimalist fitness space,

OUTFIT: black sports bra and high-waisted black leggings, hair in high ponytail, slight sheen of sweat, post-workout glow,

ACTION: standing confidently, one hand on hip, towel around neck, just finished workout energy, proud of herself,

EXPRESSION: confident accomplished smile, glowing healthy energy, empowered fitness vibes,

STYLE: fitness lifestyle content, natural lighting, healthy aesthetic, aspirational but relatable,

${ELENA_FINAL_CHECK}`
  }
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
  const folder = 'elena-fanvue-free';
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
  log('🌟 ELENA FANVUE FREE CONTENT - 6 Lifestyle Photos');
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

  const results = [];

  for (let i = 0; i < FANVUE_FREE_PHOTOS.length; i++) {
    const photo = FANVUE_FREE_PHOTOS[i];
    
    log(`\n🖼️ [${i + 1}/${FANVUE_FREE_PHOTOS.length}] Generating: ${photo.name}`);
    log(`   Caption: ${photo.caption}`);

    try {
      const imageUrl = await generateImage(replicate, photo.prompt, base64Refs);
      log(`   ✅ Generated successfully`);

      // Upload to Cloudinary
      log(`   ☁️ Uploading to Cloudinary...`);
      const cloudinaryUrl = await uploadToCloudinary(imageUrl, photo.id);
      log(`   ✅ Uploaded: ${cloudinaryUrl}`);

      results.push({
        id: photo.id,
        name: photo.name,
        caption: photo.caption,
        url: cloudinaryUrl,
        success: true,
      });

    } catch (error) {
      log(`   ❌ Failed: ${error.message}`);
      results.push({
        id: photo.id,
        name: photo.name,
        caption: photo.caption,
        error: error.message,
        success: false,
      });
    }

    // Small delay between generations
    if (i < FANVUE_FREE_PHOTOS.length - 1) {
      log('   ⏳ Waiting 2s before next...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Summary
  log('\n═══════════════════════════════════════════════════════════════');
  log('📋 SUMMARY');
  log('═══════════════════════════════════════════════════════════════');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  log(`\n✅ Successful: ${successful.length}/${results.length}`);
  
  if (successful.length > 0) {
    log('\n🖼️ GENERATED PHOTOS FOR FANVUE:');
    log('────────────────────────────────────────');
    for (const r of successful) {
      log(`\n📸 ${r.name}`);
      log(`   Caption: ${r.caption}`);
      log(`   URL: ${r.url}`);
    }
  }

  if (failed.length > 0) {
    log('\n❌ Failed:');
    for (const r of failed) {
      log(`   - ${r.name}: ${r.error}`);
    }
  }

  log('\n═══════════════════════════════════════════════════════════════');
  log('🎉 DONE - Upload these to Fanvue as FREE content!');
  log('═══════════════════════════════════════════════════════════════');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

