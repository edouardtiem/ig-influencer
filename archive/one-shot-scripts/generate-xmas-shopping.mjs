#!/usr/bin/env node
/**
 * Generate Christmas shopping photo for 16h (alternative to gym)
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

const PROMPT = `Amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, noise, Instagram 2025 aesthetic, candid moment,

Young French woman, 22 years old, copper auburn curly hair shoulder-length, hazel-green eyes, oval face, light tan Mediterranean skin, small beauty mark above left lip, freckles on nose, gold star necklace, slim athletic figure,

[SCENE] Christmas shopping in Paris, walking past beautiful illuminated shop windows.

[OUTFIT]
Long elegant camel wool coat, cozy cream turtleneck sweater underneath, dark jeans, ankle boots, carrying shopping bags from French boutiques, hair down with natural waves, light natural makeup.

[POSE]
Standing in front of beautifully decorated Christmas shop window, holding shopping bags, looking back at camera over her shoulder with a happy smile, festive shopping day vibes.

[SETTING]
Paris street at dusk, beautiful Christmas window displays with lights and decorations, warm glow from shop windows, other shoppers walking by blurred, festive December atmosphere.

[LIGHTING - 16h DECEMBER DUSK]
Early evening dusk lighting, the sky is dark blue transitioning to night, beautiful warm glow from Christmas lights and shop windows illuminating her face, magical December evening light.

[MOOD]
Christmas shopping joy, festive Parisian winter, holiday season energy, happy shopper moment.

--no tattoos, --no explicit`;

const CAPTION = `16h. Shopping de dernière minute 🎄

Les vitrines de Noël à Paris > everything ✨
(oui j'ai peut-être craqué sur 2-3 trucs pour moi aussi 🙈)

Vous avez fini vos cadeaux ou team last minute ? 

.
.
.
#christmasshopping #parisnoël #holidayshopping #christmasvibes #parisienne #shoppingday #noel2024 #parischristmas #festiveseason`;

async function main() {
  console.log('🎄 Generating: Christmas shopping (16h)');
  
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
    const combined = new Uint8Array(chunks.reduce((s,c) => s + c.length, 0));
    let offset = 0;
    chunks.forEach(c => { combined.set(c, offset); offset += c.length; });
    
    const outDir = path.join(__dirname, '..', 'generated', 'tomorrow-posts');
    fs.mkdirSync(outDir, { recursive: true });
    imagePath = path.join(outDir, `xmas-shopping-${Date.now()}.jpg`);
    fs.writeFileSync(imagePath, combined);
    console.log('💾 Saved:', path.basename(imagePath));
  } else {
    throw new Error('Unexpected output format');
  }
  
  console.log('📤 Uploading...');
  const upload = await cloudinary.uploader.upload(imagePath, {
    folder: 'mila-posts/tomorrow',
    public_id: `xmas-shopping-${Date.now()}`,
  });
  
  console.log('✅', upload.secure_url);
  console.log('\n📝 Caption:', CAPTION.split('\n')[0]);
}

main().catch(e => console.error('❌', e.message));

