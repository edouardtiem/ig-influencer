#!/usr/bin/env node
/**
 * Test: Generate Elena image for tonight using Ideogram Character
 * Uses Content Brain logic but with Ideogram Character model
 */

import Replicate from 'replicate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Elena references (same as content brain)
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

// Elena character description (from content brain - SAFE VERSION)
const ELENA_CHARACTER = {
  face_description: `soft round pleasant face, warm approachable features,
smooth feminine jawline, rounded chin, soft cheekbones,
bronde hair dark roots with golden blonde balayage, long voluminous beach waves past shoulders,
honey brown warm almond-shaped eyes, naturally thick eyebrows well-groomed,
small straight nose, naturally full lips`,
  marks: `small beauty mark on right cheekbone,
glowing sun-kissed Italian skin tone,
gold chain bracelet on left wrist,
layered gold necklaces with medallion pendant`,
  body_description: `elegant feminine figure 172cm tall,
healthy fit Italian body type, confident posture`,
};

// Tonight's post: Standing far shot in bikini at home
const TONIGHT_POST = {
  location: 'Loft Elena Paris 8e - luxe minimaliste, grandes fenêtres avec vue sur les toits de Paris',
  setting: 'Her spacious Parisian loft living room, large windows, minimalist luxury interior, natural daylight',
  outfit: 'Simple black two-piece swimwear, classic style',
  action: 'Standing in her living room, full body visible, wide shot showing the entire room, natural confident pose',
  mood: 'Confident, natural, at home',
  expression: 'natural confident expression, slight smile',
};

// Elena expressions pool (from content brain)
const ELENA_EXPRESSIONS = [
  'intense captivating gaze at camera, lips slightly parted, smoldering confidence',
  'enchanting knowing smile, direct eye contact, magnetic allure',
  'soft alluring expression, warm inviting eyes, effortless glamour',
  'looking over shoulder with captivating glance, mysterious and inviting',
  'genuine laugh mid-burst, eyes crinkled, authentic joy',
  'eyes closed enjoying moment, peaceful sensual smile',
];

function parseOutput(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) {
    return typeof output[0] === 'string' ? output[0] : parseOutput(output[0]);
  }
  if (output?.url && typeof output.url === 'function') {
    return output.url().toString();
  }
  if (output?.url) return output.url;
  return null;
}

async function main() {
  console.log('\n🌙 ELENA TONIGHT - Ideogram Character Test');
  console.log('═'.repeat(60));
  console.log(`📍 Location: ${TONIGHT_POST.location}`);
  console.log(`👗 Outfit: ${TONIGHT_POST.outfit}`);
  console.log(`🎬 Action: ${TONIGHT_POST.action}`);
  console.log(`💫 Mood: ${TONIGHT_POST.mood}`);
  
  if (!process.env.REPLICATE_API_TOKEN) {
    console.error('\n❌ REPLICATE_API_TOKEN not set');
    process.exit(1);
  }
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

  // Build Content Brain style prompt
  const prompt = `Ultra high quality professional Instagram photograph, 8K resolution, shot on Canon EOS R5.

SUBJECT - Elena Visconti, Italian fashion model:
${ELENA_CHARACTER.face_description}
${ELENA_CHARACTER.marks}
${ELENA_CHARACTER.body_description}

SETTING: ${TONIGHT_POST.setting}
${TONIGHT_POST.location}

OUTFIT: ${TONIGHT_POST.outfit}

ACTION: ${TONIGHT_POST.action}

EXPRESSION: ${TONIGHT_POST.expression}

MOOD: ${TONIGHT_POST.mood}

STYLE: 
- iPhone 15 Pro aesthetic, RAW unedited authentic look
- Natural indoor lighting through large windows
- WIDE SHOT - full body visible from head to feet
- Subject takes 40% of frame, room environment visible around her
- Distance shot, standing far from camera
- Natural skin texture
- Candid energy, authentic moment at home

REQUIREMENTS:
- SINGLE IMAGE ONLY - no collages, no grids
- Photorealistic quality
- The character's face MUST match the reference image exactly
- Jewelry visible (gold bracelet, layered necklaces)`;

  console.log('\n⏳ Generating image with Ideogram Character...\n');
  const startTime = Date.now();

  try {
    const output = await replicate.run("ideogram-ai/ideogram-character", {
      input: {
        prompt: prompt,
        character_reference_image: ELENA_FACE_REF,
        aspect_ratio: "4:5",
        style_type: "Realistic",
        negative_prompt: "blurry, low quality, distorted, deformed, ugly, cartoon, anime, painting, illustration, oversaturated, artificial looking, professional studio, stock photo, collage, multiple images, grid"
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const imageUrl = parseOutput(output);

    console.log('═'.repeat(60));
    console.log('✅ IMAGE GENERATED');
    console.log('═'.repeat(60));
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`\n🖼️  Result URL:`);
    console.log(`   ${imageUrl}\n`);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n❌ Failed after ${duration}s: ${error.message}`);
  }
}

main().catch(console.error);
