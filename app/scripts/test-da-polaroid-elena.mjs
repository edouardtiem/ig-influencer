#!/usr/bin/env node
/**
 * DA Test: Polaroid Editorial Mess — Using Full Elena Config
 * 
 * Uses same config as scheduled-post.mjs:
 * - Elena face reference
 * - Elena reference instruction
 * - Elena face/body descriptions
 * - Same Replicate model & params
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizePrompt, checkForBlockedTerms } from './lib/nano-banana-blocklist.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// ═══════════════════════════════════════════════════════════════════════════
// ELENA CONFIG (exact copy from scheduled-post.mjs)
// ═══════════════════════════════════════════════════════════════════════════

const ELENA = {
  name: 'Elena',
  face_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
  body_ref: null, // DISABLED - causes safety filter blocks
  
  reference_instruction: `You are provided with a FACE REFERENCE image.

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same smooth feminine jawline and rounded chin
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
- Same bronde hair with VISIBLE golden blonde balayage highlights (NOT solid dark brown)
- Same naturally thick well-groomed eyebrows

BODY DESCRIPTION (no reference image):
- Feminine shapely figure 172cm tall
- Large natural bust, narrow defined waist, wide feminine hips
- Healthy fit Italian body type, confident posture

CRITICAL RULES:
- Face MUST be identical to the reference image - same person, same features
- Do NOT change face to look more "model-like" or angular
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
very large natural breasts prominent and natural shape,
narrow defined waist, wide feminine hips,
healthy fit Italian body, confident posture`,

  final_check: `FINAL CHECK - MUST MATCH REFERENCES:
- SINGLE IMAGE ONLY - NO collages, NO grids, NO patchwork, NO multiple photos combined
- Face: IDENTICAL to Image 1 (soft round face, NOT angular)
- Hair: bronde with VISIBLE golden blonde balayage (NOT solid dark brown)
- Beauty mark: on right cheekbone MUST be visible
- Jewelry: gold chunky bracelet + layered gold necklaces`,
};

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function log(msg) {
  console.log(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${msg}`);
}

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// DA: POLAROID EDITORIAL MESS
// ═══════════════════════════════════════════════════════════════════════════

const DA_POLAROID_EDITORIAL = {
  name: "Polaroid Editorial Mess",
  description: "Editorial fashion photo held as Polaroid - sexy + scrapbook aesthetic",
  
  buildPrompt: () => {
    // Sexy outfit options (from scheduled-post.mjs ELENA_SEXY_OUTFIT_DETAILS)
    const outfits = [
      'sleek black bodysuit, fitted and elegant, confident silhouette',
      'black lace-trimmed silk slip dress, elegant draping, intimate evening elegance',
      'fitted black two-piece set, crop top showing midriff, high-waisted bottoms',
    ];
    const outfit = outfits[Math.floor(Math.random() * outfits.length)];
    
    // Sexy poses (from scheduled-post.mjs ELENA_SEXY_ACTION_DETAILS)
    const poses = [
      'sitting on bed edge, relaxed confident pose, warm expression',
      'standing by window in morning light, elegant silhouette, hand on hip',
      'lounging elegantly on bed, legs tucked, confident feminine pose',
    ];
    const pose = poses[Math.floor(Math.random() * poses.length)];
    
    // Expressions (safe sexy)
    const expressions = [
      'confident warm gaze at camera, sophisticated smile, elegant presence',
      'enchanting warm smile, glamorous confidence',
      'soft elegant expression, warm welcoming eyes, effortless glamour',
    ];
    const expression = expressions[Math.floor(Math.random() * expressions.length)];

    return `${ELENA.reference_instruction}

═══════════════════════════════════════════════════════════════
COMPOSITION: A feminine hand holding a Polaroid instant photograph
═══════════════════════════════════════════════════════════════

THE POLAROID PHOTO SHOWS ELENA (copy face from reference EXACTLY):

SUBJECT: ${ELENA.face_description},
${ELENA.marks},
${ELENA.body_description}

OUTFIT: ${outfit}

POSE & ACTION: ${pose}

EXPRESSION: ${expression}

SETTING INSIDE POLAROID:
- Luxurious Parisian bedroom, unmade bed with white linen sheets
- Natural morning light streaming through sheer curtains
- Warm golden hour tones, intimate atmosphere
- Fashion editorial quality meets authentic bedroom moment

═══════════════════════════════════════════════════════════════
THE POLAROID FRAME & COMPOSITION
═══════════════════════════════════════════════════════════════

- Classic white instant Polaroid border, authentic vintage texture
- Feminine hand with natural nails and minimalist gold ring holding it
- Background: warm neutral tone OR white bed sheets
- The Polaroid is slightly tilted, held casually
- Authentic Polaroid color tone inside (slightly warm, vintage feel)
- Maybe handwritten date on white border ("Jan 23" style)

STYLE: Shot on iPhone 15 Pro, authentic feel
- Shallow depth of field, focus on the Polaroid
- Natural soft lighting on the hand and Polaroid
- Scrapbook aesthetic, intimate personal collection vibes

${ELENA.final_check}

CRITICAL: Generate ONE image showing a hand holding a Polaroid that contains Elena's fashion photo.`;
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE IMAGE
// ═══════════════════════════════════════════════════════════════════════════

async function generateImage() {
  log('═══════════════════════════════════════════════════════════');
  log('🎨 DA TEST: POLAROID EDITORIAL MESS — ELENA CONFIG');
  log('═══════════════════════════════════════════════════════════');
  
  // Build prompt
  const prompt = DA_POLAROID_EDITORIAL.buildPrompt();
  
  log('📋 Prompt built with Elena config');
  log(`   Face ref: ${ELENA.face_ref.split('/').pop()}`);
  
  // Check for blocked terms
  const { isBlocked, blockedTerms } = checkForBlockedTerms(prompt);
  let finalPrompt = prompt;
  if (isBlocked) {
    log(`⚠️  Pre-sanitizing (blocked: ${blockedTerms.join(', ')})`);
    finalPrompt = sanitizePrompt(prompt, 'normal');
  }
  
  // Convert reference to base64
  log('📥 Converting face reference to base64...');
  const faceRefBase64 = await urlToBase64(ELENA.face_ref);
  log('✅ Reference loaded');
  
  // Generate
  log('🚀 Calling Replicate (google/nano-banana-pro)...');
  const startTime = Date.now();
  
  try {
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt: finalPrompt,
        negative_prompt: 'ugly, deformed, noisy, blurry, low quality, cartoon, anime, illustration, painting, drawing, watermark, text, logo, bad anatomy, extra limbs, missing limbs, mutation, disfigured, poorly drawn face, cloned face, malformed limbs, fused fingers, too many fingers, username, signature, professional studio lighting, magazine cover, stock photo, overly retouched, artificial lighting',
        aspect_ratio: '3:4',
        resolution: '2K',
        output_format: 'jpg',
        safety_filter_level: 'block_only_high',
        image_input: [faceRefBase64],
      },
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`⏱️  Generation completed in ${duration}s`);
    
    const imageUrl = Array.isArray(output) ? output[0] : output;
    log(`🖼️  URL: ${imageUrl}`);
    
    // Download
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const filename = `da_polaroid_elena_${Date.now()}.jpg`;
    const filepath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filepath, buffer);
    
    log(`✅ Saved: ${filepath}`);
    log('');
    log('═══════════════════════════════════════════════════════════');
    log('DA: POLAROID EDITORIAL MESS — SUCCESS');
    log('- Elena face reference ✓');
    log('- Sexy outfit (bodysuit/slip) ✓');
    log('- Polaroid frame composition ✓');
    log('- Scrapbook aesthetic ✓');
    log('═══════════════════════════════════════════════════════════');
    
    return filepath;
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`❌ Error after ${duration}s: ${error.message}`);
    
    // Retry with safer prompt
    if (error.message?.includes('flagged') || error.message?.includes('safety')) {
      log('⚠️  Retrying with aggressive sanitization...');
      const saferPrompt = sanitizePrompt(prompt, 'aggressive');
      
      const output = await replicate.run(NANO_BANANA_MODEL, {
        input: {
          prompt: saferPrompt,
          negative_prompt: 'ugly, deformed, noisy, blurry, low quality, cartoon, anime',
          aspect_ratio: '3:4',
          resolution: '2K',
          output_format: 'jpg',
          safety_filter_level: 'block_only_high',
          image_input: [faceRefBase64],
        },
      });
      
      const imageUrl = Array.isArray(output) ? output[0] : output;
      const response = await fetch(imageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      const filename = `da_polaroid_elena_safe_${Date.now()}.jpg`;
      const filepath = path.join(__dirname, '..', filename);
      fs.writeFileSync(filepath, buffer);
      
      log(`✅ Saved (safe version): ${filepath}`);
      return filepath;
    }
    
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

generateImage()
  .then(filepath => {
    console.log(`\n💡 Open: open "${filepath}"`);
  })
  .catch(err => {
    console.error('❌ Fatal:', err.message);
    process.exit(1);
  });
