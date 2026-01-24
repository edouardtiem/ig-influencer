#!/usr/bin/env node
/**
 * DA Test: Direct Flash Stark
 * 
 * Helmut Newton style:
 * - Direct flash, hard shadows
 * - Clinical, voyeuristic
 * - Powerful, dominant energy
 * - Combined with Editorial Mess setting
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

// Elena config
const ELENA = {
  face_ref: 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png',
  
  reference_instruction: `You are provided with a FACE REFERENCE image.

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same smooth feminine jawline and rounded chin
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
- Same bronde hair with VISIBLE golden blonde balayage highlights (NOT solid dark brown)
- Same naturally thick well-groomed eyebrows

BODY DESCRIPTION:
- Feminine shapely figure 172cm tall
- Large natural bust, narrow defined waist, wide feminine hips
- Healthy fit Italian body type, confident posture

CRITICAL: Face MUST be identical to the reference image.`,

  face_description: `soft round pleasant face, warm approachable features,
bronde hair dark roots with golden blonde balayage, long voluminous waves,
honey brown warm almond-shaped eyes, naturally full lips`,

  marks: `small beauty mark on right cheekbone (SIGNATURE),
gold layered necklaces with medallion pendant`,

  body_description: `feminine shapely figure, large natural bust,
narrow defined waist, wide feminine hips, confident posture`,
};

function log(msg) {
  console.log(`[${new Date().toISOString().split('T')[1].split('.')[0]}] ${msg}`);
}

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🎨 DA TEST: DIRECT FLASH STARK                             ║
║     Helmut Newton style - hard flash, clinical, powerful       ║
║     + Editorial Mess setting (bedroom, messy sheets)           ║
╚════════════════════════════════════════════════════════════════╝
`);

  const prompt = `${ELENA.reference_instruction}

═══════════════════════════════════════════════════════════════
STYLE: HELMUT NEWTON DIRECT FLASH
═══════════════════════════════════════════════════════════════

SUBJECT (copy face from reference EXACTLY):
${ELENA.face_description}
${ELENA.marks}
${ELENA.body_description}

LIGHTING - DIRECT FLASH STARK:
- DIRECT ON-CAMERA FLASH, harsh and unforgiving
- Hard shadows cast behind subject on wall
- Clinical, stark, almost surveillance-like quality
- High contrast between lit areas and dark shadows
- No soft light, no diffusion, raw flash aesthetic
- Slight red-eye effect acceptable for authenticity

SETTING - EDITORIAL MESS:
- Luxurious bedroom, unmade bed with white sheets in background
- She stands confidently in the room
- Magazines scattered, lived-in luxury apartment
- Night time, flash is the only light source

OUTFIT & POSE:
- Black fitted bodysuit or elegant black lingerie set
- Standing with powerful confident pose, hand on hip
- Direct confrontational gaze at camera
- Dominant energy, she controls the frame
- NOT smiling - serious, powerful expression

MOOD:
- Voyeuristic, like caught by paparazzi in private moment
- Powerful feminine energy, she's in control
- Raw, unpolished flash aesthetic
- Helmut Newton meets editorial fashion

TECHNICAL:
- Shot on 35mm film with direct flash
- Slight grain visible
- Colors slightly washed from flash
- Hard shadow silhouette on wall behind her

SINGLE IMAGE ONLY - NO collages, NO grids.
Think: Helmut Newton "Big Nudes" series meets bedroom editorial.`;

  // Check and sanitize
  const { isBlocked, blockedTerms } = checkForBlockedTerms(prompt);
  let finalPrompt = prompt;
  if (isBlocked) {
    log(`⚠️  Sanitizing (blocked: ${blockedTerms.join(', ')})`);
    finalPrompt = sanitizePrompt(prompt, 'normal');
  }

  // Load reference
  log('📥 Loading Elena face reference...');
  const faceRefBase64 = await urlToBase64(ELENA.face_ref);
  log('✅ Reference loaded');

  log('🚀 Generating Direct Flash Stark image...');
  const startTime = Date.now();

  try {
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt: finalPrompt,
        negative_prompt: 'soft light, diffused light, natural light, golden hour, warm tones, smiling, happy, cute, soft focus, blurry, low quality, cartoon, anime',
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

    const filename = `da_direct_flash_${Date.now()}.jpg`;
    const filepath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filepath, buffer);

    log(`✅ Saved: ${filepath}`);
    console.log(`\n💡 Open: open "${filepath}"`);

    console.log(`
═══════════════════════════════════════════════════════════
DA: DIRECT FLASH STARK — SUCCESS
- Helmut Newton direct flash ✓
- Hard shadows ✓
- Editorial Mess setting ✓
- Powerful dominant pose ✓
═══════════════════════════════════════════════════════════
`);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`❌ Error after ${duration}s: ${error.message}`);

    if (error.message?.includes('flagged') || error.message?.includes('safety')) {
      log('⚠️  Retrying with aggressive sanitization...');
      const saferPrompt = sanitizePrompt(prompt, 'aggressive');

      const output = await replicate.run(NANO_BANANA_MODEL, {
        input: {
          prompt: saferPrompt,
          negative_prompt: 'soft light, smiling, cute, blurry, cartoon',
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

      const filename = `da_direct_flash_safe_${Date.now()}.jpg`;
      const filepath = path.join(__dirname, '..', filename);
      fs.writeFileSync(filepath, buffer);

      log(`✅ Saved (safe version): ${filepath}`);
      console.log(`\n💡 Open: open "${filepath}"`);
    } else {
      throw error;
    }
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
