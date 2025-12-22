#!/usr/bin/env node
/**
 * Test Mila Red Hair - V3 - Ultra Specific Prompt
 * Very detailed instructions on what to do with each reference
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

// References
const MILA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png';
const MILA_BODY_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_5_kyx12v.png';

// Output
const outputDir = path.join(__dirname, '../generated/mila-red-hair-test');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════
// ULTRA SPECIFIC PROMPT V3
// ═══════════════════════════════════════════════════════════════

const ULTRA_SPECIFIC_PROMPT = `
=== OBJECTIVE ===
Take the reference photos and create a new portrait with ONE SINGLE MODIFICATION: change the hair color from copper auburn to DEEP AUBURN RED.

=== REFERENCE IMAGE 1 (FACE) ===
This is the FACE REFERENCE. You must EXACTLY REPRODUCE:
- The exact face shape (oval, elongated)
- The exact facial features (nose, lips, chin, cheekbones)
- The exact eye shape and color (almond-shaped, hazel-green with golden flecks)
- The exact eyebrows (natural, slightly arched)
- The exact skin tone (Mediterranean light tan)
- The exact freckles pattern (20-25 light golden-brown freckles on nose bridge and cheekbones)
- The exact beauty mark above the left lip corner (small, dark brown, 2mm)
- The exact beauty mark on the right cheekbone (medium brown)
- The exact expression style
- The exact gold necklace with star pendant

=== REFERENCE IMAGE 2 (BODY) ===
This is the BODY REFERENCE. You must EXACTLY REPRODUCE:
- The exact body type (slim athletic, 168cm appearance)
- The exact proportions (defined waist, toned shoulders)
- The exact skin tone consistency

=== THE ONLY CHANGE TO MAKE ===
HAIR COLOR MODIFICATION:
- FROM: Copper auburn (warm orange-brown tones as shown in references)
- TO: Deep auburn red (rich, saturated, vibrant red tones - think cherry-red auburn, burgundy-red)

DO NOT CHANGE:
- Hair texture (keep type 3A loose curls)
- Hair length (keep shoulder-length)
- Hair volume (keep natural volume)

=== OUTPUT SPECIFICATIONS ===
- Portrait photo, upper body visible
- Natural daylight lighting
- Clean simple background
- Soft confident smile
- Looking at camera
- Instagram-ready quality

=== CRITICAL INSTRUCTION ===
The face MUST be identical to Reference Image 1. If someone compared the output to Reference Image 1, they should recognize it as THE SAME PERSON, just with different hair color.
`;

// Alternative prompts to test
const PROMPTS = [
  {
    name: 'Ultra Specific V3',
    prompt: ULTRA_SPECIFIC_PROMPT,
  },
  {
    name: 'Direct Command Style',
    prompt: `COMMAND: Reproduce the woman from the reference images with modified hair color.

REFERENCE IMAGE 1 = Her face. Copy this face EXACTLY. Every feature, every freckle, every beauty mark.
REFERENCE IMAGE 2 = Her body. Copy this body type EXACTLY.

MODIFICATION: Change hair color from copper-auburn to DEEP AUBURN RED (saturated cherry-red burgundy tones).

KEEP UNCHANGED:
- Face: 100% identical to reference 1
- Freckles: same pattern on nose and cheeks
- Beauty marks: above left lip + right cheekbone
- Eyes: hazel-green
- Necklace: gold chain with star pendant
- Hair texture: curly (type 3A loose curls)
- Hair length: shoulder-length
- Body: same as reference 2

CHANGE ONLY:
- Hair color: copper → deep red/burgundy

OUTPUT: Portrait, natural light, warm smile, clean background.

The result must look like THE SAME WOMAN as in the references, just after dying her hair red.`,
  },
  {
    name: 'Before After Style',
    prompt: `TASK: Create an "AFTER" photo based on "BEFORE" reference images.

BEFORE (Reference images):
- Image 1 shows a woman's face with copper auburn curly hair
- Image 2 shows the same woman's body

AFTER (What to generate):
- THE EXACT SAME WOMAN
- THE EXACT SAME FACE (copy every detail from Image 1)
- THE EXACT SAME BODY (copy proportions from Image 2)
- BUT with DEEP AUBURN RED HAIR instead of copper auburn

Hair color change details:
- Old color: warm copper-auburn (orange-brown undertones)
- New color: deep auburn red (rich saturated red, cherry-burgundy tones)
- Keep: curly texture, shoulder length, natural volume

Face details to preserve exactly:
- Oval face shape with high cheekbones
- Hazel-green eyes with golden flecks
- Small beauty mark above left lip
- Beauty mark on right cheekbone
- Freckles across nose and cheeks
- Gold star pendant necklace

Generate: Portrait photo, natural lighting, confident smile, simple background.

IMPORTANT: Anyone who knows this woman should instantly recognize her in the output - only her hair color is different.`,
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
    console.log(`   📸 Face ref: Photo_1_ewwkky.png`);
    console.log(`   📸 Body ref: Photo_5_kyx12v.png`);
    console.log(`   ⏳ Running...`);
    
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
    if (!imageUrl) {
      console.log(`   ❌ No valid URL`);
      return { success: false, name: test.name };
    }
    
    console.log(`   ✅ Generated!`);
    
    const filename = `nanobanana-v3-${test.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.jpg`;
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
║     🔴 MILA RED HAIR - NANO BANANA PRO V3                      ║
║     ULTRA SPECIFIC PROMPTS                                     ║
╠════════════════════════════════════════════════════════════════╣
║  Objective: Copy face exactly, change ONLY hair color          ║
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

