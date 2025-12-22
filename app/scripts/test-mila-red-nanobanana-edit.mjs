#!/usr/bin/env node
/**
 * Test Mila Red Hair with Nano Banana Pro - EDIT MODE
 * Use Nano Banana Pro's editing capabilities to change ONLY the hair color
 * while keeping the face identical
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

// Mila's reference photos - the source images to EDIT
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const MILA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png';

// Output directory
const outputDir = path.join(__dirname, '../generated/mila-red-hair-test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// EDIT PROMPTS - Focus on changing ONLY hair color
// ═══════════════════════════════════════════════════════════════

const EDIT_PROMPTS = [
  // Test 1: Simple edit instruction
  {
    name: 'Simple Edit',
    prompt: `Edit this image: change the hair color from copper auburn to deep auburn red (more saturated, richer red tones, vibrant warm red). Keep everything else exactly the same - same face, same expression, same pose, same clothing, same background.`,
  },
  // Test 2: More specific
  {
    name: 'Specific Hair Edit',
    prompt: `Transform the hair color in this photo to a vibrant deep auburn red - rich saturated red tones instead of copper. Maintain the exact same curly texture, length, and volume. Do not change anything else about the person or image.`,
  },
  // Test 3: Before/After style
  {
    name: 'Color Transformation',
    prompt: `This woman just dyed her hair from copper auburn to deep cherry-red auburn. Show her with the new hair color - a rich, saturated red that's more vibrant than before. Keep her face, features, expression, and everything else identical.`,
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

async function runEditTest(test, sourceImage, index) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔬 Test ${index + 1}: ${test.name}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`   Source: ${sourceImage.split('/').pop()}`);
  console.log(`   Mode: EDIT (keeping face intact)`);
  
  const startTime = Date.now();
  
  try {
    console.log(`   ⏳ Running Nano Banana Pro in edit mode...`);
    
    // Use reference_images with the source image to EDIT it
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt: test.prompt,
        reference_images: [sourceImage],
        aspect_ratio: '3:4',
        number_of_images: 1,
      },
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  Duration: ${duration}s`);
    
    const imageUrl = extractUrl(output);
    
    if (!imageUrl || !imageUrl.startsWith('http')) {
      console.log(`   ❌ No valid image URL`);
      console.log(`   Raw: ${JSON.stringify(output).slice(0, 200)}`);
      return { success: false, name: test.name, error: 'No valid URL' };
    }
    
    console.log(`   ✅ Generated!`);
    console.log(`   🔗 URL: ${imageUrl}`);
    
    // Download
    const filename = `nanobanana-EDIT-${test.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
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
║     🔴 MILA RED HAIR - NANO BANANA PRO EDIT MODE               ║
╠════════════════════════════════════════════════════════════════╣
║  Model: google/nano-banana-pro                                 ║
║  Mode: IMAGE EDITING (not generation)                          ║
║  Goal: Change ONLY hair color, keep face IDENTICAL             ║
╚════════════════════════════════════════════════════════════════╝
`);

  console.log(`📸 Source image to edit: ${MILA_FACE_REF}`);
  console.log(`📁 Output: ${outputDir}\n`);
  
  const results = [];
  
  // Run all edit prompts on the face reference
  for (let i = 0; i < EDIT_PROMPTS.length; i++) {
    const result = await runEditTest(EDIT_PROMPTS[i], MILA_FACE_REF, i);
    results.push(result);
  }
  
  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`                    📊 SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);
  
  const successful = results.filter(r => r.success);
  console.log(`✅ Successful: ${successful.length}/${EDIT_PROMPTS.length}\n`);
  
  if (successful.length > 0) {
    console.log(`🖼️  Generated Images:\n`);
    successful.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.name}`);
      console.log(`      📍 ${r.localPath}`);
      console.log(`      ⏱️  ${r.duration}s\n`);
    });
  }
  
  // Save results
  const resultsPath = path.join(outputDir, `nanobanana-edit-results-${Date.now()}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    model: NANO_BANANA_MODEL,
    mode: 'EDIT',
    goal: 'Change hair color while keeping face identical',
    sourceImage: MILA_FACE_REF,
    results,
  }, null, 2));
  console.log(`📝 Results saved: ${resultsPath}`);
  
  console.log(`\n✨ Done! The face should be IDENTICAL to the original.`);
}

main().catch(console.error);

