#!/usr/bin/env node
/**
 * Test Mila Red Hair - WINNING PROMPT
 * Using the CORRECT method: base64 images in image_input
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Config
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

// ═══════════════════════════════════════════════════════════════
// ALL 5 MILA REFERENCE IMAGES (original set)
// ═══════════════════════════════════════════════════════════════
const MILA_REFS = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png', // Face hero
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png', // Additional ref
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png', // Additional ref
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png', // Additional ref
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png', // Body ref
];

// Output
const outputDir = path.join(__dirname, '../generated/mila-red-hair-test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// THE WINNING PROMPT
// ═══════════════════════════════════════════════════════════════

const WINNING_PROMPT = `can you please try to reproduce the exact same woman provided in the 5 pictures. but you'll have one mission. change her hair colors to DEEP AUBURN RED. simply create a portrait as on photo provided 1. with the new color. don't change anything else`;

// ═══════════════════════════════════════════════════════════════
// HELPERS - Same as carousel-post.mjs
// ═══════════════════════════════════════════════════════════════

async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

function extractUrl(output) {
  if (typeof output === 'string') return output;
  if (Array.isArray(output) && output[0]) {
    const first = output[0];
    if (typeof first === 'string') return first;
    const str = first.toString();
    if (str.startsWith('http')) return str;
  }
  const str = output?.toString();
  return str?.startsWith('http') ? str : null;
}

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🔴 MILA RED HAIR - CORRECTED METHOD                        ║
║     Using base64 in image_input (like carousel-post.mjs)       ║
╠════════════════════════════════════════════════════════════════╣
║  Converting URLs to base64 before sending                      ║
╚════════════════════════════════════════════════════════════════╝
`);

  console.log(`📝 Prompt: "${WINNING_PROMPT}"\n`);
  console.log(`📸 References (5 images):`);
  console.log(`   1. Photo_1 - Face hero`);
  console.log(`   2. Photo_2 - Additional ref`);
  console.log(`   3. Photo_3 - Additional ref`);
  console.log(`   4. Photo_4 - Additional ref`);
  console.log(`   5. Photo_5 - Body ref\n`);
  
  // Convert all references to base64
  console.log(`⏳ Converting ${MILA_REFS.length} images to base64...`);
  const base64Images = await Promise.all(
    MILA_REFS.map(url => urlToBase64(url))
  );
  console.log(`✅ Converted to base64\n`);
  
  const startTime = Date.now();
  
  try {
    console.log(`⏳ Generating with Nano Banana Pro...`);
    
    // CORRECT METHOD: use image_input with base64, not reference_images with URLs
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt: WINNING_PROMPT,
        image_input: base64Images, // ✅ CORRECT: base64 images
        aspect_ratio: '3:4',
        output_format: 'jpg',
        safety_filter_level: 'block_only_high',
      },
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️  Duration: ${duration}s`);
    
    const imageUrl = extractUrl(output);
    if (!imageUrl) {
      console.log(`❌ No valid URL in output`);
      return;
    }
    
    console.log(`✅ Generated!`);
    
    const filename = `nanobanana-base64-correct-${Date.now()}.jpg`;
    const filepath = path.join(outputDir, filename);
    await downloadImage(imageUrl, filepath);
    console.log(`💾 Saved: ${filepath}`);
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🎉 SUCCESS! Check the output image.`);
    console.log(`${'═'.repeat(60)}`);
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

main().catch(console.error);
