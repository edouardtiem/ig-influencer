#!/usr/bin/env node
/**
 * DA Test: Polaroid FASHION EDITORIAL
 * 
 * Option A: Keep Polaroid but make content inside MORE editorial/dramatic
 * - Stronger fashion pose
 * - More dramatic lighting/contrast
 * - High fashion magazine quality inside the Polaroid
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

// ═══════════════════════════════════════════════════════════════════════════
// FASHION EDITORIAL POLAROID PROMPTS
// ═══════════════════════════════════════════════════════════════════════════

const PROMPTS = [
  {
    name: "Polaroid Fashion Editorial v1 - Dramatic Light",
    prompt: `${ELENA.reference_instruction}

A hand holding a Polaroid instant photograph.

═══════════════════════════════════════════════════════════════
INSIDE THE POLAROID — HIGH FASHION EDITORIAL SHOT:
═══════════════════════════════════════════════════════════════

SUBJECT: ${ELENA.face_description}, ${ELENA.marks}, ${ELENA.body_description}

FASHION EDITORIAL STYLE INSIDE POLAROID:
- Elena in sleek black designer bodysuit, high-cut, elegant silhouette
- DRAMATIC SIDE LIGHTING creating strong shadows on her face and body
- High contrast, moody atmosphere like Vogue Italia editorial
- Standing with confident model pose, one hand on hip
- STRIKING intense gaze at camera, powerful feminine energy
- Dark moody background, studio-like dramatic lighting
- Fashion magazine cover quality, NOT casual or cute

MOOD INSIDE POLAROID: Dark, dramatic, high fashion, powerful
Think: Peter Lindbergh, Paolo Roversi, dramatic fashion photography

═══════════════════════════════════════════════════════════════
THE POLAROID FRAME:
═══════════════════════════════════════════════════════════════
- Classic white Polaroid border
- Hand with minimalist gold ring holding it
- Dark/black background behind the Polaroid (contrast)
- The Polaroid slightly tilted

SINGLE IMAGE ONLY. Fashion editorial inside a Polaroid frame.`,
  },
  {
    name: "Polaroid Fashion Editorial v2 - Silhouette",
    prompt: `${ELENA.reference_instruction}

A feminine hand holding a Polaroid instant photograph against dark background.

═══════════════════════════════════════════════════════════════
INSIDE THE POLAROID — FASHION SILHOUETTE SHOT:
═══════════════════════════════════════════════════════════════

SUBJECT: ${ELENA.face_description}, ${ELENA.marks}, ${ELENA.body_description}

FASHION EDITORIAL STYLE INSIDE POLAROID:
- Elena as dramatic SILHOUETTE against bright window light
- Backlit, her figure is dark silhouette with rim lighting on edges
- Wearing form-fitting black dress, elegant feminine silhouette visible
- Profile view or three-quarter angle, mysterious and striking
- Hair catching the backlight creating golden halo effect
- HIGH CONTRAST like film noir meets fashion editorial
- Powerful, mysterious, editorial NOT cute

MOOD: Mysterious, dramatic, high fashion, cinematic
Think: @vannia_music style but in a Polaroid

═══════════════════════════════════════════════════════════════
THE POLAROID FRAME:
═══════════════════════════════════════════════════════════════
- White Polaroid border contrasting with dark image inside
- Elegant hand holding it against dark marble or black surface
- Maybe a glass of red wine next to it on the surface
- Fashion magazine nearby (Vogue, Elle)

SINGLE IMAGE ONLY. Dramatic silhouette fashion shot inside Polaroid.`,
  },
  {
    name: "Polaroid Fashion Editorial v3 - Studio Glam",
    prompt: `${ELENA.reference_instruction}

Close-up of a hand holding a Polaroid photograph.

═══════════════════════════════════════════════════════════════
INSIDE THE POLAROID — HIGH GLAM FASHION SHOT:
═══════════════════════════════════════════════════════════════

SUBJECT: ${ELENA.face_description}, ${ELENA.marks}, ${ELENA.body_description}

FASHION EDITORIAL STYLE INSIDE POLAROID:
- Elena in elegant black off-shoulder top or blazer
- STUDIO LIGHTING: dramatic, sculpted, fashion photography lighting
- Strong cheekbone shadows, glamorous makeup look
- Confident powerful expression, model stare, not smiling
- Hair styled perfectly, editorial fashion hair
- Close-up portrait framing showing face and shoulders
- BLACK BACKGROUND or very dark, all focus on her
- Vogue cover portrait quality

MOOD: Glamorous, powerful, high fashion, striking
Think: Fashion magazine cover shot, studio editorial

═══════════════════════════════════════════════════════════════
THE POLAROID FRAME:
═══════════════════════════════════════════════════════════════
- White Polaroid border
- Hand with red manicure or gold jewelry holding it
- Background: black velvet or dark luxurious surface
- High contrast between white Polaroid frame and dark content

SINGLE IMAGE ONLY. High fashion glamour portrait inside Polaroid.`,
  },
];

async function generateImage(config, index) {
  log(`\n${'═'.repeat(60)}`);
  log(`🎨 ${index + 1}. ${config.name}`);
  log(`${'═'.repeat(60)}`);
  
  // Check and sanitize
  const { isBlocked, blockedTerms } = checkForBlockedTerms(config.prompt);
  let finalPrompt = config.prompt;
  if (isBlocked) {
    log(`⚠️  Sanitizing (blocked: ${blockedTerms.join(', ')})`);
    finalPrompt = sanitizePrompt(config.prompt, 'normal');
  }
  
  // Load reference
  const faceRefBase64 = await urlToBase64(ELENA.face_ref);
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt: finalPrompt,
        negative_prompt: 'ugly, deformed, blurry, low quality, cartoon, anime, cute, soft, pastel, bright colors, casual, lifestyle, instagram filter, smiling, happy, cheerful',
        aspect_ratio: '3:4',
        resolution: '2K',
        output_format: 'jpg',
        safety_filter_level: 'block_only_high',
        image_input: [faceRefBase64],
      },
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`⏱️  ${duration}s`);
    
    const imageUrl = Array.isArray(output) ? output[0] : output;
    
    // Download
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const filename = `da_polaroid_fashion_v${index + 1}.jpg`;
    const filepath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filepath, buffer);
    
    log(`✅ Saved: ${filename}`);
    return { name: config.name, filepath };
    
  } catch (error) {
    log(`❌ Error: ${error.message}`);
    
    if (error.message?.includes('flagged') || error.message?.includes('safety')) {
      log('⚠️  Retrying with aggressive sanitization...');
      const saferPrompt = sanitizePrompt(config.prompt, 'aggressive');
      
      const output = await replicate.run(NANO_BANANA_MODEL, {
        input: {
          prompt: saferPrompt,
          negative_prompt: 'ugly, deformed, blurry, cartoon, anime, cute, soft',
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
      
      const filename = `da_polaroid_fashion_v${index + 1}_safe.jpg`;
      const filepath = path.join(__dirname, '..', filename);
      fs.writeFileSync(filepath, buffer);
      
      log(`✅ Saved (safe): ${filename}`);
      return { name: config.name, filepath };
    }
    
    return null;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🎨 OPTION A: POLAROID + HIGH FASHION EDITORIAL             ║
║     Making the content INSIDE more dramatic/fashion            ║
╠════════════════════════════════════════════════════════════════╣
║  v1: Dramatic side lighting, moody studio                      ║
║  v2: Silhouette backlit (like @vannia_music)                   ║
║  v3: High glam studio portrait                                 ║
╚════════════════════════════════════════════════════════════════╝
`);

  const results = [];
  
  for (let i = 0; i < PROMPTS.length; i++) {
    const result = await generateImage(PROMPTS[i], i);
    if (result) results.push(result);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ ${results.length}/${PROMPTS.length} generated`);
  console.log(`${'═'.repeat(60)}\n`);
  
  results.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name}`);
    console.log(`      ${r.filepath}\n`);
  });
}

main().catch(console.error);
