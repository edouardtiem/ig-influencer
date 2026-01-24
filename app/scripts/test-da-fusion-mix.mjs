/**
 * DA Test: Fusion Mix
 * 
 * Editorial Mess × Annotated Life
 * = Polaroid held in hand with sexy fashion editorial photo inside
 * 
 * Using official Elena config from scheduled-post.mjs
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env manually
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) process.env[key.trim()] = val.join('=').trim();
  });
}

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

// Official Elena face reference from scheduled-post.mjs
const ELENA_FACE_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1765967140/replicate-prediction-qh51japkxxrma0cv52x8qs7mnc_ltc9ra.png';

// Elena reference instruction (official)
const ELENA_REFERENCE_INSTRUCTION = `You are provided with a FACE REFERENCE image.

**IMAGE 1 (FACE REFERENCE)**: This is Elena's face. Copy this EXACTLY:
- Same soft round pleasant face shape (NOT angular, NOT sharp jawline)
- Same smooth feminine jawline and rounded chin
- Same honey brown warm almond-shaped eyes
- Same naturally full lips nude-pink color
- Same small beauty mark on right cheekbone (SIGNATURE MARK)
- Same bronde hair with VISIBLE golden blonde balayage highlights (NOT solid dark brown)
- Same naturally thick well-groomed eyebrows

BODY DESCRIPTION (no reference image):
- Feminine shapely figure 172cm tall
- Large natural bust, narrow defined waist, wide feminine hips
- Healthy fit Italian body type, confident posture

CRITICAL RULES:
- Face MUST be identical to the reference image - same person, same features
- Do NOT change face to look more "model-like" or angular
- Hair MUST show visible golden blonde balayage highlights, NOT solid dark brown`;

const ELENA_FACE_DESCRIPTION = `soft round pleasant face NOT angular, warm approachable features,
smooth feminine jawline, rounded chin, soft cheekbones,
bronde hair dark roots with golden blonde balayage, long voluminous beach waves past shoulders,
honey brown warm almond-shaped eyes, naturally thick eyebrows well-groomed,
small straight nose, naturally full lips nude-pink color`;

const ELENA_MARKS = `small beauty mark on right cheekbone (SIGNATURE),
glowing sun-kissed Italian skin tone,
gold chunky chain bracelet on left wrist ALWAYS visible,
layered gold necklaces with medallion pendant ALWAYS visible`;

const ELENA_BODY = `feminine shapely figure 172cm tall,
very large natural breasts prominent and natural shape,
narrow defined waist, wide feminine hips,
healthy fit Italian body, confident posture`;

// Extract URL from various output formats
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

const PROMPTS = [
  {
    name: "Polaroid Fashion Sexy v1",
    prompt: `${ELENA_REFERENCE_INSTRUCTION}

A feminine hand holding a Polaroid instant photo against a neutral warm background.

INSIDE THE POLAROID - ELENA (copy face from reference EXACTLY):
${ELENA_FACE_DESCRIPTION}
${ELENA_MARKS}
${ELENA_BODY}

Sexy fashion editorial photograph.
Elena sitting on edge of unmade bed, messy white linen sheets.
Wearing sleek black bodysuit, fitted and elegant, confident silhouette.
One hand running through her tousled bronde hair with golden highlights.
Confident warm gaze at camera, sophisticated smile.
Natural morning light from window, warm golden tones.
High fashion meets intimate boudoir moment.

THE POLAROID FRAME:
Classic white Polaroid border, slightly tilted angle.
Feminine hand holding it with minimalist gold ring.
Warm neutral background, soft shadows.
Authentic vintage Polaroid color tone inside.

SINGLE IMAGE ONLY - NO collages, NO grids.
Shallow depth of field, focus on the Polaroid.`,
  },
  {
    name: "Polaroid Fashion Sexy v2",
    prompt: `${ELENA_REFERENCE_INSTRUCTION}

Close-up of a hand holding an instant Polaroid photograph.

THE PHOTO INSIDE THE POLAROID - ELENA (copy face from reference EXACTLY):
${ELENA_FACE_DESCRIPTION}
${ELENA_MARKS}
${ELENA_BODY}

Elena in a fashion editorial pose on a luxurious bed.
Wearing black lace-trimmed silk slip, elegant draping.
Sitting elegantly, legs tucked, confident feminine pose.
Looking at camera with enchanting warm smile, glamorous confidence.
Her bronde hair with golden balayage catching the light.
Natural morning light, soft golden hour tones.
Fashion magazine quality, intimate bedroom setting.

POLAROID DETAILS:
White instant film border, authentic vintage aesthetic.
Hand with delicate gold bracelet holding it.
Wooden surface visible underneath.
Slight warm light leak on Polaroid edge.

SINGLE IMAGE ONLY - NO collages, NO grids.
Scrapbook aesthetic, intimate fashion memories.`,
  },
  {
    name: "Polaroid Fashion Sexy v3",
    prompt: `${ELENA_REFERENCE_INSTRUCTION}

Aesthetic composition: a Polaroid photo held over messy white bed sheets.

THE POLAROID SHOWS - ELENA (copy face from reference EXACTLY):
${ELENA_FACE_DESCRIPTION}
${ELENA_MARKS}
${ELENA_BODY}

Sexy editorial photo of Elena.
Standing by window in fitted black two-piece set, crop top and high-waisted bottoms.
Natural morning light creating beautiful silhouette.
Hand on hip, confident glamorous expression.
Her bronde hair with visible golden blonde balayage flowing.
Warm golden hour lighting on her sun-kissed Italian skin.
High fashion editorial meets intimate morning moment.

COMPOSITION:
The Polaroid is held above crumpled white linen bed.
Gold layered necklaces visible next to it.
Coffee cup edge in corner.
Soft natural morning light on everything.
Minimal, aesthetic, intimate mood.

SINGLE IMAGE ONLY - NO collages, NO grids.
Lifestyle aesthetic with high fashion edge.`,
  },
];

async function generateImage(config, index) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🎨 ${index + 1}. ${config.name}`);
  console.log(`${'═'.repeat(60)}`);
  
  const startTime = Date.now();
  
  try {
    const output = await replicate.run("google/nano-banana-pro", {
      input: {
        prompt: config.prompt,
        reference_images: [ELENA_FACE_REF],
        aspect_ratio: "3:4",
        number_of_images: 1,
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ⏱️  ${duration}s`);
    
    const imageUrl = extractUrl(output);
    if (!imageUrl) {
      console.log(`   ❌ No URL extracted`);
      return null;
    }
    
    // Download
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    
    const filename = `da_mix_polaroid_fashion_v${index + 1}.jpg`;
    const filepath = path.join(__dirname, '..', filename);
    fs.writeFileSync(filepath, buffer);
    
    console.log(`   ✅ Saved: ${filename}`);
    return { name: config.name, filepath };
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║     🎨 DA MIX: EDITORIAL MESS × ANNOTATED LIFE                 ║
║     Polaroid held with sexy fashion editorial inside           ║
╚════════════════════════════════════════════════════════════════╝
`);

  const results = [];
  
  for (let i = 0; i < PROMPTS.length; i++) {
    const result = await generateImage(PROMPTS[i], i);
    if (result) results.push(result);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`✅ ${results.length}/${PROMPTS.length} images generated`);
  console.log(`${'═'.repeat(60)}\n`);
  
  results.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.name}`);
    console.log(`      ${r.filepath}\n`);
  });
}

main().catch(console.error);
