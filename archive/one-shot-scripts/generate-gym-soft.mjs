#!/usr/bin/env node
/**
 * Generate gym photo - soft sexy, back view (inspired by successful Bali prompt)
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

const REFS = [
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

// Inspired by successful Bali back-view prompt
const PROMPT = `Amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, Instagram 2025 aesthetic, candid gym moment,

Young French woman, 22 years old, copper auburn curly hair type 3A in high ponytail, athletic physique, light tan Mediterranean skin, gold star necklace,

[SCENE] Gym workout moment, photographed from behind showing her athletic back and figure.

[BACK VIEW - LIKE BALI PHOTO]
Shot from behind, she is facing away from camera toward the gym mirror, we see her toned back and athletic silhouette. She turns her head slightly to the side showing her profile, looking at herself in the mirror with a confident expression. Her ponytail swings to the side.

[ATHLETIC FIGURE]
Slim toned athletic physique visible from behind, feminine hourglass shape, toned shoulders and back muscles from Pilates, natural healthy curves, confident athletic posture.

[OUTFIT - GYM]
Matching workout set in deep burgundy wine color - fitted cropped athletic top showing toned lower back, high-waisted fitted athletic leggings that flatter her figure, white sneakers, wireless earbuds visible.

[SETTING]
Modern gym with large mirrors, weight equipment in background, rubber flooring, typical fitness center. She is standing near the mirror after a set, checking her form.

[LIGHTING - 16h EVENING GYM]
Artificial gym lighting, bright overhead LEDs, dark evening visible through gym windows (December 16h = almost night), indoor fluorescent atmosphere, slight shine on her skin from light workout sweat.

[MOOD]
Fitness motivation, gym selfie culture, confident athletic woman, "checking my progress" moment, back view showing off her hard work, naturally attractive without being explicit.

[COMPOSITION]
Full body shot from behind, mirror visible in front of her showing partial reflection, athletic feminine silhouette, gym environment framing.

--no tattoos, --no front nudity, --no explicit, --no suggestive pose, --no inappropriate`;

const CAPTION = `16h. "Je vais juste faire une petite séance légère"

*fait 1h30 de sport*

Ok le corps a dit non mais j'ai dit oui 💪
Recovery workout = best workout (non?)

Qui d'autre fait du sport post-soirée ? 
Ou c'est juste moi qui suis folle ? 🙃

.
.
.
#gymlife #recoveryworkout #fitnessgirl #workoutmotivation #gymselfie #saturdayworkout #parisfit #fitfrenchgirl #legday #noexcuses`;

async function main() {
  console.log('💪 Generating: Gym back view (soft sexy like Bali)');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  console.log('📷 Converting refs...');
  const refs = await Promise.all(REFS.map(urlToBase64));
  
  console.log('🎨 Generating...');
  const startTime = Date.now();
  
  const output = await replicate.run("google/nano-banana-pro", {
    input: {
      prompt: PROMPT,
      image_input: refs,
      aspect_ratio: "4:5",
      resolution: "2K",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    }
  });
  
  console.log(`⏱️  ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  
  let imagePath;
  if (output && typeof output === 'object' && Symbol.asyncIterator in output) {
    const chunks = [];
    for await (const chunk of output) {
      if (chunk instanceof Uint8Array) chunks.push(chunk);
    }
    if (chunks.length === 0) throw new Error('No image data received');
    
    const combined = new Uint8Array(chunks.reduce((s,c) => s + c.length, 0));
    let offset = 0;
    chunks.forEach(c => { combined.set(c, offset); offset += c.length; });
    
    const outDir = path.join(__dirname, '..', 'generated', 'tomorrow-posts');
    fs.mkdirSync(outDir, { recursive: true });
    imagePath = path.join(outDir, `gym-back-${Date.now()}.jpg`);
    fs.writeFileSync(imagePath, combined);
    console.log('💾 Saved:', path.basename(imagePath));
  } else {
    throw new Error('Unexpected output or blocked by filter');
  }
  
  console.log('📤 Uploading...');
  const upload = await cloudinary.uploader.upload(imagePath, {
    folder: 'mila-posts/tomorrow',
    public_id: `gym-back-${Date.now()}`,
  });
  
  console.log('\n✅ SUCCESS!');
  console.log('📸', upload.secure_url);
  console.log('\n📝 Caption:', CAPTION.split('\n')[0]);
}

main().catch(e => console.error('❌ Error:', e.message));

