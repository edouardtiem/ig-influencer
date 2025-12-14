#!/usr/bin/env node
/**
 * Generate Cozy Christmas Home Carousel - 4 photos
 * Inspired by @mathildtantot Christmas at home vibe
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

const FACE_REFS = [
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767097/Photo_1_ewwkky.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_2_q8kxit.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767098/Photo_3_nopedx.png',
  'https://res.cloudinary.com/dily60mr0/image/upload/v1764767099/Photo_4_pna4fo.png',
];

// Mila's apartment reference
const APARTMENT_REF = 'https://res.cloudinary.com/dily60mr0/image/upload/v1764794600/2._Salon_Paris_ltyd8r.png';

async function urlToBase64(url) {
  const res = await fetch(url);
  const buf = await res.arrayBuffer();
  return `data:${res.headers.get('content-type')};base64,${Buffer.from(buf).toString('base64')}`;
}

async function fileToBase64(filePath) {
  const buf = fs.readFileSync(filePath);
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

const MILA_BASE = `Young French woman Mila, 22 years old, copper auburn curly hair type 3A shoulder-length messy bedhead style, hazel-green eyes with golden flecks, oval face with high cheekbones, light tan Mediterranean skin, small beauty mark above left lip, thin gold necklace with star pendant, slim athletic physique 168cm, natural curves`;

const NEGATIVE = `cartoon, anime, illustration, 3D render, CGI, deformed face, deformed body, blurry, bad anatomy, extra limbs, watermark, text, logo, plastic skin, wrong hair color, straight hair, tattoos, glasses, heavy makeup`;

// 4 Carousel Prompts - Cozy Christmas at Home
const CAROUSEL_PROMPTS = [
  // Photo 1: Standing in living room, Christmas vibes (inspired by photo 5)
  {
    name: 'xmas-01-living-room',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, cozy home moment, warm evening lighting,

${MILA_BASE},

[OUTFIT] Oversized cream knit sweater falling off one shoulder, tiny navy blue plaid sleep shorts, barefoot, messy hair just woke up vibe,

[POSE] Standing in living room in front of TV showing Christmas movie, one hand rubbing eyes sleepily, other hand hanging by side, relaxed sleepy stance, looking toward camera with soft tired smile,

[SETTING] Cozy Parisian apartment living room, large TV on wall showing Christmas fireplace video, decorative fireplace mantel with candles and small Christmas decorations, warm ambient lighting, evening atmosphere, beige and cream tones,

[LIGHTING] Warm golden evening indoor lighting, TV glow, candle light from mantel, soft cozy ambient,

[MOOD] Cozy Christmas vibes, sleepy Sunday evening, lazy homebody energy, intimate casual moment,

[QUALITY] high resolution, natural skin texture, Instagram-ready, candid authentic feel,

${NEGATIVE}`
  },
  
  // Photo 2: On bed from behind (inspired by photo 2)
  {
    name: 'xmas-02-bed-cozy',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, intimate bedroom moment, warm evening lighting,

${MILA_BASE},

[OUTFIT] Cozy oversized grey knit sweater, matching grey knit shorts, thick cream wool socks,

[POSE] Kneeling on bed facing away from camera toward window, back view, looking out the window at evening city lights, relaxed shoulders, hair falling naturally down back, peaceful contemplative moment,

[SETTING] Cozy bedroom in Parisian apartment, soft white bedding and pillows, warm ambient lamp on nightstand, evening outside window visible, soft neutral tones, minimal Christmas fairy lights on wall,

[LIGHTING] Warm golden lamp light from side, soft evening glow from window, intimate cozy lighting,

[MOOD] Peaceful evening moment, contemplative, cozy winter night, intimate home vibes,

[QUALITY] high resolution, natural skin texture, Instagram-ready, candid authentic feel,

${NEGATIVE}`
  },
  
  // Photo 3: In kitchen from behind (inspired by photo 3)
  {
    name: 'xmas-03-kitchen',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, cozy home morning, natural kitchen lighting,

${MILA_BASE},

[OUTFIT] Oversized navy blue fuzzy hoodie with cute teddy bear print, matching tiny sleep shorts barely visible under hoodie, thick cozy cream socks,

[POSE] Standing in kitchen from behind facing the counter, making morning coffee or tea, weight on one leg casual stance, head slightly turned to side showing profile, messy bedhead hair,

[SETTING] Small Parisian apartment kitchen, modern grey cabinets, black stove, white countertops, morning light from window, coffee machine, small Christmas decoration on counter, lived-in cozy feel,

[LIGHTING] Soft morning daylight from kitchen window, natural indoor ambient, warm cozy tones,

[MOOD] Lazy morning routine, cozy weekend vibes, making coffee in comfy clothes, authentic home moment,

[QUALITY] high resolution, natural skin texture, Instagram-ready, candid authentic feel,

${NEGATIVE}`
  },
  
  // Photo 4: Lying on couch with phone (inspired by photo 6)
  {
    name: 'xmas-04-couch',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, cozy couch moment, warm evening lighting,

${MILA_BASE},

[OUTFIT] Oversized cream cashmere sweater, tiny grey sleep shorts, bare legs, cozy position,

[POSE] Lying on couch on her side, head resting on pillow, holding phone up scrolling, legs curled up comfortably, relaxed lazy position, soft expression looking at phone screen,

[SETTING] Cozy Parisian apartment living room, large comfortable grey-green sofa with plush pillows including Christmas themed cushion, soft blanket draped, warm ambient lighting, evening atmosphere, candles visible on shelf,

[LIGHTING] Warm golden evening lamp light, soft ambient glow, phone screen illuminating face slightly, cozy intimate lighting,

[MOOD] Lazy Sunday evening, scrolling phone on couch, ultimate cozy comfort, relaxed homebody energy,

[QUALITY] high resolution, natural skin texture, Instagram-ready, candid authentic feel,

${NEGATIVE}`
  }
];

const CAPTION = `Dear Santa, I don't know if I've been nice this year... 🎄

Mode cocooning activé 🧸
Pyjama toute la journée = dimanche parfait

Swipe pour voir ma journée productive (spoiler: j'ai pas bougé du canap) 😴

.
.
.
#sundayvibes #cozyathome #christmasvibes #homebody #lazysunday #parisienne #wintermood #cozyhome #weekendmood`;

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
      
      const outDir = path.join(__dirname, '..', 'generated', 'xmas-cozy-carousel');
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
  console.log('🎄 Starting Cozy Christmas Carousel generation (4 photos)...\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  console.log('📷 Converting references...');
  const faceRefs = await Promise.all(FACE_REFS.map(urlToBase64));
  const apartmentRef = await urlToBase64(APARTMENT_REF);
  console.log('   ✅ References ready');
  
  const cloudinaryUrls = [];
  let photo1Base64 = null;
  
  for (let i = 0; i < CAROUSEL_PROMPTS.length; i++) {
    try {
      // Build references: apartment + face refs + photo1 for consistency
      let refs = [apartmentRef, ...faceRefs];
      if (i > 0 && photo1Base64) {
        refs = [photo1Base64, apartmentRef, ...faceRefs];
        console.log(`   🔗 Using photo 1 as scene reference`);
      }
      
      const result = await generateImage(replicate, CAROUSEL_PROMPTS[i].prompt, refs, i);
      
      if (i === 0) {
        photo1Base64 = await fileToBase64(result.data);
        console.log('   📌 Photo 1 saved as scene reference');
      }
      
      console.log(`   📤 Uploading to Cloudinary...`);
      const upload = await cloudinary.uploader.upload(result.data, {
        folder: 'mila-posts/xmas-cozy-carousel',
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
  const outDir = path.join(__dirname, '..', 'generated', 'xmas-cozy-carousel');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'urls.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    urls: cloudinaryUrls,
    caption: CAPTION,
  }, null, 2));
  
  console.log('\n🎉 Done! Check the images before posting.');
}

main().catch(e => console.error('❌ Error:', e.message));
