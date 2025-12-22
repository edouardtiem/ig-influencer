#!/usr/bin/env node
/**
 * Test Mila Hair Color - TESLA RED (Deep Cherry Wine)
 * Inspired by Tesla Ultra Red - adapted for hair
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

// All 5 Mila references
const MILA_REFS = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png',
];

// Output
const outputDir = path.join(__dirname, '../generated/mila-color-tests');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// COLOR VARIATIONS TO TEST
// ═══════════════════════════════════════════════════════════════

const COLOR_TESTS = [
  {
    name: 'Tesla Cherry Wine',
    color: 'deep cherry wine red hair color, rich saturated red with burgundy undertones, glossy finish, like Tesla car red but as natural hair - deep, luxurious, jewel-toned red',
  },
  {
    name: 'Tesla Red Exact',
    color: 'deep cherry red hair, burgundy-wine undertones, very saturated and rich, glossy like a luxury car paint but natural hair texture, deep red in shadows and vibrant cherry in highlights',
  },
  {
    name: 'Cherry Burgundy Gloss',
    color: 'cherry burgundy hair color, deep wine-red, extremely saturated and glossy, jewel-toned red like a ruby gemstone, rich and luxurious red hair',
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function urlToBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
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

async function runColorTest(colorTest, base64Images, index) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎨 Test ${index + 1}: ${colorTest.name}`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`   Color: ${colorTest.color.substring(0, 80)}...`);
  
  const prompt = `can you please try to reproduce the exact same woman provided in the 5 pictures. but you'll have one mission: change her hair color to ${colorTest.color}. simply create a portrait as on photo provided 1. with the new color. don't change anything else - same face, same freckles, same beauty marks, same star necklace.`;
  
  const startTime = Date.now();
  
  try {
    console.log(`   ⏳ Generating...`);
    
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt,
        image_input: base64Images,
        aspect_ratio: '3:4',
        output_format: 'jpg',
        safety_filter_level: 'block_only_high',
      },
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  Duration: ${duration}s`);
    
    const imageUrl = extractUrl(output);
    if (!imageUrl) {
      console.log(`   ❌ No valid URL`);
      return { success: false, name: colorTest.name };
    }
    
    console.log(`   ✅ Generated!`);
    
    const filename = `mila-${colorTest.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
    const filepath = path.join(outputDir, filename);
    await downloadImage(imageUrl, filepath);
    console.log(`   💾 Saved: ${filename}`);
    
    return { success: true, name: colorTest.name, filepath, duration };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, name: colorTest.name, error: error.message };
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🚗 MILA HAIR COLOR - TESLA RED INSPIRED                    ║
║     Deep Cherry Wine Red - Like Tesla Ultra Red                ║
╠════════════════════════════════════════════════════════════════╣
║  Testing 3 variations of the Tesla Red color for hair          ║
╚════════════════════════════════════════════════════════════════╝
`);

  // Convert references to base64 once
  console.log(`⏳ Converting ${MILA_REFS.length} images to base64...`);
  const base64Images = await Promise.all(MILA_REFS.map(url => urlToBase64(url)));
  console.log(`✅ Converted to base64\n`);
  
  const results = [];
  for (let i = 0; i < COLOR_TESTS.length; i++) {
    results.push(await runColorTest(COLOR_TESTS[i], base64Images, i));
  }
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`                    📊 SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);
  
  const successful = results.filter(r => r.success);
  console.log(`✅ ${successful.length}/${COLOR_TESTS.length} successful\n`);
  
  successful.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name}`);
    console.log(`      ${r.filepath}\n`);
  });
  
  console.log(`\n🎯 All images saved in: ${outputDir}`);
}

main().catch(console.error);

