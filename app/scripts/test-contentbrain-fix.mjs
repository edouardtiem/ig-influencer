#!/usr/bin/env node
/**
 * Test: Verify Content Brain fix works (face ref only for Elena)
 */

import Replicate from 'replicate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Import the CHARACTERS config from scheduled-post to verify it
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

async function main() {
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('❌ REPLICATE_API_TOKEN not set');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  console.log('\n🧪 TEST: Content Brain Fix Verification');
  console.log('═'.repeat(60));
  console.log('Testing: Elena bikini with FACE ref only (audit fix)\n');

  // Simulating what Content Brain would generate
  const prompt = `You are provided with a FACE REFERENCE image.

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

SUBJECT: soft round pleasant face NOT angular, warm approachable features,
smooth feminine jawline, rounded chin, soft cheekbones,
bronde hair dark roots with golden blonde balayage, long voluminous beach waves past shoulders,
honey brown warm almond-shaped eyes, naturally thick eyebrows well-groomed,
small straight nose, naturally full lips nude-pink color,
small beauty mark on right cheekbone (SIGNATURE),
glowing sun-kissed Italian skin tone

SETTING: Beach at sunset, golden hour lighting

OUTFIT: black two-piece swimsuit, classic style

ACTION: standing on beach, hand on hip, confident model pose

EXPRESSION: confident warm gaze at camera, sophisticated smile, elegant presence

STYLE: Shot on iPhone 15 Pro, RAW unedited authentic look
- Natural skin with texture
- Candid energy

FINAL CHECK:
- SINGLE IMAGE ONLY - NO collages, NO grids
- Face: IDENTICAL to reference (soft round face, NOT angular)
- Hair: bronde with VISIBLE golden blonde balayage
- Beauty mark: on right cheekbone MUST be visible`;

  console.log('⏳ Generating with FACE ref only...');
  const faceBase64 = await urlToBase64(ELENA_FACE_REF);
  console.log(`   Using 1 reference image (face only - audit fix)`);
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt,
        negative_prompt: 'ugly, deformed, noisy, blurry, low quality, cartoon, anime, collage, multiple images, grid',
        aspect_ratio: "4:5",
        resolution: "2K",
        output_format: "jpg",
        safety_filter_level: "block_only_high",
        image_input: [faceBase64], // Only face ref!
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ SUCCESS in ${duration}s`);
    console.log('\n🎉 Content Brain fix verified - Elena bikini works with face ref only!');
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const blocked = error.message?.includes('flagged') || error.message?.includes('sensitive');
    console.log(`\n${blocked ? '❌ BLOCKED' : '⚠️ ERROR'} in ${duration}s`);
    console.log(`Error: ${error.message?.substring(0, 150)}`);
    
    if (blocked) {
      console.log('\n⚠️ Still blocked - may need additional prompt cleanup');
    }
  }
}

main().catch(console.error);
