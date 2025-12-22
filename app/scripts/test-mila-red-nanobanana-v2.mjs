#!/usr/bin/env node
/**
 * Test Mila Red Hair with Nano Banana Pro - V2
 * Properly structured prompt explaining each reference image role
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════

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

// Mila's references
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const MILA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png';

// Output
const outputDir = path.join(__dirname, '../generated/mila-red-hair-test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// PROMPTS V2 - Explicit role for each reference image
// ═══════════════════════════════════════════════════════════════

const TESTS = [
  // Test 1: Very explicit about image roles
  {
    name: 'Explicit Roles V1',
    prompt: `I am providing 2 reference images of the SAME woman named Mila.

IMAGE 1 (face reference): This shows Mila's exact face - her facial features, expression, freckles, beauty marks, and hazel-green eyes. USE THIS FACE EXACTLY.

IMAGE 2 (body reference): This shows Mila's body type - slim athletic physique. USE THIS BODY TYPE.

YOUR TASK: Generate a NEW photo of this EXACT same woman (Mila) but with ONE change:
- CHANGE: Her hair color from copper auburn to DEEP AUBURN RED (more saturated, richer vibrant red tones)
- KEEP IDENTICAL: Her face, facial features, freckles, beauty marks, eye color, body type
- KEEP: Her gold star pendant necklace
- KEEP: Her curly hair texture (type 3A loose curls, shoulder-length)

Setting: Simple portrait, natural lighting, clean background
Expression: Soft confident smile

The face must be 100% recognizable as the same person from the reference images.`,
  },
  
  // Test 2: Even more structured
  {
    name: 'Structured Instructions',
    prompt: `REFERENCE IMAGES PROVIDED:
- Image 1: Face photo of Mila (source of truth for facial identity)
- Image 2: Body photo of Mila (source of truth for body proportions)

GENERATE: A portrait photo of this EXACT same person with the following specifications:

MUST MATCH REFERENCE EXACTLY:
✓ Face shape, features, proportions from Image 1
✓ Freckles on nose and cheekbones
✓ Beauty mark above left lip
✓ Beauty mark on right cheekbone  
✓ Hazel-green eyes
✓ Gold star pendant necklace
✓ Slim athletic body type from Image 2
✓ Curly hair texture (loose curls)

CHANGE ONLY THIS:
✗ Hair color: copper auburn → DEEP AUBURN RED (saturated, rich, vibrant red)

OUTPUT: Instagram portrait, natural daylight, warm smile, looking at camera`,
  },
  
  // Test 3: Narrative style
  {
    name: 'Narrative Style',
    prompt: `The two reference images show a woman named Mila - a 22 year old French woman with distinctive features: freckles across her nose and cheeks, a small beauty mark above her left lip, another on her right cheekbone, hazel-green eyes, and she always wears a thin gold necklace with a star pendant.

Create a portrait of Mila where she has just dyed her hair. Previously her hair was copper auburn, but now it's a deeper, more vibrant AUBURN RED - think rich cherry-red tones, saturated and warm.

Her face, features, freckles, beauty marks, and everything else must remain IDENTICAL to the reference photos. Only her hair color has changed to this new deep red shade.

Natural lighting portrait, genuine smile, she's happy with her new hair color.`,
  },

  // Test 4: Technical edit style
  {
    name: 'Technical Edit',
    prompt: `EDIT TASK using reference images:

Source identity: The woman in the provided reference images (Image 1 = face, Image 2 = body)

Modification request: Change hair color property only
- Current value: copper auburn  
- New value: deep auburn red (RGB approximately #8B0000 to #A52A2A, warm saturated red)

Preserve all other attributes:
- Facialal geometry: exact match to Image 1
- Skin features: freckles, beauty marks as in Image 1
- Eye color: hazel-green as in Image 1
- Accessories: gold star necklace
- Hair texture: curly type 3A, shoulder length
- Body type: slim athletic as in Image 2

Output format: Portrait photo, 3:4 aspect ratio, natural lighting`,
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
  
  const startTime = Date.now();
  
  try {
    console.log(`   ⏳ Running with explicit reference roles...`);
    console.log(`   📸 Face ref: Photo_1_ewwkky.png`);
    console.log(`   📸 Body ref: Photo_5_kyx12v.png`);
    
    const output = await replicate.run(NANO_BANANA_MODEL, {
      input: {
        prompt: test.prompt,
        reference_images: [MILA_FACE_REF, MILA_BODY_REF],
        aspect_ratio: '3:4',
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
    
    const filename = `nanobanana-v2-${test.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
    const filepath = path.join(outputDir, filename);
    await downloadImage(imageUrl, filepath);
    console.log(`   💾 Saved: ${filename}`);
    
    return { success: true, name: test.name, localPath: filepath, duration: parseFloat(duration) };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, name: test.name, error: error.message };
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🔴 MILA RED HAIR - NANO BANANA PRO V2                      ║
╠════════════════════════════════════════════════════════════════╣
║  Explicit reference image roles in prompt                      ║
║  Goal: Same face, only change hair to deep auburn red          ║
╚════════════════════════════════════════════════════════════════╝
`);
  
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
  
  successful.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name} (${r.duration}s)`);
    console.log(`      ${r.localPath}\n`);
  });
  
  console.log(`\n✨ Check results - face should match original!`);
}

main().catch(console.error);

