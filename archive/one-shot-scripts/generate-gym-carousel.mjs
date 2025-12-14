#!/usr/bin/env node
/**
 * Generate Gym Carousel - 4 photos of Mila on gym machines
 * Run with: node scripts/generate-gym-carousel.mjs
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

// Face references for Mila consistency
const FACE_REFS = [
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

const MILA_BASE = `Young French woman Mila, 22 years old, copper auburn curly hair type 3A in high ponytail with loose strands framing face, hazel-green eyes with golden flecks, oval elongated face with high cheekbones, light tan Mediterranean skin with healthy glow and light workout sheen, small beauty mark above left lip corner, thin gold necklace with star pendant, slim athletic physique 168cm, toned shoulders and back from Pilates, natural curves`;

const NEGATIVE = `cartoon, anime, illustration, 3D render, CGI, deformed face, deformed body, blurry, bad anatomy, extra limbs, watermark, text, logo, oversaturated, plastic skin, wrong hair color, straight hair, tattoos, glasses, heavy makeup, explicit, nude`;

// 4 Carousel Prompts - Gym Machine Series
const CAROUSEL_PROMPTS = [
  {
    name: 'gym-01-cable-machine',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, candid gym moment, natural gym lighting,

${MILA_BASE},

[OUTFIT] Matching workout set in deep burgundy wine color - fitted cropped athletic tank top, high-waisted fitted athletic leggings, white sneakers, wireless earbuds,

[POSE] Standing at cable machine, pulling handles toward chest, slight side angle showing her athletic form, concentrated expression with slight smile, looking at mirror checking form,

[SETTING] Modern gym interior, cable crossover machine, large wall mirrors, rubber flooring, weight equipment in background, typical Paris fitness center, evening lighting through windows,

[LIGHTING] Bright overhead gym LEDs, evening visible through windows (December = dark at 16h), slight sheen on skin from workout,

[MOOD] Focused workout energy, fitness motivation, confident athletic woman,

[QUALITY] high resolution, sharp focus, natural skin texture, Instagram-ready,

${NEGATIVE}`
  },
  {
    name: 'gym-02-leg-press',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, candid gym moment, natural gym lighting,

${MILA_BASE},

[OUTFIT] Matching workout set in deep burgundy wine color - fitted cropped athletic tank top, high-waisted fitted athletic leggings, white sneakers,

[POSE] Seated on leg press machine, legs extended pushing the platform, hands gripping side handles, looking at camera with confident determined expression, athletic legs visible,

[SETTING] Modern gym interior, leg press machine, same gym environment with mirrors and equipment, rubber flooring, typical Paris fitness center,

[LIGHTING] Bright overhead gym LEDs, consistent with previous photo, light workout sweat visible,

[MOOD] Power moment, strength training, confident athletic woman pushing limits,

[QUALITY] high resolution, sharp focus, natural skin texture, Instagram-ready,

CRITICAL: Use EXACT SAME GYM as reference image. Same mirrors, same equipment style, same lighting, same floor.

${NEGATIVE}`
  },
  {
    name: 'gym-03-lat-pulldown',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, candid gym moment, natural gym lighting,

${MILA_BASE},

[OUTFIT] Matching workout set in deep burgundy wine color - fitted cropped athletic tank top showing toned arms, high-waisted fitted athletic leggings, white sneakers,

[POSE] Seated at lat pulldown machine, gripping wide bar above, pulling down with good form, back arched slightly, arms extended showing muscle definition, focused expression looking slightly up,

[SETTING] Modern gym interior, lat pulldown machine, same gym environment with mirrors behind, rubber flooring, weight stack visible, typical Paris fitness center,

[LIGHTING] Bright overhead gym LEDs, consistent lighting, athletic definition visible on arms and shoulders,

[MOOD] Back workout focus, pulling strength, athletic feminine power,

[QUALITY] high resolution, sharp focus, natural skin texture, Instagram-ready,

CRITICAL: Use EXACT SAME GYM as reference image. Same mirrors, same equipment style, same lighting.

${NEGATIVE}`
  },
  {
    name: 'gym-04-mirror-selfie',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, post-workout gym selfie, natural gym lighting,

${MILA_BASE},

[OUTFIT] Matching workout set in deep burgundy wine color - fitted cropped athletic tank top, high-waisted fitted athletic leggings, white sneakers, wireless earbuds in ears,

[POSE] Standing mirror selfie in gym, one hand holding iPhone taking photo, other hand on hip, full body visible in mirror, slight smile proud expression, post-workout glow, relaxed confident stance,

[SETTING] Same gym, large wall mirror in weight area, dumbbells and equipment visible in background, rubber flooring, typical Paris fitness center,

[LIGHTING] Bright overhead gym LEDs, post-workout healthy glow on skin, evening visible through windows,

[MOOD] Post-workout satisfaction, proud of the session, confident gym selfie energy,

[QUALITY] high resolution, sharp focus on face in mirror, natural skin texture, Instagram-ready,

CRITICAL: Use EXACT SAME GYM as reference image. Same mirrors, same equipment, same floor, same lighting.

${NEGATIVE}`
  }
];

const CAPTION = `Leg day mais en vrai c'est full body 🦵💪

Dimanche = salle vide = bonheur absolu
Pas de queue aux machines, juste moi et mes podcasts 🎧

Qui d'autre profite du dimanche pour s'entraîner tranquille ?

.
.
.
#sundayworkout #gymgirl #legday #fitnessmotivation #parisfit #gymlife #workoutdone`;

async function generateImage(replicate, prompt, references, index) {
  console.log(`\n📸 Generating image ${index + 1}/4: ${CAROUSEL_PROMPTS[index].name}`);
  
  const startTime = Date.now();
  
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: prompt,
      image_input: references,
      aspect_ratio: "4:5",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   ⏱️  Generated in ${duration}s`);
  
  if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) chunks.push(chunk);
    }
    if (chunks.length > 0) {
      const combined = new Uint8Array(chunks.reduce((s,c) => s + c.length, 0));
      let offset = 0;
      chunks.forEach(c => { combined.set(c, offset); offset += c.length; });
      
      const outDir = path.join(__dirname, '..', 'generated', 'gym-carousel');
      fs.mkdirSync(outDir, { recursive: true });
      const imagePath = path.join(outDir, `${CAROUSEL_PROMPTS[index].name}-${Date.now()}.jpg`);
      fs.writeFileSync(imagePath, combined);
      console.log(`   💾 Saved: ${path.basename(imagePath)}`);
      return { type: 'file', data: imagePath };
    }
  }
  throw new Error('Unexpected output or blocked by filter');
}

async function main() {
  console.log('🏋️ Starting Gym Carousel generation (4 photos)...\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  console.log('📷 Converting face references...');
  const faceRefs = await Promise.all(FACE_REFS.map(urlToBase64));
  console.log('   ✅ 4 face refs ready');
  
  const cloudinaryUrls = [];
  let photo1Base64 = null;
  
  for (let i = 0; i < CAROUSEL_PROMPTS.length; i++) {
    try {
      // Build references: face refs + photo1 (from photo 2 onwards)
      let refs = [...faceRefs];
      if (i > 0 && photo1Base64) {
        refs = [photo1Base64, photo1Base64, ...faceRefs]; // Double scene ref for strong consistency
        console.log(`   🔗 Using photo 1 (doubled) as scene reference`);
      }
      
      const result = await generateImage(replicate, CAROUSEL_PROMPTS[i].prompt, refs, i);
      
      // Store first photo for subsequent generations
      if (i === 0) {
        photo1Base64 = await fileToBase64(result.data);
        console.log('   📌 Photo 1 saved as scene reference');
      }
      
      // Upload to Cloudinary
      console.log(`   📤 Uploading to Cloudinary...`);
      const upload = await cloudinary.uploader.upload(result.data, {
        folder: 'mila-posts/gym-carousel',
        public_id: `${CAROUSEL_PROMPTS[i].name}-${Date.now()}`,
      });
      
      cloudinaryUrls.push(upload.secure_url);
      console.log(`   ✅ ${upload.secure_url}`);
      
    } catch (error) {
      console.error(`   ❌ Error on image ${i + 1}:`, error.message);
    }
  }
  
  console.log(`\n✅ Generated ${cloudinaryUrls.length}/4 images`);
  console.log('\n📸 URLs for Instagram:');
  cloudinaryUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
  console.log(`\n📝 Caption:\n${CAPTION}`);
  
  // Save URLs
  const outDir = path.join(__dirname, '..', 'generated', 'gym-carousel');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'urls.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    urls: cloudinaryUrls,
    caption: CAPTION,
  }, null, 2));
  
  console.log('\n🎉 Done! Copy URLs to post on Instagram.');
}

main().catch(e => console.error('❌ Error:', e.message));
