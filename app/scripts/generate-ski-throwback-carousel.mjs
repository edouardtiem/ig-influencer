#!/usr/bin/env node
/**
 * Generate Ski Throwback Carousel - 5 photos
 * Inspired by @meghanorourkee Banff ski carousel
 * 
 * Usage: node scripts/generate-ski-throwback-carousel.mjs
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

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

// Face references for consistency
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

const MILA_BASE = `Young French woman Mila, 22 years old, copper auburn curly hair type 3A shoulder-length natural volume, hazel-green eyes with golden flecks, oval face with high cheekbones, light tan Mediterranean skin, small beauty mark above left lip, thin gold necklace with star pendant, slim athletic physique 168cm, natural curves`;

const NEGATIVE = `cartoon, anime, illustration, 3D render, CGI, deformed face, deformed body, blurry, bad anatomy, extra limbs, watermark, text, logo, plastic skin, wrong hair color, straight hair, tattoos, glasses, heavy makeup`;

// 5 Carousel Prompts - Ski Throwback (inspired by Banff post)
const CAROUSEL_PROMPTS = [
  // Photo 1: Side profile looking at mountains (like photo 1)
  {
    name: 'ski-01-profile-mountains',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, winter mountain landscape, natural daylight,

${MILA_BASE},

[OUTFIT] Emerald green fluffy fleece jacket (Polartec style), black fitted ski leggings, cream white knit beanie with pom-pom, hair tucked under beanie with some curls visible at sides,

[POSE] Standing in snow, side profile view, looking toward snowy mountains in distance, serene contemplative expression, one hand slightly adjusting jacket collar, relaxed natural stance,

[SETTING] Stunning snowy mountain landscape, snow-covered wooden cabin visible behind her, massive snow-capped mountain peaks in background, evergreen pine trees covered in fresh snow, bright winter sky, pristine untouched snow on ground,

[LIGHTING] Bright winter daylight, soft diffused light from overcast sky, snow reflecting light, natural outdoor lighting,

[MOOD] Winter wonderland magic, peaceful mountain moment, ski trip nostalgia, adventure and serenity,

[QUALITY] high resolution, natural skin texture, Instagram-ready, candid authentic winter travel feel,

${NEGATIVE}`
  },
  
  // Photo 2: Front facing big smile, hands holding jacket (like photo 2)
  {
    name: 'ski-02-smile-front',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, winter mountain portrait, natural daylight,

${MILA_BASE},

[OUTFIT] Emerald green fluffy fleece jacket zipped up, black fitted ski leggings, cream white knit beanie with pom-pom, hair visible at sides under beanie,

[POSE] Standing in snow facing camera, both hands holding jacket collar near chin cutely, big genuine happy smile showing teeth, eyes bright and joyful, slightly tilted head, playful happy energy,

[SETTING] Snowy mountain background with wooden alpine chalet behind her, massive snow-covered mountain peaks, pine trees with snow, fresh powder snow everywhere, winter ski resort atmosphere,

[LIGHTING] Bright overcast winter daylight, even soft lighting, snow glow reflecting on face,

[MOOD] Pure joy, winter happiness, vacation energy, genuine smile moment, travel fun,

[QUALITY] high resolution, natural skin texture, sharp focus on face, Instagram-ready,

${NEGATIVE}`
  },
  
  // Photo 3: Profile looking up dreamily (like photo 3)
  {
    name: 'ski-03-looking-up',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, winter portrait moment, soft daylight,

${MILA_BASE},

[OUTFIT] Emerald green fluffy fleece jacket, black ski pants, cream white knit beanie with pom-pom, auburn curly hair visible framing face,

[POSE] Three-quarter view, face tilted slightly upward, eyes looking up toward sky or mountains, peaceful dreamy expression, hands near face warming, contemplative beautiful moment,

[SETTING] Snow-covered landscape, wooden cabin in background, tall snow-covered pine trees, majestic mountain peaks, winter wonderland scene, soft mist in distance,

[LIGHTING] Soft diffused winter light, gentle glow on face, natural outdoor lighting, slight warmth despite cold setting,

[MOOD] Dreamy winter moment, peaceful contemplation, beauty in nature, magical atmosphere,

[QUALITY] high resolution, natural skin texture, beautiful portrait lighting, Instagram-ready,

${NEGATIVE}`
  },
  
  // Photo 4: Walking on snowy path, full body (like photo 4)
  {
    name: 'ski-04-walking-snow',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, winter action shot, bright daylight,

${MILA_BASE},

[OUTFIT] Emerald green fluffy fleece jacket slightly open revealing black top underneath, black fitted ski leggings, cream white knit beanie with pom-pom, cream/beige winter boots, hair visible under beanie,

[POSE] Full body shot, walking on snowy path toward camera, mid-stride natural walking pose, one foot forward, happy relaxed smile, arms slightly out for balance, confident casual walk,

[SETTING] Snowy forest path, snow-covered evergreen trees lining both sides, wooden alpine cabin visible in distance, mountain peaks behind, pristine white snow pathway, winter forest trail,

[LIGHTING] Bright winter daylight filtering through trees, natural outdoor light, snow reflecting brightness,

[MOOD] Adventure moment, winter exploration, happy traveler energy, active vacation vibes,

[QUALITY] high resolution, full body visible, sharp focus, Instagram-ready travel photo,

${NEGATIVE}`
  },
  
  // Photo 5: Back view looking at mountains (like photo 5)
  {
    name: 'ski-05-back-view',
    prompt: `Amateur iPhone photo, Instagram 2025 aesthetic, winter landscape moment, natural daylight,

${MILA_BASE},

[OUTFIT] Emerald green fluffy fleece jacket, black ski leggings, cream white knit beanie with pom-pom visible from behind, auburn curly hair peeking out under beanie,

[POSE] Back view shot, standing and looking out at mountain landscape, slightly turned to show quarter profile, hands in pockets or at sides, peaceful stance admiring view,

[SETTING] Epic snowy mountain panorama, tall snow-covered pine trees, wooden cabin to the side, massive mountain range in distance, fresh snow everywhere, pristine winter wilderness, ski resort area,

[LIGHTING] Bright winter daylight, mountains slightly misty in distance, natural outdoor lighting, snow glow,

[MOOD] Taking it all in, travel awe, winter wonder, peaceful adventure, Instagram-worthy moment,

[QUALITY] high resolution, beautiful landscape composition, natural feel, Instagram-ready,

${NEGATIVE}`
  }
];

// Caption with throwback vibe
const CAPTION = `Vous vous souvenez de ce moment ? Moi oui... 🎿❄️

Le ski de l'année dernière. Ces montagnes. Cette neige parfaite.
J'ai retrouvé ces photos et instant nostalgie 🥺

Le froid sur les joues, le soleil d'hiver, les paysages à couper le souffle...
On repart quand ? 🏔️

📍 Memories from the mountains ❄️

Vous êtes plutôt ski ou snowboard ? ⬇️

.
.
.
#throwback #skimemories #winterwonderland #mountainlife #skitrip #snowday #alpinevibes #winteradventure #travelthrowback #skiseason #powderday #mountainlove #wintermagic #skilife #frenchgirl #wanderlust`;

async function generateImage(replicate, prompt, references, index) {
  console.log(`\n📸 Generating image ${index + 1}/5: ${CAROUSEL_PROMPTS[index].name}`);
  
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
      
      const outDir = path.join(__dirname, '..', 'generated', 'ski-throwback-carousel');
      fs.mkdirSync(outDir, { recursive: true });
      const imagePath = path.join(outDir, `${CAROUSEL_PROMPTS[index].name}-${Date.now()}.jpg`);
      fs.writeFileSync(imagePath, combined);
      console.log(`   💾 Saved: ${path.basename(imagePath)}`);
      return { type: 'file', data: imagePath };
    }
  }
  throw new Error('Unexpected output or blocked by filter');
}

// ═══════════════════════════════════════════════════════════════
// INSTAGRAM SCHEDULING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function createMediaContainer(imageUrl, isCarouselItem = false) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  const params = new URLSearchParams({
    image_url: imageUrl,
    access_token: accessToken,
  });

  if (isCarouselItem) {
    params.append('is_carousel_item', 'true');
  }

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${accountId}/media?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Instagram API: ${data.error.message}`);
  }

  return data.id;
}

async function createScheduledCarouselContainer(childrenIds, caption, scheduledTime) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  
  // Convert to Unix timestamp (seconds)
  const timestamp = Math.floor(scheduledTime.getTime() / 1000);

  const params = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    caption: caption,
    access_token: accessToken,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${accountId}/media?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Instagram API: ${data.error.message}`);
  }

  return data.id;
}

async function waitForMediaReady(containerId, maxWaitMs = 180000) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const params = new URLSearchParams({
      fields: 'status_code,status',
      access_token: accessToken,
    });

    const response = await fetch(`${INSTAGRAM_GRAPH_API}/${containerId}?${params}`);
    const data = await response.json();

    if (data.status_code === 'FINISHED') {
      return true;
    }

    if (data.status_code === 'ERROR') {
      throw new Error(`Media processing failed: ${data.status || 'Unknown error'}`);
    }

    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  throw new Error('Media processing timeout');
}

async function scheduleMedia(containerId, scheduledTime) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;
  
  // Convert to Unix timestamp (seconds)
  const timestamp = Math.floor(scheduledTime.getTime() / 1000);

  const params = new URLSearchParams({
    creation_id: containerId,
    scheduled_publish_time: timestamp.toString(),
    access_token: accessToken,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${accountId}/media_publish?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Instagram API: ${data.error.message}`);
  }

  return data.id;
}

async function publishMedia(containerId) {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_ACCOUNT_ID;

  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: accessToken,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${accountId}/media_publish?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(`Instagram API: ${data.error.message}`);
  }

  return data.id;
}

function getTomorrowMorning() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 15, 0, 0); // 9:15 AM
  return tomorrow;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('🎿 Starting Ski Throwback Carousel generation (5 photos)...\n');
  
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  
  console.log('📷 Converting face references...');
  const faceRefs = await Promise.all(FACE_REFS.map(urlToBase64));
  console.log('   ✅ References ready');
  
  const cloudinaryUrls = [];
  let photo1Base64 = null;
  
  for (let i = 0; i < CAROUSEL_PROMPTS.length; i++) {
    try {
      // Use face refs (scene consistency via prompt)
      const refs = faceRefs;
      
      const result = await generateImage(replicate, CAROUSEL_PROMPTS[i].prompt, refs, i);
      
      if (i === 0) {
        photo1Base64 = await fileToBase64(result.data);
        console.log('   📌 Photo 1 saved as reference');
      }
      
      console.log(`   📤 Uploading to Cloudinary...`);
      const upload = await cloudinary.uploader.upload(result.data, {
        folder: 'mila-posts/ski-throwback-carousel',
        public_id: `${CAROUSEL_PROMPTS[i].name}-${Date.now()}`,
      });
      
      cloudinaryUrls.push(upload.secure_url);
      console.log(`   ✅ ${upload.secure_url}`);
      
    } catch (error) {
      console.error(`   ❌ Error on image ${i + 1}:`, error.message);
    }
  }
  
  console.log(`\n✅ Generated ${cloudinaryUrls.length}/5 images`);
  console.log('\n📸 Cloudinary URLs:');
  cloudinaryUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));
  
  // Save URLs
  const outDir = path.join(__dirname, '..', 'generated', 'ski-throwback-carousel');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'urls.json'), JSON.stringify({
    timestamp: new Date().toISOString(),
    urls: cloudinaryUrls,
    caption: CAPTION,
  }, null, 2));
  
  // Schedule to Instagram
  if (cloudinaryUrls.length >= 3) {
    console.log('\n' + '═'.repeat(50));
    console.log('📅 Scheduling carousel to Instagram...\n');
    
    if (!process.env.INSTAGRAM_ACCESS_TOKEN || !process.env.INSTAGRAM_ACCOUNT_ID) {
      console.log('⚠️  Instagram credentials not found - skipping scheduling');
      console.log('   Add INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID to .env.local');
      console.log('\n📝 To post manually, use the URLs above');
    } else {
      try {
        const scheduledTime = getTomorrowMorning();
        console.log(`⏰ Scheduled for: ${scheduledTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
        
        // Step 1: Create containers for each image
        console.log('\n🔨 Creating media containers...');
        const childIds = [];

        for (let i = 0; i < cloudinaryUrls.length; i++) {
          console.log(`   Image ${i + 1}/${cloudinaryUrls.length}...`);
          const containerId = await createMediaContainer(cloudinaryUrls[i], true);
          childIds.push(containerId);
          console.log(`   ✅ Container: ${containerId}`);
          await new Promise(r => setTimeout(r, 1000));
        }

        // Step 2: Wait for all to be ready
        console.log('\n⏳ Waiting for images to process');
        for (let i = 0; i < childIds.length; i++) {
          process.stdout.write(`   Image ${i + 1}: `);
          await waitForMediaReady(childIds[i]);
          console.log(' ✅');
        }

        // Step 3: Create carousel container
        console.log('\n🎠 Creating carousel...');
        const carouselId = await createScheduledCarouselContainer(childIds, CAPTION, scheduledTime);
        console.log(`   ✅ Carousel container: ${carouselId}`);

        // Step 4: Wait for carousel
        process.stdout.write('\n⏳ Processing carousel');
        await waitForMediaReady(carouselId);
        console.log(' ✅');

        // Step 5: Schedule (not publish immediately)
        console.log('\n📅 Scheduling for tomorrow morning...');
        const postId = await scheduleMedia(carouselId, scheduledTime);

        console.log('\n🎉 SUCCESS!');
        console.log(`   Post ID: ${postId}`);
        console.log(`   ⏰ Scheduled: ${scheduledTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}`);
        
      } catch (error) {
        console.error('\n❌ Scheduling error:', error.message);
        console.log('\n📝 You can schedule manually using the URLs above');
      }
    }
  }
  
  console.log('\n📝 Caption:\n');
  console.log(CAPTION);
  console.log('\n🎿 Done!');
}

main().catch(e => console.error('❌ Error:', e.message));





