#!/usr/bin/env node
/**
 * Generate 3 coherent photos of Mila leaving a photo shoot
 * Friday evening - getting ready for night out
 * 
 * Uses progressive reference:
 * - Photo 1: Base generation
 * - Photo 2: Uses Photo 1 as reference
 * - Photo 3: Uses Photos 1+2 as references
 */

import Replicate from 'replicate';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Reference photos for Mila's face consistency
const MILA_REFS = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
];

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
// MILA CHARACTER - Based on docs/03-PERSONNAGE.md
// ═══════════════════════════════════════════════════════════════

const MILA_CHARACTER = `Young French woman Mila, 22 years old, Mediterranean European features, personal trainer physique,

[FACE] oval elongated face shape with high defined cheekbones, copper auburn hair type 3A loose curls shoulder-length with natural volume and slightly messy texture, almond-shaped hazel-green eyes with golden flecks, straight nose with slightly upturned tip, naturally full lips medium thickness with subtle asymmetry,

[DISTINCTIVE MARKS - CRITICAL] small dark brown beauty mark 2mm above left lip corner, medium brown beauty mark on center of right cheekbone, 20-25 light golden-brown freckles concentrated on nose bridge and cheekbones, thin gold necklace with minimalist star pendant always visible,

[BODY] slim athletic physique 168cm, natural full bust DD-cup, defined waist with subtle visible upper abs, slight hourglass curve, toned shoulders Pilates-sculpted feminine, long lean legs with defined quads and calves, toned arms with subtle muscle definition, straight confident posture`;

// ═══════════════════════════════════════════════════════════════
// 3 PHOTOS - Same scene: leaving photo shooting, Friday evening
// ═══════════════════════════════════════════════════════════════

const PHOTOS = [
  {
    name: "sortie-shooting-1",
    prompt: `2025 instagram style, amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, candid authentic moment,

${MILA_CHARACTER}

[OUTFIT - POST SHOOTING CHIC] Wearing elegant black fitted coat open over cream silk camisole, dark blue high waisted jeans, black ankle boots, gold hoop earrings, professional makeup still done from the shooting, hair styled but slightly tousled from the day,

[POSE] Walking confidently out of a building entrance, mid-stride, one hand adjusting her coat, hair flowing slightly, genuine satisfied smile, looking forward with confident energy, Friday evening vibes,

[SETTING] Parisian street in December, building entrance with modern glass door behind her, evening golden hour light, city atmosphere, subtle Christmas decorations visible in distance,

[LIGHTING] Beautiful December golden hour, warm sunset tones mixing with early evening blue, flattering on her face, long soft shadows,

[MOOD] Accomplished after a great shoot, excited for Friday night out, confident and radiant, professional satisfaction meets weekend anticipation`,
  },
  {
    name: "sortie-shooting-2",
    prompt: `2025 instagram style, amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, candid authentic moment,

${MILA_CHARACTER}

[OUTFIT - SAME AS PREVIOUS] Wearing same elegant black fitted coat open over cream silk camisole, same dark blue high waisted jeans, same black ankle boots, same gold hoop earrings, professional makeup still done from the shooting, hair styled but slightly tousled,

[POSE] Stopped on the sidewalk checking her phone with a playful smile, reading a message about tonight's plans, slight hip pop, relaxed stance, one hand holding phone other hand in coat pocket, looking down at screen with amused expression,

[SETTING] Same Parisian street December evening, standing near the curb, boutique window with warm lights behind her, same golden hour lighting, evening city atmosphere,

[LIGHTING] Same December golden hour as previous photo, warm tones, beautiful evening light on her face,

[MOOD] Texting friends about Friday night plans, excited anticipation, playful energy, checking where to meet for the soirée`,
  },
  {
    name: "sortie-shooting-3",
    prompt: `2025 instagram style, amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, candid authentic moment,

${MILA_CHARACTER}

[OUTFIT - SAME AS PREVIOUS PHOTOS] Wearing same elegant black fitted coat open over cream silk camisole, same dark blue high waisted jeans, same black ankle boots, same gold hoop earrings, same professional makeup, same hair styled but slightly tousled,

[POSE] Walking away from camera down the Parisian street, looking back over her shoulder at camera with a knowing confident smile, hair flowing, coat moving with her stride, one hand raised in a playful wave goodbye, three-quarter back view,

[SETTING] Same Parisian street December evening, walking toward distant Christmas lights and Haussmann buildings, evening atmosphere, people and cafés blurred in background,

[LIGHTING] Same December golden hour transitioning to blue hour, beautiful rim light on her silhouette, warm city glow,

[MOOD] Off to meet friends, Friday night is calling, playful "see you later" energy, confident stride toward the night ahead`,
  },
];

const NEGATIVE_PROMPT = "cartoon, anime, illustration, 3D render, CGI, deformed face, deformed body, asymmetric eyes, blurry, bad anatomy, extra limbs, extra fingers, watermark, signature, text on image, prompt visible, logo, brand name, oversaturated, plastic doll skin, airbrushed skin, wrong hair color, straight hair, tattoos, glasses, heavy eye makeup, 8k, 4k, ultra realistic, hyper realistic";

// ═══════════════════════════════════════════════════════════════
// CAPTION - Research-based engaging format
// ═══════════════════════════════════════════════════════════════

const CAPTION = `Fin de shooting, début de week-end 🖤

Entre deux portes — cette énergie du vendredi soir quand le travail est fait et que tout peut arriver.

On se retrouve où ce soir ? 👀

#fridayvibes #shootingday #weekendmood #parisbynight #frenchgirl`;

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATION
// ═══════════════════════════════════════════════════════════════

async function generatePhoto(replicate, prompt, references, name) {
  console.log(`\n🎨 Generating: ${name}`);
  console.log(`   References: ${references.length} images`);
  
  const startTime = Date.now();
  
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: prompt,
      negative_prompt: NEGATIVE_PROMPT,
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
    
    const outDir = path.join(__dirname, '..', 'generated', 'post-shooting-carousel');
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
  console.log('📸 POST-SHOOTING CAROUSEL — Friday Evening');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Context: Mila leaving a photo shoot, Friday December evening');
  console.log('Goal: 3 coherent photos, same scene, progressive references');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  // Convert base Mila refs to base64
  console.log('📷 Loading Mila face references...');
  const milaRefs = await Promise.all(MILA_REFS.map(urlToBase64));
  console.log(`   ✅ ${milaRefs.length} references loaded\n`);
  
  const generatedPaths = [];
  
  // Photo 1: Use only Mila base references
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHOTO 1/3 — Base generation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const photo1Path = await generatePhoto(
    replicate, 
    PHOTOS[0].prompt, 
    milaRefs, 
    PHOTOS[0].name
  );
  generatedPaths.push(photo1Path);
  
  // Photo 2: Use Mila refs + Photo 1
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHOTO 2/3 — Using Photo 1 as additional reference');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const photo1Base64 = await fileToBase64(photo1Path);
  const refs2 = [...milaRefs, photo1Base64];
  const photo2Path = await generatePhoto(
    replicate, 
    PHOTOS[1].prompt, 
    refs2, 
    PHOTOS[1].name
  );
  generatedPaths.push(photo2Path);
  
  // Photo 3: Use Mila refs + Photo 1 + Photo 2
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PHOTO 3/3 — Using Photos 1+2 as additional references');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const photo2Base64 = await fileToBase64(photo2Path);
  const refs3 = [...milaRefs, photo1Base64, photo2Base64];
  const photo3Path = await generatePhoto(
    replicate, 
    PHOTOS[2].prompt, 
    refs3, 
    PHOTOS[2].name
  );
  generatedPaths.push(photo3Path);
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('✅ GENERATION COMPLETE!');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  console.log('📁 Generated photos:');
  generatedPaths.forEach((p, i) => {
    console.log(`   ${i + 1}. ${path.basename(p)}`);
  });
  
  console.log('\n📝 CAPTION:');
  console.log('─'.repeat(50));
  console.log(CAPTION);
  console.log('─'.repeat(50));
  
  console.log('\n📍 Files location:');
  console.log(`   ${path.dirname(generatedPaths[0])}`);
}

main().catch(e => {
  console.error('\n❌ ERROR:', e.message);
  process.exit(1);
});

