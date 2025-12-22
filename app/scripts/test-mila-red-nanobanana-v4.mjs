#!/usr/bin/env node
/**
 * Test Mila Red Hair - V4 - Single Reference Image
 * Only face reference to maximize facial fidelity
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

// Single face reference only
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';

// Output
const outputDir = path.join(__dirname, '../generated/mila-red-hair-test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// SINGLE REF PROMPTS
// ═══════════════════════════════════════════════════════════════

const PROMPTS = [
  {
    name: 'Single Ref - Face Clone',
    prompt: `TASK: Clone the exact face from the reference photo but change the hair color.

REFERENCE IMAGE:
This is the ONLY reference. Clone this face with 100% accuracy.

WHAT TO COPY EXACTLY FROM REFERENCE:
- Face shape: exact same oval shape
- Eyes: exact same hazel-green color, same shape, same position
- Nose: exact same shape and size
- Lips: exact same shape and color
- Eyebrows: exact same natural arch
- Skin tone: exact same Mediterranean light tan
- Freckles: exact same pattern across nose and cheekbones
- Beauty mark: above left lip corner (small, dark)
- Beauty mark: on right cheekbone
- Necklace: gold chain with star pendant

THE ONLY CHANGE:
Hair color: Change from copper-auburn to DEEP AUBURN RED (rich burgundy-red, cherry-wine tones)

KEEP HAIR PROPERTIES:
- Same curly texture (type 3A loose curls)
- Same shoulder length
- Same volume

OUTPUT: Portrait photo, natural lighting, soft smile, simple background.

CRITICAL: The face must be IDENTICAL to the reference. Only the hair color changes.`,
  },
  {
    name: 'Single Ref - Minimal Change',
    prompt: `Reference image shows the woman to reproduce EXACTLY.

REPRODUCE 100%:
- Her exact face (every feature, freckle, beauty mark)
- Her hazel-green eyes
- Her gold star necklace
- Her curly hair texture and length

CHANGE ONLY:
- Hair color: from copper to deep burgundy red

Generate portrait with natural light, warm expression.`,
  },
  {
    name: 'Single Ref - Photo Edit Style',
    prompt: `This is a photo editing task.

INPUT: Reference image of woman with copper auburn curly hair
OUTPUT: Same exact woman with deep red/burgundy hair

DO NOT CHANGE:
- Face (clone exactly)
- Freckles pattern
- Beauty marks
- Eye color
- Necklace
- Hair texture (keep curls)
- Hair length

ONLY CHANGE:
- Hair color → deep auburn red / burgundy wine color

Result should look like the same person after dying her hair.`,
  },
];

// Helpers
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

// Main
async function runTest(test, index) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔬 Test ${index + 1}: ${test.name}`);
  console.log(`${'═'.repeat(60)}`);
  
  const startTime = Date.now();
  
  try {
    console.log(`   📸 Single ref: Photo_1_ewwkky.png (face only)`);
    console.log(`   ⏳ Running...`);
    
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt: test.prompt,
        reference_images: [MILA_FACE_REF], // Only one reference
        aspect_ratio: '3:4',
        number_of_images: 1,
      },
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  Duration: ${duration}s`);
    
    const imageUrl = extractUrl(output);
    if (!imageUrl) {
      console.log(`   ❌ No valid URL`);
      return { success: false, name: test.name };
    }
    
    console.log(`   ✅ Generated!`);
    
    const filename = `nanobanana-v4-single-${test.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
    const filepath = path.join(outputDir, filename);
    await downloadImage(imageUrl, filepath);
    console.log(`   💾 Saved: ${filename}`);
    
    return { success: true, name: test.name, localPath: filepath, duration };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, name: test.name, error: error.message };
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🔴 MILA RED HAIR - V4 SINGLE REFERENCE                     ║
║     Maximum facial fidelity with one reference only            ║
╠════════════════════════════════════════════════════════════════╣
║  Goal: Clone face exactly, change ONLY hair color              ║
╚════════════════════════════════════════════════════════════════╝
`);
  
  const results = [];
  for (let i = 0; i < PROMPTS.length; i++) {
    results.push(await runTest(PROMPTS[i], i));
  }
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`                    📊 SUMMARY`);
  console.log(`${'═'.repeat(60)}\n`);
  
  const successful = results.filter(r => r.success);
  console.log(`✅ ${successful.length}/${PROMPTS.length} successful\n`);
  
  successful.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name}`);
    console.log(`      ${r.localPath}\n`);
  });
}

main().catch(console.error);

