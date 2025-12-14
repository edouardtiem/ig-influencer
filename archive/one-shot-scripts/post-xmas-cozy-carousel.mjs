#!/usr/bin/env node
/**
 * Post Cozy Christmas carousel to Instagram
 * 3 photos: Bed (back view) → Living room → Couch
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});

const INSTAGRAM_GRAPH_API = 'https://graph.facebook.com/v21.0';

// 3 photos - Lit en premier, sans la cuisine
const CAROUSEL_IMAGES = [
  // 1. Lit de dos
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765725490/mila-posts/xmas-cozy-carousel/xmas-02-bed-cozy-1765725487870.jpg',
  // 2. Salon devant TV
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765725437/mila-posts/xmas-cozy-carousel/xmas-01-living-room-1765725436285.jpg',
  // 3. Canapé avec téléphone
  'https://res.cloudinary.com/dily60mr0/image/upload/v1765725588/mila-posts/xmas-cozy-carousel/xmas-04-couch-1765725587324.jpg',
];

const CAPTION = `Dear Santa, I don't know if I've been nice this year... 🎄

Retour de la salle → douche → pyjama direct 🧸
Le reste de la journée ne compte pas, non ?

Swipe pour voir comment je récupère après le sport 😴
(spoiler: très efficacement)

.
.
.
#sundayvibes #cozyathome #christmasvibes #postworkout #lazysunday #parisienne #wintermood #cozyhome #gymandchill`;

async function createMediaContainer(imageUrl) {
  const params = new URLSearchParams({
    image_url: imageUrl,
    is_carousel_item: 'true',
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${process.env.INSTAGRAM_ACCOUNT_ID}/media?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) throw new Error(`Instagram API: ${data.error.message}`);
  return data.id;
}

async function createCarouselContainer(childrenIds, caption) {
  const params = new URLSearchParams({
    media_type: 'CAROUSEL',
    children: childrenIds.join(','),
    caption: caption,
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${process.env.INSTAGRAM_ACCOUNT_ID}/media?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) throw new Error(`Instagram API: ${data.error.message}`);
  return data.id;
}

async function waitForMediaReady(containerId, maxWaitMs = 120000) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const params = new URLSearchParams({
      fields: 'status_code,status',
      access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
    });

    const response = await fetch(`${INSTAGRAM_GRAPH_API}/${containerId}?${params}`);
    const data = await response.json();

    if (data.status_code === 'FINISHED') return true;
    if (data.status_code === 'ERROR') throw new Error(`Media failed: ${data.status}`);

    process.stdout.write('.');
    await new Promise(r => setTimeout(r, 2000));
  }
  throw new Error('Timeout');
}

async function publishMedia(containerId) {
  const params = new URLSearchParams({
    creation_id: containerId,
    access_token: process.env.INSTAGRAM_ACCESS_TOKEN,
  });

  const response = await fetch(
    `${INSTAGRAM_GRAPH_API}/${process.env.INSTAGRAM_ACCOUNT_ID}/media_publish?${params}`,
    { method: 'POST' }
  );

  const data = await response.json();
  if (data.error) throw new Error(`Instagram API: ${data.error.message}`);
  return data.id;
}

async function main() {
  console.log('🎄 Posting Cozy Christmas Carousel (3 photos)...\n');

  console.log('📷 Photos:');
  console.log('   1. Lit de dos');
  console.log('   2. Salon devant TV');
  console.log('   3. Canapé avec téléphone\n');

  try {
    console.log('🔨 Creating media containers...');
    const childIds = [];
    for (let i = 0; i < CAROUSEL_IMAGES.length; i++) {
      const id = await createMediaContainer(CAROUSEL_IMAGES[i]);
      childIds.push(id);
      console.log(`   ✅ Image ${i + 1}: ${id}`);
      await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n⏳ Processing images');
    for (let i = 0; i < childIds.length; i++) {
      process.stdout.write(`   Image ${i + 1}: `);
      await waitForMediaReady(childIds[i]);
      console.log(' ✅');
    }

    console.log('\n🎠 Creating carousel...');
    const carouselId = await createCarouselContainer(childIds, CAPTION);
    console.log(`   ✅ Carousel: ${carouselId}`);

    process.stdout.write('\n⏳ Processing carousel');
    await waitForMediaReady(carouselId);
    console.log(' ✅');

    console.log('\n🚀 Publishing...');
    const postId = await publishMedia(carouselId);

    console.log('\n🎉 SUCCESS!');
    console.log(`   Post ID: ${postId}`);
    console.log('\n📱 Check Instagram!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
