#!/usr/bin/env node
/**
 * Generate behind the scenes of lingerie shoot
 * Makeup mirror + silk robe - subtle and teasing
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

const PROMPT = `Amateur iPhone photo, heavy HDR glow, deeply crushed shadows, visible film grain, Instagram 2025 aesthetic, behind the scenes moment,

Young French woman, 22 years old, copper auburn curly hair beautifully styled with soft waves, hazel-green eyes, oval face with high cheekbones, light tan Mediterranean skin, small beauty mark above left lip corner, light freckles, gold star necklace visible, professional glamorous makeup,

[SCENE] Behind the scenes of a professional photo shoot, intimate getting ready moment captured in the mirror.

[OUTFIT - ELEGANT ROBE]
Luxurious champagne cream silk robe, loosely draped and tied at waist, elegant and classy, the robe falls softly off one shoulder slightly, nothing inappropriate visible, just elegant backstage vibes.

[POSE - MIRROR REFLECTION]
Sitting at a professional Hollywood-style makeup vanity mirror with bright round bulb lights surrounding it. We see her reflection in the mirror as she looks at herself with a confident knowing smile, one hand touching her styled hair or adjusting her robe, the other hand resting on the vanity. Intimate backstage moment.

[SETTING - PHOTO STUDIO BACKSTAGE]
Professional photo studio dressing room, large vanity mirror with bright Hollywood lights, makeup products scattered on the vanity table, maybe a glass of champagne nearby, clothing rack slightly visible in background, soft ambient lighting mixed with vanity mirror lights.

[LIGHTING]
Warm vanity mirror bulb lights illuminating her face beautifully, soft backstage ambient light, intimate golden glow, flattering professional lighting setup.

[MOOD]
Glamorous, confident, secretive smile like she knows something we don't, "shooting day" energy, professional but intimate, teasing anticipation, French elegance.

[COMPOSITION]
Mirror reflection shot - we see the mirror with her reflection, the vanity lights framing her face, backstage environment visible, intimate behind the scenes perspective.

--no explicit, --no nudity, --no lingerie visible on body, --no inappropriate, --no cleavage`;

const CAPTION = `Ça intéresse des gens les photos du shooting ? 👀

Non parce que là... je sais pas si je suis prête à les montrer 🙈

(le photographe a dit "c'est les meilleures que j'ai jamais faites" mais bon il dit ça à tout le monde non ?)

Dites-moi en commentaire si vous voulez voir... 
ou pas... 
enfin... peut-être... 
on verra... 😏

.
.
.
#behindthescenes #shootingday #backstage #bts #photoshoot #makeuptime #gettingready #mirrormoment #parisienne #frenchgirl #mysterious`;

async function main() {
  console.log('📸 Generating: Shooting BTS (makeup mirror + robe)');
  
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
    
    const outDir = path.join(__dirname, '..', 'generated');
    fs.mkdirSync(outDir, { recursive: true });
    imagePath = path.join(outDir, `shooting-bts-${Date.now()}.jpg`);
    fs.writeFileSync(imagePath, combined);
    console.log('💾 Saved:', path.basename(imagePath));
  } else {
    throw new Error('Blocked or unexpected output');
  }
  
  console.log('📤 Uploading to Cloudinary...');
  const upload = await cloudinary.uploader.upload(imagePath, {
    folder: 'mila-posts',
    public_id: `shooting-bts-${Date.now()}`,
  });
  
  console.log('\n✅ SUCCESS!');
  console.log('📸', upload.secure_url);
  console.log('\n📝 Caption:');
  console.log(CAPTION);
  
  // Send to Make.com
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (webhookUrl) {
    console.log('\n📡 Sending to Make.com...');
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: upload.secure_url, caption: CAPTION }),
    });
    console.log(res.ok ? '✅ Sent to Buffer!' : '⚠️ Webhook issue');
  }
}

main().catch(e => console.error('❌', e.message));

