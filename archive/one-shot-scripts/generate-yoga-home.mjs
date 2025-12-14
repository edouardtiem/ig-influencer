#!/usr/bin/env node
/**
 * Generate home yoga/stretching - softer approach that should pass filter
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

// Home yoga stretching - more wholesome angle
const PROMPT = `Amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, Instagram 2025 aesthetic, wellness moment,

Young French woman, 22 years old, copper auburn curly hair in messy bun, hazel-green eyes, oval face, light tan Mediterranean skin, beauty mark above left lip, freckles, gold star necklace, slim athletic figure,

[SCENE] Evening yoga stretching session at home, self-care Saturday routine.

[OUTFIT - COZY ATHLETIC]
Comfortable oversized cropped sweatshirt in soft grey, matching joggers or comfortable athletic pants, barefoot on yoga mat, hair up in messy bun, relaxed athleisure look.

[POSE - SEATED STRETCH]
Sitting on yoga mat in living room, doing a gentle seated forward fold stretch, reaching toward her feet, peaceful relaxed expression, self-care moment, wellness routine.

[SETTING - HOME EVENING]
Cozy Parisian apartment living room, yoga mat on floor, candles lit nearby, warm lamp lighting, evening self-care atmosphere, comfortable home environment.

[LIGHTING - 16h DECEMBER]
Warm indoor lighting from lamps, candles adding soft glow, grey winter dusk visible through windows, cozy evening atmosphere, soft flattering light.

[MOOD]
Self-care Saturday, wellness routine, gentle stretching after a long week, peaceful moment, mindfulness, recovery and relaxation, Instagram wellness aesthetic.

--no tattoos, --no explicit, --no inappropriate`;

const CAPTION = `16h. Stretching post-soirée = survie 🧘‍♀️

Mon corps après hier soir: "tu te moques de moi ?"
Moi: "on va faire un peu de yoga ça va aller"

Le samedi c'est fait pour récupérer non ? 😅

Vous aussi le sport du samedi c'est plutôt... étirements ? 

.
.
.
#saturdayyoga #homeworkout #selfcaresaturday #yogaathome #stretchingtime #wellnessjourney #parisienne #recoveryday #mindfulness #weekendvibes`;

async function main() {
  console.log('🧘 Generating: Home yoga stretching (16h)');
  
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
    if (chunks.length === 0) throw new Error('Blocked by filter');
    
    const combined = new Uint8Array(chunks.reduce((s,c) => s + c.length, 0));
    let offset = 0;
    chunks.forEach(c => { combined.set(c, offset); offset += c.length; });
    
    const outDir = path.join(__dirname, '..', 'generated', 'tomorrow-posts');
    fs.mkdirSync(outDir, { recursive: true });
    imagePath = path.join(outDir, `yoga-home-${Date.now()}.jpg`);
    fs.writeFileSync(imagePath, combined);
    console.log('💾 Saved:', path.basename(imagePath));
  } else {
    throw new Error('Blocked');
  }
  
  console.log('📤 Uploading...');
  const upload = await cloudinary.uploader.upload(imagePath, {
    folder: 'mila-posts/tomorrow',
    public_id: `yoga-home-${Date.now()}`,
  });
  
  console.log('\n✅ SUCCESS!');
  console.log('📸', upload.secure_url);
}

main().catch(e => console.error('❌', e.message));

