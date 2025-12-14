#!/usr/bin/env node
/**
 * Generate 3 coherent photos of Mila leaving a photo shoot - V2
 * Friday evening - getting ready for night out
 * 
 * OUTFIT: Orly lounge style (camel coat + grey hoodie + black mini skirt)
 * 
 * Uses Orly photo + progressive reference for better face consistency
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});

// Base Mila face references
const MILA_REFS = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
];

// Orly photo for outfit & face consistency
const ORLY_PHOTO = path.join(__dirname, '..', 'generated', 'orly-lounge-1765537688661.jpg');

async function urlToBase64(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return `data:${res.headers.get('content-type')};base64,${Buffer.from(buf).toString('base64')}`;
}

async function fileToBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

// ═══════════════════════════════════════════════════════════════
// OUTFIT - Orly Lounge Style
// ═══════════════════════════════════════════════════════════════

const OUTFIT = `[OUTFIT - EXACT SAME IN ALL PHOTOS]
Elegant camel tan wool coat open, soft grey cotton hoodie underneath with hood down, black fitted mini skirt showing toned bare legs, black ankle boots with small heel, thin gold necklace with star pendant visible at neckline, gold small hoop earrings, natural makeup from the shooting still on`;

// ═══════════════════════════════════════════════════════════════
// MILA CHARACTER - Simplified for better consistency
// ═══════════════════════════════════════════════════════════════

const MILA = `Same young French woman in all photos, 22 years old, copper auburn curly hair type 3A shoulder-length with natural messy volume, hazel-green almond eyes, oval face high cheekbones, light tan Mediterranean skin, small dark beauty mark above left lip corner, freckles on nose and cheeks, slim athletic physique, confident posture`;

// ═══════════════════════════════════════════════════════════════
// 3 PHOTOS - Same scene, same outfit, different poses
// ═══════════════════════════════════════════════════════════════

const PHOTOS = [
  {
    name: "post-shoot-walk-1",
    prompt: `2025 instagram style, amateur iPhone photo, heavy HDR glow, deeply crushed shadows, film grain, candid moment,

${MILA},

${OUTFIT},

[POSE] Walking confidently on Parisian sidewalk, mid-stride with coat flowing, one hand in coat pocket, happy genuine smile looking slightly to the side, hair bouncing with movement, full body shot,

[SETTING] December Paris street at golden hour, Haussmann buildings, Christmas lights in background, boutique storefronts with warm lighting, evening atmosphere,

[LIGHTING] Golden hour December sunset, warm orange tones, beautiful rim light on hair, soft shadows,

[MOOD] Friday energy, finished work, excited for the night ahead, confident and radiant`,
  },
  {
    name: "post-shoot-phone-2",
    prompt: `2025 instagram style, amateur iPhone photo, heavy HDR glow, deeply crushed shadows, film grain, candid moment,

${MILA},

${OUTFIT},

[POSE] Standing on same street checking phone with playful amused smile, weight on one leg creating slight hip curve showing mini skirt, phone held up reading message, other hand adjusting hair, candid texting moment, three-quarter body shot,

[SETTING] Same December Paris street golden hour, same Haussmann buildings, same Christmas lights bokeh in background, warm boutique windows,

[LIGHTING] Same golden hour lighting as previous photo, warm tones on face and legs,

[MOOD] Texting friends about tonight plans, playful anticipation, where are we meeting energy`,
  },
  {
    name: "post-shoot-wave-3",
    prompt: `2025 instagram style, amateur iPhone photo, heavy HDR glow, deeply crushed shadows, film grain, candid moment,

${MILA},

${OUTFIT},

[POSE] Walking away down the street, looking back over shoulder with confident knowing smile and playful wave, coat flowing behind her, toned legs visible in mini skirt, hair flowing, dynamic movement captured, full body from behind with face visible looking back,

[SETTING] Same December Paris street, walking toward Christmas lights and café terraces in distance, evening blue hour starting, Parisian atmosphere,

[LIGHTING] Golden hour transitioning to blue hour, beautiful rim light silhouette, warm city glow on her face,

[MOOD] Off to meet friends, Friday night calling, playful goodbye energy, confident stride into the night`,
  },
];

const NEGATIVE = "cartoon, anime, 3D render, deformed, blurry, watermark, text on image, logo, wrong hair color, straight hair, tattoos, 8k, 4k, ultra realistic, different outfit, different coat color, pants, jeans, long skirt";

async function generatePhoto(replicate, prompt, references, name) {
  console.log(`\n🎨 Generating: ${name}`);
  console.log(`   References: ${references.length} images`);
  
  const startTime = Date.now();
  
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: prompt,
      negative_prompt: NEGATIVE,
      image_input: references,
      aspect_ratio: "4:5",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    }
  });
  
  console.log(`   ⏱️  ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  
  if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) chunks.push(chunk);
    }
    if (chunks.length === 0) throw new Error('Blocked by filter');
    
    const combined = new Uint8Array(chunks.reduce((s,c) => s + c.length, 0));
    let offset = 0;
    chunks.forEach(c => { combined.set(c, offset); offset += c.length; });
    
    const outDir = path.join(__dirname, '..', 'generated', 'post-shooting-v2');
    fs.mkdirSync(outDir, { recursive: true });
    const imagePath = path.join(outDir, `${name}-${Date.now()}.jpg`);
    fs.writeFileSync(imagePath, combined);
    console.log(`   💾 Saved: ${path.basename(imagePath)}`);
    
    return imagePath;
  }
  
  throw new Error('Blocked or unexpected output');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📸 POST-SHOOTING V2 — Orly Style Outfit');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Outfit: Camel coat + Grey hoodie + Black mini skirt');
  console.log('Using Orly photo as style reference for better consistency');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Load all references
  console.log('📷 Loading references...');
  const milaRefs = await Promise.all(MILA_REFS.map(urlToBase64));
  const orlyRef = await fileToBase64(ORLY_PHOTO);
  console.log(`   ✅ ${milaRefs.length} base refs + 1 Orly ref loaded\n`);
  
  // Base refs = Mila faces + Orly photo (for outfit & face style)
  const baseRefs = [orlyRef, ...milaRefs]; // Orly first for priority
  
  const generatedPaths = [];
  
  // Photo 1
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHOTO 1/3');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const photo1Path = await generatePhoto(replicate, PHOTOS[0].prompt, baseRefs, PHOTOS[0].name);
  generatedPaths.push(photo1Path);
  
  // Photo 2 - add photo 1
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHOTO 2/3 — Adding Photo 1 as reference');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const photo1Base64 = await fileToBase64(photo1Path);
  const refs2 = [orlyRef, photo1Base64, ...milaRefs];
  const photo2Path = await generatePhoto(replicate, PHOTOS[1].prompt, refs2, PHOTOS[1].name);
  generatedPaths.push(photo2Path);
  
  // Photo 3 - add photos 1 + 2
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHOTO 3/3 — Adding Photos 1+2 as references');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const photo2Base64 = await fileToBase64(photo2Path);
  const refs3 = [orlyRef, photo1Base64, photo2Base64, ...milaRefs];
  const photo3Path = await generatePhoto(replicate, PHOTOS[2].prompt, refs3, PHOTOS[2].name);
  generatedPaths.push(photo3Path);
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ DONE!');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📁 Photos:');
  generatedPaths.forEach((p, i) => console.log(`   ${i + 1}. ${path.basename(p)}`));
  
  console.log('\n📝 CAPTION:');
  console.log('─'.repeat(50));
  console.log(`Fin de shooting, début de week-end 🖤

Entre deux portes — cette énergie du vendredi soir quand le travail est fait et que tout peut arriver.

On se retrouve où ce soir ? 👀

#fridayvibes #shootingday #weekendmood #parisbynight #frenchgirl`);
  console.log('─'.repeat(50));
  
  console.log('\n📍 Location:', path.dirname(generatedPaths[0]));
}

main().catch(e => {
  console.error('\n❌ ERROR:', e.message);
  process.exit(1);
});

