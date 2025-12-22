#!/usr/bin/env node
/**
 * Test Mila Red Hair Transformation
 * Transform Mila's hair from copper auburn to deep auburn red
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

// Mila's reference photos
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const MILA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png';

// Output directory
const outputDir = path.join(__dirname, '../generated/mila-red-hair-test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// PROMPTS
// ═══════════════════════════════════════════════════════════════

// Prompt for Flux Kontext (image editing)
const KONTEXT_EDIT_PROMPT = `Change only the hair color to deep auburn red - more saturated, richer red tones, vibrant warm red instead of copper. Keep everything else exactly the same: same face, same curls, same length, same freckles, same beauty marks, same necklace, same expression.`;

// Prompt for generation with reference (Minimax, etc.)
const GENERATION_PROMPT = `Mila, 22 year old French woman,
DEEP AUBURN RED hair (vibrant rich red, not copper, saturated warm red tones), type 3A loose curls, shoulder-length, natural volume,
hazel-green eyes with golden flecks, small dark brown beauty mark above left lip corner, beauty mark on right cheekbone,
light golden-brown freckles on nose and cheekbones,
thin gold necklace with minimalist star pendant,
slim athletic physique, natural full breasts,
soft warm smile, confident expression, natural lighting,
Instagram photo, photorealistic, high resolution 4K`;

// ═══════════════════════════════════════════════════════════════
// MODELS TO TEST
// ═══════════════════════════════════════════════════════════════

const TESTS = [
  // Test 1: Flux Kontext Max - Image editing (change hair color)
  {
    name: 'Flux Kontext Max (Edit)',
    model: 'black-forest-labs/flux-kontext-max',
    input: {
      prompt: KONTEXT_EDIT_PROMPT,
      input_image: MILA_FACE_REF,
      aspect_ratio: '3:4',
      safety_tolerance: 6,
      output_format: 'jpg',
    },
  },
  
  // Test 2: Minimax with subject reference - Generate new with red hair
  {
    name: 'Minimax (Generate with Ref)',
    model: 'minimax/image-01',
    input: {
      prompt: GENERATION_PROMPT,
      aspect_ratio: '3:4',
      subject_reference: MILA_FACE_REF,
    },
  },
  
  // Test 3: Flux 1.1 Pro Ultra with reference image
  {
    name: 'Flux 1.1 Pro Ultra',
    model: 'black-forest-labs/flux-1.1-pro-ultra',
    input: {
      prompt: GENERATION_PROMPT + ', based on reference face',
      aspect_ratio: '3:4',
      safety_tolerance: 6,
      output_format: 'jpg',
      raw: false,
    },
  },
  
  // Test 4: Flux Redux (style/image variation)
  {
    name: 'Flux Redux Dev',
    model: 'black-forest-labs/flux-redux-dev',
    input: {
      prompt: 'Same woman but with deep auburn red hair instead of copper auburn, more saturated vibrant red tones',
      redux_image: MILA_FACE_REF,
      aspect_ratio: '3:4',
      num_outputs: 1,
      output_format: 'jpg',
      guidance: 3.5,
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
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
  console.log(`   Model: ${test.model}`);
  
  const startTime = Date.now();
  
  try {
    console.log(`   ⏳ Running...`);
    const output = await replicate.run(test.model, { input: test.input });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  Duration: ${duration}s`);
    
    const imageUrl = extractUrl(output);
    
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.log(`   ❌ No valid image URL`);
      console.log(`   Raw output: ${JSON.stringify(output).slice(0, 200)}`);
      return { success: false, name: test.name, error: 'No valid URL' };
    }
    
    console.log(`   ✅ Generated!`);
    console.log(`   🔗 URL: ${imageUrl}`);
    
    // Download
    const filename = `${test.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
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
║       🔴 MILA RED HAIR TRANSFORMATION TEST                     ║
╠════════════════════════════════════════════════════════════════╣
║  Goal: Transform copper auburn → deep auburn red               ║
║  Reference: ${MILA_FACE_REF.slice(-30)}  ║
╚════════════════════════════════════════════════════════════════╝
`);

  console.log(`📁 Output directory: ${outputDir}\n`);
  
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
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${TESTS.length}`);
  console.log(`❌ Failed: ${failed.length}/${TESTS.length}\n`);
  
  if (successful.length > 0) {
    console.log(`🖼️  Generated Images:\n`);
    successful.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}`);
      console.log(`      📍 ${r.localPath}`);
      console.log(`      ⏱️  ${r.duration}s\n`);
    });
  }
  
  if (failed.length > 0) {
    console.log(`❌ Failed Tests:\n`);
    failed.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}: ${r.error}\n`);
    });
  }
  
  // Save results
  const resultsPath = path.join(outputDir, `results-${Date.now()}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    goal: 'Transform Mila hair: copper auburn → deep auburn red',
    faceRef: MILA_FACE_REF,
    bodyRef: MILA_BODY_REF,
    results,
  }, null, 2));
  console.log(`\n📝 Results saved: ${resultsPath}`);
  
  console.log(`\n✨ Done! Check the generated folder to compare results.`);
}

main().catch(console.error);

