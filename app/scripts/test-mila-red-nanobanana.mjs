#!/usr/bin/env node
/**
 * Test Mila Red Hair with Nano Banana Pro
 * Use the same model as production to test the new hair color
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

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

// Model
const NANO_BANANA_MODEL = 'google/nano-banana-pro';

// Mila's reference photos
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const MILA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png';

// Output directory
const outputDir = path.join(__dirname, '../generated/mila-red-hair-test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// PROMPTS - Updated with DEEP AUBURN RED hair
// ═══════════════════════════════════════════════════════════════

const REFERENCE_INSTRUCTION = `BASED ON THE PROVIDED REFERENCE IMAGES, generate the EXACT SAME PERSON with identical face features, body proportions, and distinctive marks. The reference images are the source of truth for appearance.`;

// NEW: Deep auburn red hair (more saturated, richer red)
const MILA_FACE_NEW = `oval elongated face shape with high naturally defined cheekbones,
soft feminine jawline not angular, chin slightly pointed,
DEEP AUBURN RED hair (vibrant rich saturated red tones, NOT copper, warm cherry-red auburn), type 3A loose curls shoulder-length with natural volume and messy texture,
almond-shaped hazel-green eyes with golden flecks, natural full eyebrows slightly arched,
straight nose with slightly upturned tip (cute nose),
naturally full lips medium thickness with subtle asymmetry, rose-nude natural color`;

const MILA_MARKS = `small dark brown beauty mark 2mm above left lip corner (SIGNATURE),
medium brown beauty mark on center of right cheekbone,
20-25 light golden-brown freckles on nose bridge and cheekbones,
thin gold necklace with minimalist star pendant always visible`;

const MILA_BODY = `slim athletic physique 168cm, Mediterranean light tan skin,
natural full feminine curves with defined waist,
toned but not muscular, Pilates-sculpted shoulders`;

const MILA_BASE_NEW = `${MILA_FACE_NEW},
${MILA_MARKS},
${MILA_BODY}`;

// ═══════════════════════════════════════════════════════════════
// TEST SCENARIOS
// ═══════════════════════════════════════════════════════════════

const TESTS = [
  {
    name: 'Portrait Simple',
    prompt: `${REFERENCE_INSTRUCTION}

Mila, 22 year old French woman, ${MILA_BASE_NEW},

wearing cream beige tank top, simple elegant,
soft confident smile, warm direct gaze at camera,

bright natural daylight, clean white background,
Instagram portrait photo, photorealistic, high resolution 4K, sharp focus on face`,
  },
  {
    name: 'Cafe Lifestyle',
    prompt: `${REFERENCE_INSTRUCTION}

Mila, 22 year old French woman, ${MILA_BASE_NEW},

wearing white crop top and high waisted jeans,
sitting at Parisian cafe terrace, holding coffee cup,
relaxed confident pose, soft inviting smile,

golden hour morning light, charming French cafe background,
Instagram lifestyle photo, photorealistic, high resolution 4K`,
  },
  {
    name: 'Fitness Athleisure',
    prompt: `${REFERENCE_INSTRUCTION}

Mila, 22 year old French woman, ${MILA_BASE_NEW},

wearing olive green sports bra and matching high waisted leggings,
standing in bright modern gym, confident athletic pose,
slight sweat glow, proud accomplished expression,

natural light from large windows, mirrors visible,
Instagram fitness photo, photorealistic, high resolution 4K`,
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function extractUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) {
    const first = output[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.toString === 'function') {
      const str = first.toString();
      if (str.startsWith('http')) return str;
    }
  }
  if (output && typeof output.toString === 'function') {
    const str = output.toString();
    if (str.startsWith('http')) return str;
  }
  return null;
}

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function runTest(test, index) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔬 Test ${index + 1}: ${test.name}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`   Model: ${NANO_BANANA_MODEL}`);
  
  const startTime = Date.now();
  
  try {
    console.log(`   ⏳ Running with Nano Banana Pro...`);
    
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt: test.prompt,
        aspect_ratio: '3:4',
        reference_images: [MILA_FACE_REF, MILA_BODY_REF],
        number_of_images: 1,
      },
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  Duration: ${duration}s`);
    
    const imageUrl = extractUrl(output);
    
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.log(`   ❌ No valid image URL`);
      return { success: false, name: test.name, error: 'No valid URL' };
    }
    
    console.log(`   ✅ Generated!`);
    console.log(`   🔗 URL: ${imageUrl}`);
    
    // Download
    const filename = `nanobanana-red-${test.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
    const filepath = path.join(outputDir, filename);
    await downloadImage(imageUrl, filepath);
    console.log(`   💾 Saved: ${filename}`);
    
    return {
      success: true,
      name: test.name,
      url: imageUrl,
      localPath: filepath,
      duration: parseFloat(duration),
    };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ❌ Error after ${duration}s: ${error.message}`);
    return { success: false, name: test.name, error: error.message };
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🔴 MILA RED HAIR - NANO BANANA PRO TEST                    ║
╠════════════════════════════════════════════════════════════════╣
║  Model: google/nano-banana-pro (production model)              ║
║  Goal: Generate Mila with DEEP AUBURN RED hair                 ║
║  References: Face + Body (same as production)                  ║
╚════════════════════════════════════════════════════════════════╝
`);

  console.log(`📸 Face ref: ${MILA_FACE_REF}`);
  console.log(`📸 Body ref: ${MILA_BODY_REF}`);
  console.log(`📁 Output: ${outputDir}\n`);
  
  const results = [];
  
  for (let i = 0; i < TESTS.length; i++) {
    const result = await runTest(TESTS[i], i);
    results.push(result);
  }
  
  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`                    📊 SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);
  
  const successful = results.filter(r => r.success);
  console.log(`✅ Successful: ${successful.length}/${TESTS.length}\n`);
  
  if (successful.length > 0) {
    console.log(`🖼️  Generated Images:\n`);
    successful.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}`);
      console.log(`      📍 ${r.localPath}`);
      console.log(`      ⏱️  ${r.duration}s\n`);
    });
  }
  
  // Save results
  const resultsPath = path.join(outputDir, `nanobanana-results-${Date.now()}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    model: NANO_BANANA_MODEL,
    goal: 'Generate Mila with DEEP AUBURN RED hair using production model',
    faceRef: MILA_FACE_REF,
    bodyRef: MILA_BODY_REF,
    results,
  }, null, 2));
  console.log(`📝 Results saved: ${resultsPath}`);
  
  console.log(`\n✨ Done! Compare these with your current Mila photos.`);
}

main().catch(console.error);

