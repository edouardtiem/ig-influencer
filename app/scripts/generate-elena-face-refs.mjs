#!/usr/bin/env node
/**
 * Generate Elena face reference images for face swap
 * Uses Nano Banana Pro via Replicate with Elena reference images
 * 
 * Generates: Frontal, 3/4 Profile Left, 3/4 Profile Right
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Replicate from 'replicate';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) {
  console.error('❌ REPLICATE_API_TOKEN not found');
  process.exit(1);
}

const replicate = new Replicate({ auth: REPLICATE_API_TOKEN });

// Elena reference images (from .env.local)
const ELENA_REFERENCES = (process.env.ELENA_REFERENCE_URLS || '').split(',').filter(Boolean);
const ELENA_BASE = process.env.ELENA_BASE_FACE_URL;

console.log(`📸 Found ${ELENA_REFERENCES.length} reference images`);

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../generated/elena-face-references');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ═══════════════════════════════════════════════════════════════
// URL TO BASE64 HELPER
// ═══════════════════════════════════════════════════════════════

async function urlToBase64(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
  
  // Determine mime type
  const contentType = response.headers.get('content-type') || 'image/png';
  return `data:${contentType};base64,${base64}`;
}

// ═══════════════════════════════════════════════════════════════
// ELENA FACE DESCRIPTION — Ultra-detailed from character sheet
// ═══════════════════════════════════════════════════════════════

const ELENA_FACE_BASE = `Based on the provided reference image, same woman same face same features,

close-up portrait headshot photo of a 24 year old Italian woman,

FACE: exactly like reference image, soft round pleasant face NOT angular, warm approachable features,
small beauty mark on right cheekbone,
honey brown warm eyes with inviting gaze,
small refined nose with soft tip,
naturally full lips nude-pink color,
soft natural brows not overdone,
glowing sun-kissed skin with warm undertones,

HAIR: exactly like reference image, bronde hair (dark roots with golden blonde balayage),
long voluminous beach waves,

ACCESSORIES: layered gold necklaces with medallion pendant,

LIGHTING: soft natural studio light, neutral background,
STYLE: professional portrait headshot photography, 8K resolution,
EXPRESSION: warm confident smile, relaxed natural`;

// Face angles to generate
const FACE_ANGLES = [
  {
    name: 'frontal',
    angle: 'looking directly at camera, front view, symmetrical face position, centered portrait',
    filename: 'elena-face-frontal'
  },
  {
    name: '3/4 left',
    angle: 'three-quarter view face turned slightly to the left, classic portrait angle',
    filename: 'elena-face-3quarter-left'
  },
  {
    name: '3/4 right', 
    angle: 'three-quarter view face turned slightly to the right, showing right cheek with beauty mark clearly visible',
    filename: 'elena-face-3quarter-right'
  }
];

const NEGATIVE_PROMPT = `angular face, sharp jawline, square face, different person, different face, skinny, flat chest, small breasts, airbrushed skin, fake looking, oversaturated, plastic skin, cartoon, anime, illustration, deformed, ugly, blurry, low quality, bad anatomy`;

// ═══════════════════════════════════════════════════════════════
// GENERATE WITH NANO BANANA PRO
// ═══════════════════════════════════════════════════════════════

async function generateWithNanoBanana(angle, referenceUrls) {
  const prompt = `${ELENA_FACE_BASE},
ANGLE: ${angle.angle}`;

  console.log(`\n🎨 Generating ${angle.name} view with Nano Banana Pro...`);
  console.log(`📸 Using ${referenceUrls.length} reference images`);
  
  const startTime = Date.now();
  
  try {
    // Convert reference URLs to base64
    console.log('  📤 Converting references to base64...');
    const base64Images = await Promise.all(
      referenceUrls.slice(0, 3).map(url => urlToBase64(url)) // Max 3 refs
    );
    console.log(`  ✅ Converted ${base64Images.length} images`);
    
    const input = {
      prompt: prompt,
      image_input: base64Images,
      aspect_ratio: "1:1",  // Square for face reference
      resolution: "2K",
      output_format: "png",
      safety_filter_level: "block_only_high"
    };
    
    console.log('  🚀 Calling Nano Banana Pro...');
    const output = await replicate.run("google/nano-banana-pro", { input });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`  ✅ Generated in ${duration}s`);
    
    // Handle output - collect binary chunks
    const chunks = [];
    
    if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
      for await (const chunk of output) {
        if (chunk instanceof Uint8Array) {
          chunks.push(chunk);
        } else if (typeof chunk === 'string') {
          return chunk; // Direct URL
        }
      }
    } else if (typeof output === 'string') {
      return output;
    } else if (Array.isArray(output) && typeof output[0] === 'string') {
      return output[0];
    }
    
    // Combine binary chunks into buffer
    if (chunks.length > 0) {
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      return Buffer.from(combined);
    }
    
    throw new Error('No output received');
    
  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    return null;
  }
}

async function saveImage(data, filename) {
  const filepath = path.join(OUTPUT_DIR, `${filename}.png`);
  
  if (Buffer.isBuffer(data)) {
    fs.writeFileSync(filepath, data);
  } else if (typeof data === 'string' && data.startsWith('http')) {
    const response = await fetch(data);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filepath, buffer);
  } else if (typeof data === 'string' && data.startsWith('data:')) {
    const base64 = data.split(',')[1];
    fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
  } else {
    console.log('Unknown data type:', typeof data);
    return null;
  }
  
  console.log(`  💾 Saved: ${path.basename(filepath)}`);
  return filepath;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🎭 Elena Face Reference Generator — Nano Banana Pro');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  
  // Collect all reference URLs
  const allRefs = [];
  if (ELENA_BASE) allRefs.push(ELENA_BASE);
  allRefs.push(...ELENA_REFERENCES.slice(0, 2)); // Add up to 2 more
  
  console.log(`📸 Using ${allRefs.length} reference images:`);
  allRefs.forEach((url, i) => console.log(`  ${i+1}. ...${url.slice(-40)}`));
  console.log('');
  
  if (allRefs.length === 0) {
    console.error('❌ No Elena reference images found in .env.local');
    process.exit(1);
  }
  
  const timestamp = Date.now();
  const savedPaths = [];
  
  // Generate each angle
  for (const angle of FACE_ANGLES) {
    const result = await generateWithNanoBanana(angle, allRefs);
    
    if (result) {
      const filename = `${angle.filename}-${timestamp}`;
      const savedPath = await saveImage(result, filename);
      if (savedPath) savedPaths.push(savedPath);
    }
    
    // Delay between generations
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  ✅ GENERATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log(`Generated ${savedPaths.length}/${FACE_ANGLES.length} face references:`);
  savedPaths.forEach(p => console.log(`  📸 ${path.basename(p)}`));
  
  console.log(`\n📁 All saved to: ${OUTPUT_DIR}`);
  
  // Open folder
  const { exec } = await import('child_process');
  exec(`open "${OUTPUT_DIR}"`);
}

main().catch(console.error);
